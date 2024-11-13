import express from 'express';
import { signup, signin, signout } from '../controllers/authController.js'; // Ensure to use .js extension
const router = express.Router();

// Check session endpoint
router.get('/check-session', (req, res) => {
    if (req.session.userId) {
        return res.status(200).json({ isLoggedIn: true });
    }
    res.status(200).json({ isLoggedIn: false });
});

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);

export default router; // Use export default to export the router
