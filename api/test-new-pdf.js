import fetch from 'node-fetch';

export default async function handler(req, res) {
    console.log('[Api2Pdf ISOLATION TEST] Test started...');
    const apiKey = process.env.API2PDF_KEY;

    if (!apiKey) {
        return res.status(500).json({ message: 'API2PDF_KEY is not set.' });
    }
    console.log('API Key for Api2Pdf is loaded.');

    try {
        // Простейший HTML для теста
        const testHtml = '<h1>Hello World</h1>';

        const api2pdfResponse = await fetch('https://v2.api2pdf.com/chrome/html', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
            },
            body: JSON.stringify({ html: testHtml, inline: true }), // inline: true вернет ссылку, это быстрее
            timeout: 25000 // Тайм-аут 25 секунд
        });

        console.log(`[Api2Pdf ISOLATION TEST] Received response with status: ${api2pdfResponse.status}`);

        if (!api2pdfResponse.ok) {
            const errorText = await api2pdfResponse.text();
            console.error('[Api2Pdf ISOLATION TEST] FAILED. Response:', errorText);
            throw new Error(`Api2Pdf returned status ${api2pdfResponse.status}`);
        }

        const responseData = await api2pdfResponse.json();
        console.log('✅ [Api2Pdf ISOLATION TEST] Test successful!');
        return res.status(200).json({ 
            message: 'Successfully connected to Api2Pdf!',
            data: responseData 
        });

    } catch (error) {
        console.error('❌ [Api2Pdf ISOLATION TEST] CATCH BLOCK ERROR:', error);
        return res.status(500).json({
            message: 'Failed during Api2Pdf isolation test.',
            error_message: error.message
        });
    }
}
