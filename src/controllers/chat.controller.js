const Message = require("../models/message");
const path = require("path");

exports.getMessages = async (req, res) => {
    try {
        const { matchId } = req.params;
        const messages = await Message.find({ match: matchId }).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Upload media (image or video) and save as a message
exports.sendMediaMessage = async (req, res) => {
    try {
        const { matchId } = req.body;
        const senderId = req.user.id;

        if (!matchId) {
            return res.status(400).json({ success: false, message: "matchId is required" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No media file provided" });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
        const mediaType = videoExtensions.includes(ext) ? "video" : "image";
        const mediaUrl = `/uploads/${req.file.filename}`;

        const message = await Message.create({
            match: matchId,
            sender: senderId,
            content: "",
            mediaUrl,
            mediaType,
        });

        res.status(201).json({
            success: true,
            message: {
                _id: message._id,
                matchId,
                senderId,
                content: "",
                mediaUrl,
                mediaType,
                createdAt: message.createdAt,
            }
        });
    } catch (error) {
        console.error("Error sending media message:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
