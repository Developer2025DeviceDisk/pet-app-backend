const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "No authentication token, access denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Token verification failed, user not found" });
        }
        if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) return res.status(401).json({ message: 'Session expired. Please sign in again.' });

        if ((!user.isVerified && user.authMethod !== 'password') || user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned for violating our Terms of Service." });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = auth;
