import fetch from 'node-fetch'; // Используем только node-fetch

export default async function handler(request, response) {
    console.log('[RAW FETCH TEST] OpenAI connection test started...');

    const apiKey = process.env.OPENAI_API_KEY;
    const openAiUrl = 'https://api.openai.com/v1/chat/completions';

    // 1. Проверяем, что API ключ вообще загружен
    if (!apiKey) {
        console.error('CRITICAL: OPENAI_API_KEY is not set in environment variables!');
        return response.status(500).json({ message: 'OpenAI API Key is not configured on Vercel.' });
    }
    // Выводим только первые 5 символов для проверки, но сохраняем безопасность
    console.log(`[DEBUG] API Key loaded successfully. Starts with: "${apiKey.substring(0, 5)}..."`);

    try {
        // 2. Делаем прямой запрос к OpenAI, имитируя библиотеку
        const openAiResponse = await fetch(openAiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: "Hello world" }] // Самый простой возможный промпт
            }),
            timeout: 25000 // Устанавливаем тайм-аут в 25 секунд
        });

        console.log(`[DEBUG] Received response from OpenAI with status: ${openAiResponse.status}`);
        const responseData = await openAiResponse.json();

        if (!openAiResponse.ok) {
            console.error('[DEBUG] OpenAI API returned an error:', responseData);
            throw new Error(responseData.error?.message || 'Unknown OpenAI error');
        }

        console.log('✅ [RAW FETCH TEST] Raw fetch to OpenAI was successful!');
        return response.status(200).json({ 
            message: 'Raw connection test to OpenAI was successful!', 
            data: responseData 
        });

    } catch (error) {
        console.error('❌ [RAW FETCH TEST] The raw fetch test FAILED:', error);
        return response.status(500).json({
            message: 'Failed to connect to OpenAI during raw fetch test.',
            error_name: error.name,
            error_message: error.message
        });
    }
}
