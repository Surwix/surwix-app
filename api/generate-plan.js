import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
    console.log('[STEP 1 of 4] OpenAI test started...');
    
    // Проверяем, что получаем email и address из формы
    const { address, email } = request.body;
    if (!address || !email) {
        return response.status(400).json({ message: 'Address and email are required' });
    }

    try {
        const prompt = `For the address "${address}", create a simple, one-sentence evacuation advice.`;
        
        const aiCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
        });

        const result = aiCompletion.choices[0].message.content;
        
        console.log('✅ [STEP 1 of 4] OpenAI call successful.');
        
        // Отправляем ответ от OpenAI прямо в браузер
        return response.status(200).json({ 
            message: 'OpenAI step was successful!',
            ai_response: result 
        });

    } catch (error) {
        console.error('❌ [STEP 1 of 4] OpenAI call FAILED:', error);
        return response.status(500).json({ message: 'Error during OpenAI call.' });
    }
}
