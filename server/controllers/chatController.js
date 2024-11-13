import OpenAI from 'openai'; 
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs'; 
import Thread from '../models/Thread.js';

dotenv.config(); 
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize conversation history in memory
const conversationHistory = {}; // Store history by session or user

const initializeSessionHistory = (sessionId) => {
    if (!conversationHistory[sessionId]) {
        conversationHistory[sessionId] = [];
    }
};

// Function to search the knowledge file for relevant information
const searchKnowledgeFile = (query) => {
    const data = JSON.parse(fs.readFileSync('D:/KRISH/hospitalgpt/server/output.json', 'utf8')); // Adjust the path to your JSON file
    const results = data.filter(item => 
        Object.values(item).some(symptom => symptom && symptom.includes(query))
    ); // Search across all symptoms
    return results;
};

// Function to handle chat interaction with context
export const handleChat = async (req, res) => {
    const { query, sessionId } = req.body;

    try {
        initializeSessionHistory(sessionId);  // Ensure conversation history for the session exists

        // Add new user query to conversation history
        conversationHistory[sessionId].push({ role: 'user', content: query });

        // Limit messages to avoid exceeding token limit
        if (conversationHistory[sessionId].length > 20) {
            conversationHistory[sessionId].shift(); // Remove the oldest message if over limit
        }

        // Search the knowledge file for relevant information
        const knowledgeResults = searchKnowledgeFile(query);
        const knowledgeContent = knowledgeResults.length > 0 ? knowledgeResults.map(item => item.Disease).join('\n') : 'No relevant information found.';

        // Create completion with message history and knowledge content
        const response = await client.chat.completions.create({
            model: 'gpt-4', // Use the appropriate model
            messages: [
                { 
                    role: 'system', 
                    content: `Your name is DocGPT. You are tasked with diagnosing possible conditions based on the user's reported symptoms, using the provided dataset to retrieve relevant information.
                    Instructions:
                    1. Understand the User's Symptoms: Review each symptom the user mentions to determine what condition(s) they may have.
                    2. Ask Follow-up Questions: Based on initial symptoms, ask one focused question at a time to gather further details.
                    3. Use File Search: Retrieve relevant content from the dataset file for accurate diagnoses.
                    4. Provide Clear Feedback: After gathering enough symptoms, provide a concise, aesthetically simple diagnosis.
                    
                    Response Style:
                    - Concise and Aesthetic: Avoid long paragraphs. Keep responses simple, asking one question per message.
                    - Empathetic and Professional: Keep a supportive tone and provide clear guidance.
                    - When Uncertain: If more information is needed, ask another question based on common indicators related to the symptoms.`
                },
                ...conversationHistory[sessionId],
                { role: 'system', content: knowledgeContent } // Include knowledge content
            ],
            temperature: 0.5, // Adjust temperature for more focused responses
            top_p: 1.0,
            assistant_id: process.env.ASSISTANT_ID // Use the assistant ID from the environment
        });

        // Capture assistant's response and add to conversation history
        const assistantMessage = response.choices[0].message.content;
        conversationHistory[sessionId].push({ role: 'assistant', content: assistantMessage });

        res.status(200).json({ message: 'Message processed', assistantMessage });
    } catch (error) {
        console.error('Error handling chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Define the addMessageToThread function
export const addMessageToThread = async (req, res) => {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    try {
        const thread = await Thread.findOne({ threadId, userId });
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Add the new message to the thread
        thread.messages.push({ role: 'user', content });
        await thread.save();

        // Send the message to the assistant and get a response
        const response = await client.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are DocGPT, a strict medical assistant. Your task is to diagnose possible conditions based on the user\'s reported symptoms using the provided knowledge file. You must not go out of context and can ask a maximum of 5 questions, one at a time. Provide concise responses and avoid lengthy explanations.' 
                },
                ...thread.messages,
                { role: 'user', content } // Include the new user message
            ],
            temperature: 0.5, // Lower temperature for more focused responses
            top_p: 1.0,
        });
        const assistantMessage = response.choices[0].message.content;
        thread.messages.push({ role: 'assistant', content: assistantMessage });
        await thread.save();

        res.status(200).json({ message: 'Message added to thread', assistantMessage });
    } catch (error) {
        console.error('Error adding message to thread:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Ensure other functions are also exported
export const createNewThread = async (req, res) => {
    const userId = req.user.id;

    try {
        // Create a new thread in OpenAI
        const response = await axios.post('https://api.openai.com/v1/assistants', {
            model: 'gpt-4', // Specify the model you want to use
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2', // Add the required header
            }
        });

        // Check if the response contains a valid threadId
        if (!response.data || !response.data.id) {
            console.error('Failed to create a new thread in OpenAI:', response.data); // Log the response data
            return res.status(500).json({ message: 'Failed to create a new thread in OpenAI' });
        }

        const threadId = response.data.id;

        // Save the thread ID in the database
        const newThread = new Thread({ userId, threadId, messages: [] });
        await newThread.save();

        res.status(201).json(newThread);
    } catch (error) {
        console.error('Error creating new thread:', error.response ? error.response.data : error.message); // Log the error
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserThreads = async (req, res) => {
    const userId = req.user.id;

    try {
        const threads = await Thread.find({ userId }).select('threadId createdAt messages');
        console.log('Fetched threads:', threads); // Debugging line
        res.status(200).json(threads);
    } catch (error) {
        console.error('Error fetching user threads:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getThreadMessages = async (req, res) => {
    const { threadId } = req.params; // Get threadId from request parameters
    const userId = req.user.id; // Get userId from session

    console.log('Fetching messages for threadId:', threadId); // Debugging line

    try {
        // Find the thread by threadId and userId
        const thread = await Thread.findOne({ threadId, userId });
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        res.status(200).json({ messages: thread.messages });
    } catch (error) {
        console.error('Error retrieving thread messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
