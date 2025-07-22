import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

function createPdfHtml(data) {
    // Helper function to create the HTML for our PDF
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Surwix Evacuation Plan</title>
            <style>
                body { font-family: sans-serif; }
                .container { max-width: 800px; margin: auto; padding: 20px; }
                h1 { color: #003366; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Personal Evacuation Plan</h1>
                <p><strong>Address:</strong> ${data.address}</p>
                <p><strong>Report Date:</strong> ${data.report_date}</p>
                <hr>
                <h2>Primary Advice</h2>
                <p>${data.main_advice || 'Follow directions from local authorities.'}</p>
            </div>
        </body>
        </html>
    `;
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { address, email } = request.body;
    if (!address || !email) {
        return response.status(400).json({ message: 'Address and email are required' });
    }

    try {
        // --- Step 1: Get data from OpenAI ---
        console.log(`[1/3] Getting AI data for: ${address}`);
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `For the U.S. address "${address}", generate a JSON object with one key: "main_advice" (a short sentence).`;
        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        });
        const reportData = JSON.parse(aiCompletion.choices[0].message.content);
        reportData.address = address;
        reportData.report_date = new Date().toLocaleDateString('en-US');
        console.log('AI data received.');

        // --- Step 2: Generate PDF with Api2Pdf (Corrected Logic) ---
        console.log('[2/3] Generating PDF with Api2Pdf...');
        const htmlToConvert = createPdfHtml(reportData);
        
        // ✅ 1. Используем стабильный URL и отправляем запрос на создание PDF
        const api2pdfResponse = await fetch('https://v2018.api2pdf.com/chrome/html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.API2PDF_KEY,
            },
            body: JSON.stringify({ html: htmlToConvert, inlinePdf: false }),
        });

        if (!api2pdfResponse.ok) {
            throw new Error(`Api2Pdf Error: ${await api2pdfResponse.text()}`);
        }

        // ✅ 2. Получаем JSON с ссылкой на готовый файл
        const api2pdfResult = await api2pdfResponse.json();
        const pdfUrl = api2pdfResult.pdf;

        if (!pdfUrl) {
            throw new Error('Api2Pdf did not return a PDF URL.');
        }
        console.log('PDF URL received from Api2Pdf.');

        // ✅ 3. Скачиваем PDF-файл по полученной ссылке
        const pdfDownloadResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfDownloadResponse.arrayBuffer();
        console.log('PDF file downloaded.');

        // --- Step 3: Send email with Nodemailer ---
        console.log(`[3/3] Sending email to: ${email}...`);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        });
        await transporter.sendMail({
            from: `"Surwix Reports" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: `Your Personal Evacuation Plan from Surwix`,
            text: "Thank you for using Surwix. Your AI-generated evacuation plan is attached.",
            attachments: [{
                filename: 'Surwix-Evacuation-Plan.pdf',
                content: Buffer.from(pdfBuffer), // Buffer.from() здесь на всякий случай, т.к. arrayBuffer() уже дает нужный тип
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
