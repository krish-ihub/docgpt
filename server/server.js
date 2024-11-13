// /server.js
import express from 'express';
import connectDB from './config/db.js'; // Connect to the database
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import cors from 'cors';
import session from 'express-session'; // Import express-session
import dotenv from 'dotenv'; // Load environment variables

dotenv.config(); // Load environment variables

const app = express();
connectDB(); // Initialize DB connection

// Middleware setup
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json()); // This line is crucial for parsing JSON bodies

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
