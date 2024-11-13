import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    role: { type: String, required: true },
    content: { type: String, required: true },
});

const ThreadSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    threadId: { type: String, required: true, unique: true },
    messages: [MessageSchema],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Thread', ThreadSchema);
