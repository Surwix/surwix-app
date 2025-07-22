import { OpenAI } from 'openai';

import nodemailer from 'nodemailer';

// Инициализируем клиент OpenAI
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
        // --- 1. Получаем данные от OpenAI ---
        console.log(`[1/3] Generating AI data using OpenAI for: ${address}`);
        const prompt = `Act as a U.S. emergency preparedness analyst for the address "${address}". Generate a JSON object with these exact keys: "risk_level_text" (string: "Medium"), "risk_level_color" (string: "medium"), "risks" (an array of 2 objects, each with "type", "level_text", "level_color", "advice"), and "action_steps" (an array of 3 short string sentences). Provide realistic mock data. Your response must be ONLY a valid JSON object without any other text or markdown.`;
        
        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        });
        const reportData = JSON.parse(aiCompletion.choices[0].message.content);
        
        reportData.address = address;
        reportData.report_date = new Date().toLocaleDateString('en-US');
        reportData.report_id = `SRWX-${Date.now()}`;
        console.log('AI data received from OpenAI and parsed successfully.');

        // --- 2. Генерируем PDF с помощью PDFMonkey (исправленная логика) ---
        console.log('[2/3] Sending data to PDFMonkey...');
        const pdfResponse = await fetch('https://api.pdfmonkey.io/api/v1/documents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}`,
            },
            body: JSON.stringify({
                document: {
                    document_template_id: process.env.PDFMONKEY_TEMPLATE_ID,
                    payload: reportData,
                    status: 'draft',
                }
            }),
        });

        if (!pdfResponse.ok) {
            throw new Error(`PDFMonkey Error: ${await pdfResponse.text()}`);
        }
        const pdfData = await pdfResponse.json();
        const pdfUrl = pdfData.document.download_url;
        const pdfDownloadResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfDownloadResponse.arrayBuffer();
        console.log('PDF generated and downloaded from PDFMonkey.');

        // --- 3. Отправляем письмо ---
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
        console.log('Email sent successfully.');

        return response.status(200).json({ message: 'Success! Your report has been generated and sent to your email.' });

    } catch (error) {
        console.error('An error occurred in the main handler:', error);
        return response.status(500).json({ message: 'A server error occurred. Please check the logs.' });
    }
}
