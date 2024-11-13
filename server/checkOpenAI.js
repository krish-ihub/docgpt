// checkOpenAI.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const checkOpenAI = async () => {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o', // Use a valid model name
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Hello, how are you?' }
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('OpenAI API response:', response.data);
    } catch (error) {
        console.error('Error connecting to OpenAI API:', error.response ? error.response.data : error.message);
    }
};

checkOpenAI();
