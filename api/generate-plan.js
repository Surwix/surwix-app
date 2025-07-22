import { OpenAI } from 'openai';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

// Инициализируем клиент OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ✅ НОВАЯ, УЛУЧШЕННАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ КРАСИВОГО HTML
function createPdfHtml(reportData) {
    // Функция для генерации строк таблицы рисков
    const generateRiskRows = () => {
        if (!reportData.risks || reportData.risks.length === 0) {
            return '<tr><td colspan="3">No specific risks identified.</td></tr>';
        }
        return reportData.risks.map(risk => `
            <tr>
                <td>${risk.type || 'N/A'}</td>
                <td class="risk-${risk.level_color || 'low'}">${risk.level_text || 'N/A'}</td>
                <td>${risk.advice || 'Follow standard procedures.'}</td>
            </tr>
        `).join('');
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Surwix Evacuation Plan</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #333; margin: 0; padding: 0; }
            .report-container { max-width: 800px; margin: auto; background: #fff; border: 1px solid #eee; }
            .report-header { background-color: #003366; color: white; padding: 20px; text-align: center; }
            .report-header h1 { margin: 0; font-size: 28px; }
            .report-header p { margin: 5px 0 0; opacity: 0.9; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background-color: #ddd; border-bottom: 1px solid #ddd; }
            .summary-item { background-color: #f9f9f9; padding: 15px; text-align: center; }
            .summary-item .label { font-size: 14px; color: #555; }
            .summary-item .value { font-size: 22px; font-weight: bold; }
            .risk-high { color: #D32F2F; }
            .risk-medium { color: #FBC02D; }
            .risk-low { color: #388E3C; }
            .report-section { padding: 25px; border-bottom: 1px solid #eee; }
            .report-section h2 { font-size: 20px; color: #003366; border-bottom: 2px solid #003366; padding-bottom: 8px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { background-color: #f7f7f7; }
            ol { padding-left: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #777; }
        </style>
    </head>
    <body>
        <div class="report-container">
            <header class="report-header">
                <h1>Personal Evacuation Plan</h1>
                <p>Address: ${reportData.address}</p>
            </header>
            <section class="summary-grid">
                <div class="summary-item">
                    <div class="label">Overall Risk</div>
                    <div class="value risk-${reportData.risk_level_color || 'low'}">${reportData.risk_level_text || 'Not Determined'}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Report Date</div>
                    <div class="value">${reportData.report_date}</div>
                </div>
            </section>
            <section class="report-section">
                <h2>Risk Analysis</h2>
                <table>
                    <thead><tr><th>Threat Type</th><th>Level</th><th>Recommendation</th></tr></thead>
                    <tbody>${generateRiskRows()}</tbody>
                </table>
            </section>
            <section class="report-section">
                <h2>Action Plan</h2>
                <ol>
                    ${reportData.action_steps ? reportData.action_steps.map(step => `<li>${step}</li>`).join('') : '<li>Follow guidance from local authorities.</li>'}
                </ol>
            </section>
            <footer class="footer">
                <p>Report ID: ${reportData.report_id}</p>
                <p>This report is AI-generated and for informational purposes only. Always follow directions from official emergency services.</p>
            </footer>
        </div>
    </body>
    </html>
    `;
}

// Основная серверная функция
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { address, email } = request.body;
    if (!address || !email) {
        return response.status(400).json({ message: 'Address and email are required' });
    }

    try {
        // --- 1. Получаем данные от ИИ ---
        console.log(`[1/3] Generating AI data for: ${address}`);
        // ✅ ОБНОВЛЕННЫЙ ПРОМПТ для получения данных под красивый шаблон
        const prompt = `Act as a U.S. emergency preparedness analyst for the address "${address}". Generate a JSON object with these exact keys: "risk_level_text" (string, e.g., "Medium"), "risk_level_color" (string: "low", "medium", or "high"), "risks" (an array of objects, each with "type", "level_text", "level_color", "advice"), and "action_steps" (an array of 3-4 short string sentences). Provide realistic mock data.`;
        
        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        });
        const reportData = JSON.parse(aiCompletion.choices[0].message.content);
        reportData.address = address;
        reportData.report_date = new Date().toLocaleDateString('en-US');
        reportData.report_id = `SRWX-${Date.now()}`;

        // --- 2. Генерируем PDF с помощью Api2Pdf ---
        console.log('[2/3] Sending HTML to Api2Pdf for conversion...');
        const htmlToConvert = createPdfHtml(reportData);
        
        const api2pdfResponse = await fetch('https://v2.api2pdf.com/chrome/html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.API2PDF_KEY,
            },
            body: JSON.stringify({ html: htmlToConvert, inline: false }),
        });

        if (!api2pdfResponse.ok) {
            const errorText = await api2pdfResponse.text();
            throw new Error(`Api2Pdf Error: ${errorText}`);
        }
        
        const pdfBuffer = await api2pdfResponse.arrayBuffer();
        console.log('PDF generated successfully by Api2Pdf.');

        // --- 3. Отправляем письмо с PDF-вложением ---
        console.log(`[3/3] Sending email to: ${email}...`);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        });

        await transporter.sendMail({
            from: `"Surwix Reports" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: `Your Personal Evacuation Plan from Surwix for ${address}`,
            text: "Thank you for using Surwix. Your AI-generated evacuation plan is attached.",
            attachments: [{
                filename: 'Surwix-Evacuation-Plan.pdf',
                content: Buffer.from(pdfBuffer),
                contentType: 'application/pdf',
            }],
        });

        console.log('Process complete. Sending success response.');
        return response.status(200).json({ message: 'Success! Your report has been generated and sent to your email.' });

    } catch (error) {
        console.error('An error occurred in the process:', error);
        return response.status(500).json({ message: 'A server error occurred. Please try again later.' });
    }
}
