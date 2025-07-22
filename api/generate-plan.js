import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

export default async function handler(request, response) {
    console.log(`[LOG] Function started at ${new Date().toISOString()}`);
    
    const { address, email } = request.body;
    if (!address || !email) {
        return response.status(400).json({ message: 'Address and email are required' });
    }

    try {
        // --- 1. OpenAI ---
        console.log('[LOG] Step 1: Calling OpenAI API...');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `Act as a U.S. emergency preparedness analyst...`; // (prompt сокращен для ясности)
        
        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        });
        const reportData = JSON.parse(aiCompletion.choices[0].message.content);
        console.log('[LOG] Step 1 successful: OpenAI responded.');

        // --- 2. PDFMonkey ---
        console.log('[LOG] Step 2: Calling PDFMonkey API...');
        reportData.address = address;
        reportData.report_date = new Date().toLocaleDateString('en-US');
        reportData.report_id = `SRWX-${Date.now()}`;

        const pdfResponse = await fetch('https://api.pdfmonkey.io/api/v1/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PDFMONKEY_API_KEY}` },
            body: JSON.stringify({ document: { template_id: process.env.PDFMONKEY_TEMPLATE_ID, payload: reportData, status: 'draft' } }),
        });
        console.log(`[LOG] Step 2 successful: PDFMonkey responded with status ${pdfResponse.status}.`);
        
        if (!pdfResponse.ok) throw new Error(`PDFMonkey API Error`);
        const pdfData = await pdfResponse.json();
        const downloadUrl = pdfData.document.download_url;

        // --- 3. PDF Download ---
        console.log('[LOG] Step 3: Downloading the generated PDF...');
        const pdfFileResponse = await fetch(downloadUrl);
        const pdfBuffer = await pdfFileResponse.arrayBuffer();
        console.log('[LOG] Step 3 successful: PDF downloaded.');

        // --- 4. Nodemailer ---
        console.log('[LOG] Step 4: Sending email via Nodemailer...');
        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD } });
        await transporter.sendMail({
            from: `"Surwix Reports" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: `Your Personal Evacuation Plan from Surwix for ${address}`,
            text: "Thank you for using Surwix. Your AI-generated evacuation plan is attached.",
            attachments: [{ filename: 'Surwix-Evacuation-Plan.pdf', content: Buffer.from(pdfBuffer), contentType: 'application/pdf' }],
        });
        console.log('[LOG] Step 4 successful: Email sent.');

        return response.status(200).json({ message: 'Success! Your report has been sent.' });

    } catch (error) {
        console.error('[ERROR] An error occurred:', error);
        return response.status(500).json({ message: 'A server error occurred.' });
    }
}
