import { OpenAI } from 'openai';
import fetch from 'node-fetch';
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

    try {
        // --- 1. OpenAI (предполагаем, что работает, пропускаем для скорости теста) ---
        console.log(`[DEBUG] Skipping OpenAI call for faster PDFMonkey test.`);
        const reportData = {
            address: address,
            report_date: new Date().toLocaleDateString('en-US'),
            report_id: `SRWX-DEBUG-${Date.now()}`,
            // Добавляем фейковые данные, чтобы payload не был пустым
            test_data: "This is a test payload to ensure PDFMonkey receives data."
        };

        // --- 2. Генерируем PDF с помощью PDFMonkey (Диагностический режим) ---
        const pdfMonkeyUrl = 'https://api.pdfmonkey.io/api/v1/documents';
        const pdfMonkeyApiKey = process.env.PDFMONKEY_API_KEY;
        const pdfMonkeyTemplateId = process.env.PDFMONKEY_TEMPLATE_ID;

        const requestBody = {
            document: {
                document_template_id: pdfMonkeyTemplateId,
                payload: reportData,
                status: 'draft',
            }
        };

        // --- ВЫВОДИМ ВСЁ В ЛОГ ПЕРЕД ОТПРАВКОЙ ---
        console.log(`[DEBUG] Attempting to POST to: ${pdfMonkeyUrl}`);
        console.log(`[DEBUG] Using Template ID: ${pdfMonkeyTemplateId}`);
        // ВАЖНО: Не выводим полный ключ в лог из соображений безопасности, только его наличие.
        console.log(`[DEBUG] API Key is present: ${pdfMonkeyApiKey ? 'Yes' : 'No'}`);
        console.log('[DEBUG] Sending this body:', JSON.stringify(requestBody, null, 2));
        
        const pdfResponse = await fetch(pdfMonkeyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pdfMonkeyApiKey}`,
            },
            body: JSON.stringify(requestBody),
            timeout: 20000 // Тайм-аут 20 секунд
        });

        console.log(`[DEBUG] Received response from PDFMonkey with status: ${pdfResponse.status}`);

        if (!pdfResponse.ok) {
            // Если ответ не успешный, выводим весь текст ответа
            const errorText = await pdfResponse.text();
            console.error('[DEBUG] PDFMonkey Response Body (Error):', errorText);
            throw new Error(`PDFMonkey API returned status ${pdfResponse.status}`);
        }
        
        const pdfData = await pdfResponse.json();
        console.log('[DEBUG] PDFMonkey response JSON is OK.');
        
        // Остальную часть (скачивание, отправка почты) пропускаем, чтобы сфокусироваться на проблеме
        return response.status(200).json({ message: 'DEBUG: PDFMonkey request was successful. Check logs for details.' });

    } catch (error) {
        console.error('[DEBUG] CATCH BLOCK ERROR:', error);
        return response.status(500).json({ 
            message: 'A server error occurred during the diagnostic test.',
            error_name: error.name,
            error_message: error.message
        });
    }
}
