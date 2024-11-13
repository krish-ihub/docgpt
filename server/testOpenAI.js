// testOpenAI.js
const OpenAI = require('openai'); // Import OpenAI SDK
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API key
});

const createAssistant = async () => {
    try {
        const assistant = await openai.beta.assistants.create({
            name: "DocGPT",
            instructions: "You are DocGPT, a helpful assistant that answers questions based on provided documents.",
            model: "gpt-4o", // Specify the model you want to use
            tools: [{ type: "file_search" }], // Enable file search tool
        });
        console.log('Assistant created:', assistant);
        return assistant.id; // Return the assistant ID for later use
    } catch (error) {
        console.error('Error creating assistant:', error);
    }
};

const createThread = async () => {
    try {
        const thread = await openai.beta.threads.create({
            messages: [
                {
                    role: 'user',
                    content: 'Hello, how can you assist me?'
                }
            ]
        });
        console.log('Thread created:', thread);
        return thread.id; // Return the thread ID for later use
    } catch (error) {
        console.error('Error creating thread:', error);
    }
};

const runTestQuery = async (threadId) => {
    try {
        const response = await openai.beta.threads.runs.create({
            thread_id: threadId,
            messages: [{ role: 'user', content: 'What can you do?' }],
            instructions: "You are DocGPT, a helpful assistant that answers questions based on provided documents.",
            tools: [{ type: "file_search" }]
            // Removed the include parameter
        });
        console.log('Response from assistant:', response);
    } catch (error) {
        console.error('Error running test query:', error);
        console.error('Full error details:', error.response ? error.response.data : error.message);
    }
};

const main = async () => {
    const assistantId = await createAssistant(); // Create the assistant
    const threadId = await createThread(); // Create a thread
    await runTestQuery(threadId); // Run a test query
};

main();
