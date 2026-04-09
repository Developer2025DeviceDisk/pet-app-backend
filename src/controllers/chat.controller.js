const Message = require("../models/message");
const Match = require("../models/match");
const path = require("path");

exports.getMessages = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;
        
        const messages = await Message.find({ 
            match: matchId,
            hiddenFrom: { $ne: userId }
        }).sort({ createdAt: 1 });
        
        const match = await Match.findById(matchId).select("blockedBy").lean();

        let returnedBlockedBy = null;
        if (match?.blockedBy && match.blockedBy.toString() === userId.toString()) {
            returnedBlockedBy = match.blockedBy;
        }

        res.status(200).json({
            success: true,
            messages,
            blockedBy: returnedBlockedBy,
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Block a user in this match
exports.blockUser = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, message: "Match not found" });
        }

        // Only participants can block
        const isParticipant = match.users.some(u => u.toString() === userId.toString());
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Already blocked
        if (match.blockedBy) {
            return res.status(400).json({ success: false, message: "Already blocked" });
        }

        match.blockedBy = userId;
        await match.save();

        res.status(200).json({ success: true, message: "User blocked", blockedBy: userId });
    } catch (error) {
        console.error("Error blocking user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Unblock a user in this match
exports.unblockUser = async (req, res) => {
    try {
        const { matchId } = req.params;
        const userId = req.user.id;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, message: "Match not found" });
        }

        // Only the person who blocked can unblock
        if (!match.blockedBy || match.blockedBy.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "You are not the one who blocked this user" });
        }

        match.blockedBy = null;
        await match.save();

        res.status(200).json({ success: true, message: "User unblocked", blockedBy: null });
    } catch (error) {
        console.error("Error unblocking user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
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

        const match = await Match.findById(matchId).select("blockedBy").lean();
        
        let hiddenFrom = null;
        if (match?.blockedBy && match.blockedBy.toString() !== senderId.toString()) {
            hiddenFrom = match.blockedBy;
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
            hiddenFrom
        });

        const io = req.app.get("socketio");
        if (io) {
            io.to(matchId).emit("receive_message", {
                _id: message._id,
                matchId: matchId,
                senderId: senderId,
                content: "",
                mediaUrl: mediaUrl,
                mediaType: mediaType,
                createdAt: message.createdAt,
                hiddenFrom: hiddenFrom,
            });
        }

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
