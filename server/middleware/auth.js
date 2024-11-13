export const authenticate = (req, res, next) => {
    if (req.session.userId) {
        req.user = { id: req.session.userId };
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized' });
};
