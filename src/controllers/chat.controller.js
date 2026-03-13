const Message = require("../models/message");

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
