import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';

// --- ФУНКЦИЯ ДЛЯ СОЗДАНИЯ HTML-ОТЧЕТА ---
function createPdfHtml(data) {
    const generateRiskRows = () => data.hazard_matrix?.map(risk => `
        <tr>
            <td>${risk.threat || ''}</td>
            <td class="swx-risk-${risk.level_color || 'low'}">${risk.level || ''}</td>
            <td>${risk.advice || ''}</td>
            <td>${risk.probability || ''}</td>
        </tr>
    `).join('') || '';

    const generateResourceList = () => data.nearby_resources?.map(res => `
        <li>
            <span class="type">${res.type}:</span> ${res.name}
            <span class="distance">${res.distance}</span>
        </li>
    `).join('') || '';

    const generateChecklist = () => data.checklist?.map(item => `
        <li><i class="fa fa-check-circle"></i> ${item}</li>
    `).join('') || '';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Personal Evacuation Report by Surwix</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>
            .swx-report { font-family: 'Inter', Arial, sans-serif; max-width: 760px; background: #fff; margin: 36px auto; padding: 34px 32px 24px; border-radius: 14px; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.11); color: #222; }
            .swx-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 18px; }
            .swx-header-title { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
            .swx-header-title h1 { margin: 0; font-size: 28px; color: #003366; letter-spacing: 1px; }
            .swx-by { font-size: 16px; color: #7281a0; }
            .swx-meta { color: #7281a0; font-size: 14px; }
            .swx-meta span { display: inline-block; margin-right: 22px; }
            .swx-summary { border-left: 8px solid #ed8936; background: #f9f7f3; padding: 13px 24px; margin-bottom: 18px; font-size: 19px; border-radius: 9px; font-weight: 500; }
            .swx-risk-low { border-color: #38a169 !important; color: #38a169; }
            .swx-risk-moderate { border-color: #ed8936 !important; color: #ed8936; }
            .swx-risk-high { border-color: #e53e3e !important; color: #e53e3e; }
            .swx-summary .swx-maincomment { display: block; font-size: 15px; color: #555; font-weight: 400; margin-top: 5px; }
            .swx-section { margin-bottom: 26px; }
            .swx-section h2 { font-size: 22px; color: #003366; margin-bottom: 12px; }
            .swx-table { width: 100%; border-collapse: collapse; }
            .swx-table th, .swx-table td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 15px; }
            .swx-table th { background: #f1f4f9; color: #1a365d; }
            .swx-table td.swx-risk-low { color: #38a169; font-weight: 600; }
            .swx-table td.swx-risk-moderate { color: #ed8936; font-weight: 600; }
            .swx-table td.swx-risk-high { color: #e53e3e; font-weight: 600; }
            .src-badge { font-size: 12px; padding: 2px 6px; border-radius: 4px; background: #eef4fa; border: 1px solid #c4d9ec; color: #4682b4; margin-left: 8px; display: inline-block; vertical-align: middle; }
            .source { display: block; font-size: 12px; color: #9ea3ab; margin-top: 8px; }
            .section { margin: 40px 0 32px; padding: 24px; background: #f9fbfe; border-radius: 10px; border: 1px solid #e5ecf6; box-shadow: 0 3px 8px rgba(30, 72, 145, 0.05); }
            ul { list-style: none; padding: 0; margin: 0; }
            li { margin-bottom: 10px; }
            .checklist-list li { display: flex; align-items: center; font-size: 16px; }
            .checklist-list li i { margin-right: 10px; color: #39b77d; }
            .swx-footer { border-top: 1px solid #ececec; padding-top: 13px; text-align: center; color: #7d90aa; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="swx-report">
            <div class="swx-header">
                <div class="swx-header-title"><h1>Personal Evacuation Report</h1><span class="swx-by">by Surwix</span></div>
                <div class="swx-meta"><span><b>Address:</b> ${data.address}</span><span><b>Date:</b> ${data.report_date}</span><span><b>Report ID:</b> ${data.report_id}</span></div>
            </div>
            <div class="swx-summary swx-risk-${data.overall_risk?.level_color || 'moderate'}"><b>Overall Risk:</b> ${data.overall_risk?.level || 'Moderate'}<span class="swx-maincomment">${data.overall_risk?.summary || ''}</span></div>
            <div class="swx-section"><h2>Hazard Risk Matrix</h2><table class="swx-table"><thead><tr><th>Threat</th><th>Level</th><th>Advice</th><th>Probability</th></tr></thead><tbody>${generateRiskRows()}</tbody></table></div>
            <div class="swx-section"><h2>Recent Disasters <span class="src-badge">OpenFEMA</span></h2><ul>${data.recent_disasters.length > 0 ? data.recent_disasters.map(d => `<li>${d}</li>`).join('') : '<li>No major disasters declared recently.</li>'}</ul><small class="source">Source: OpenFEMA.gov</small></div>
            <div class="swx-section"><h2>Storm/Tornado Stats <span class="src-badge">NOAA</span></h2><div>${data.noaa_stats || 'No specific data available.'}<br /><small class="source">Source: NOAA/National Weather Service</small></div></div>
            <div class="section checklist"><h2><i class="fa fa-clipboard-check"></i> Evacuation Checklist</h2><ul class="checklist-list">${generateChecklist()}</ul></div>
            <div class="swx-footer"><small>Data analysis provided by OpenAI. Additional data from FEMA, NOAA. This report is for informational purposes only. Always follow instructions from local authorities.</small></div>
        </div>
    </body>
    </html>
    `;
}

export default async function handler(request, response) {
    if (request.method !== 'POST') return response.status(405).json({ message: 'Method Not Allowed' });

    const { address, email } = request.body;
    if (!address || !email) return response.status(400).json({ message: 'Address and email are required' });

    try {
        // --- ШАГ 1: ГЕОКОДИРОВАНИЕ АДРЕСА ---
        console.log('[1/5] Geocoding address...');
        let lat, lon, state;
        try {
            const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_GEOCODING_API_KEY}`;
            const geoResponse = await fetch(geocodingUrl);
            const geoData = await geoResponse.json();
            if (geoData.status !== 'OK') throw new Error('Geocoding failed: ' + geoData.status);
            
            lat = geoData.results[0].geometry.location.lat;
            lon = geoData.results[0].geometry.location.lng;
            // Находим штат для запроса в FEMA
            const addressComponents = geoData.results[0].address_components;
            state = addressComponents.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
        } catch (e) { console.error("Could not geocode address, proceeding with limited data.", e); }
        console.log(`Geocoding successful: Lat=${lat}, Lon=${lon}, State=${state}`);

        // --- ШАГ 2: ПОЛУЧАЕМ ДАННЫЕ ОТ OPENFEMA ---
        console.log('[2/5] Fetching data from OpenFEMA...');
        let recentDisasters = [];
        if (state) {
            try {
                const femaURL = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=state%20eq%20'${state}'&$orderby=declarationDate%20desc&$top=2`;
                const femaResponse = await fetch(femaURL);
                if (femaResponse.ok) {
                    const femaData = await femaResponse.json();
                    if (femaData.DisasterDeclarationsSummaries) {
                        recentDisasters = femaData.DisasterDeclarationsSummaries.map(d => `${d.incidentType} (${new Date(d.declarationDate).getFullYear()})`);
                    }
                }
            } catch (e) { console.error("Could not fetch from OpenFEMA.", e); }
        }
        console.log('OpenFEMA data received.');
        
        // --- ШАГ 3: ПОЛУЧАЕМ ДАННЫЕ ОТ NOAA ---
        console.log('[3/5] Fetching data from NOAA...');
        let noaaStats = "No specific data available for this location.";
        if (lat && lon) {
             try {
                // Сначала получаем URL эндпоинта для конкретных координат
                const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
                const pointsResponse = await fetch(pointsUrl);
                const pointsData = await pointsResponse.json();
                const countyUrl = pointsData.properties.county; // URL для данных по округу
                
                // Затем получаем предупреждения для этого округа
                const alertsResponse = await fetch(`${countyUrl}/alerts`);
                const alertsData = await alertsResponse.json();
                if (alertsData.features.length > 0) {
                    noaaStats = `Active alerts in the area: ${alertsData.features.map(a => a.properties.event).join(', ')}`;
                } else {
                    noaaStats = "No active weather alerts for this county.";
                }
            } catch (e) { console.error("Could not fetch from NOAA.", e); }
        }
        console.log('NOAA data received.');

        // --- ШАГ 4: ФОРМИРУЕМ ПРОМПТ ДЛЯ OPENAI С РЕАЛЬНЫМИ ДАННЫМИ ---
        console.log('[4/5] Generating AI data...');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `
            Act as a U.S. emergency preparedness expert for the address: "${address}".
            CONTEXT - Real-time data:
            - Recent FEMA Disasters in this state: ${recentDisasters.join(', ') || 'None'}.
            - Current NOAA weather summary: ${noaaStats}.
            
            Generate a report as a single JSON object. Your response must be ONLY a valid JSON object.
            The JSON object must have these exact keys:
            1.  "overall_risk": An object with "level" ("Low", "Moderate", or "High"), "level_color" ("low", "moderate", or "high"), and "summary" (a one-sentence explanation synthesizing the context).
            2.  "hazard_matrix": An array of 3 objects. Each object must have "threat", "level", "level_color", "advice", and "probability" (a plausible statistic).
            3.  "checklist": An array of 6 short, actionable strings for an evacuation checklist.
        `;
        
        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        });
        const reportData = JSON.parse(aiCompletion.choices[0].message.content);
        
        reportData.address = address;
        reportData.report_date = new Date().toLocaleDateString('en-US');
        reportData.report_id = `SRWX-${Date.now()}`;
        reportData.recent_disasters = recentDisasters;
        reportData.noaa_stats = noaaStats;
        console.log('AI data received and parsed.');

        // --- ШАГ 5: ГЕНЕРАЦИЯ PDF И ОТПРАВКА ---
        console.log(`[5/5] Generating PDF and sending email...`);
        const htmlToConvert = createPdfHtml(reportData);
        const pdfShiftResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + Buffer.from(`:${process.env.PDFSHIFT_API_KEY}`).toString('base64') },
            body: JSON.stringify({ source: htmlToConvert }),
        });
        
        if (!pdfShiftResponse.ok) throw new Error(`PDFshift Error: ${await pdfShiftResponse.text()}`);
        const pdfBuffer = await pdfShiftResponse.arrayBuffer();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
        });
        await transporter.sendMail({
            from: `"Surwix Reports" <${process.env.EMAIL_SERVER_USER}>`,
            to: email,
            subject: `Your Personal Evacuation Plan from Surwix for ${address}`,
            text: "Your PDF report is attached.",
            attachments: [{ filename: 'Surwix-Evacuation-Plan.pdf', content: Buffer.from(pdfBuffer), contentType: 'application/pdf' }],
        });
        console.log('Email sent.');

        return response.status(200).json({ message: 'Success! Your report has been generated and sent to your email.' });

    } catch (error) {
        console.error('An error occurred in the main handler:', error);
        return response.status(500).json({ message: 'A server error occurred. Please check the logs.' });
    }
}
