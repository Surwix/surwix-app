import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';

// Sleep util для ожидания PDF
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { address, email } = request.body;
    if (!address || !email) {
        return response.status(400).json({ message: 'Address and email are required' });
    }

    try {
        // --- 1. OpenAI ---
        console.log(`[1/3] Generating AI data using OpenAI for: ${address}`);
        const prompt = `Act as a U.S. emergency preparedness analyst for the address "${address}". Generate a JSON object with these exact keys: "risk_level_text" (string: "Medium"), "risk_level_color" (string: "medium"), "risks" (an array of 2 objects, each with "type", "level_text", "level_color", "advice"), and "action_steps" (an array of 3 short string sentences). Provide realistic mock data. Your response must be ONLY a valid JSON object without any other text or markdown.`;

        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        });
        const reportData = JSON.parse(aiCompletion.choices[0].message.content);

        reportData.address = address;
        reportData.report_date = new Date().toLocaleDateString('EN-US');
        reportData.report_id = `SRWX-${Date.now()}`;
        console.log('AI data received from OpenAI.');

        // --- 2. PDFMonkey: создание документа ---
        console.log('[2/3] Sending data to PDFMonkey...');
        const pdfCreateResponse = await fetch('https://api.pdfmonkey.io/v1/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}`,
            },
            body: JSON.stringify({
                document: {
                    document_template_id: process.env.PDFMONKEY_TEMPLATE_ID,
                    payload: reportData,
                }
            }),
        });

        if (!pdfCreateResponse.ok) {
            throw new Error(`PDFMonkey API Error: ${await pdfCreateResponse.text()}`);
        }

        const pdfCreateData = await pdfCreateResponse.json();
        const documentId = pdfCreateData?.data?.id;
        if (!documentId) {
            console.error('PDFMonkey did not return a document ID:', pdfCreateData);
            throw new Error('PDFMonkey did not return a document ID.');
        }

        // --- Ожидание генерации PDF и polling download_url ---
        let pdfUrl = null;
        let pollAttempt = 0;
        const maxPolls = 12; // до 12 раз (максимум 24 сек ожидания)
        while (pollAttempt < maxPolls) {
            pollAttempt++;
            // Получаем статус документа
            const statusResp = await fetch(`https://api.pdfmonkey.io/v1/documents/${documentId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}` },
            });
            const statusData = await statusResp.json();
            pdfUrl = statusData?.data?.download_url;

            if (pdfUrl) {
                console.log(`[PDFMonkey] PDF ready after ${pollAttempt} poll(s): ${pdfUrl}`);
                break;
            }
            // Ждём 2 секунды между запросами (рекомендовано в PDFMonkey docs)
            await sleep(2000);
        }

        if (!pdfUrl) {
            console.error('CRITICAL: PDFMonkey did not return a download_url after polling.');
            throw new Error('PDFMonkey did not provide download_url. PDF generation may have failed.');
        }

        // --- Скачиваем PDF ---
        console.log('PDF URL received. Downloading file...');
        const pdfDownloadResponse = await fetch(pdfUrl);
        if (!pdfDownloadResponse.ok) {
            throw new Error(`Ошибка при скачивании PDF: ${pdfDownloadResponse.statusText}`);
        }
        const pdfBuffer = await pdfDownloadResponse.arrayBuffer();
        console.log('PDF downloaded.');

        // --- 3. Nodemailer ---
        console.log(`[3/3] Sending email to: ${email}...`);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        });
        await transporter.sendMail({
            from: `"Surwix Reports" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: `Your Personal Evacuation Plan from Surwix`,
            text: "Your AI-generated evacuation plan is attached.",
            attachments: [{
                filename: 'Surwix-Evacuation-Plan.pdf',
                content: Buffer.from(pdfBuffer),
                contentType: 'application/pdf',
            }],
        });
        console.log('Email sent.');

        return response.status(200).json({ message: 'Success! Your report has been generated and sent to your email.' });

    } catch (error) {
        console.error('An error occurred in the main handler:', error);
        return response.status(500).json({ message: 'A server error occurred. Please check the logs.' });
    }
}
