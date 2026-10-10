const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        clientId: { type: String },
        match: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Match",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            default: "",
        },
        mediaUrl: {
            type: String,
            default: null,
        },
        mediaType: {
            type: String,
            enum: ["image", "video", null],
            default: null,
        },
        hiddenFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);
messageSchema.index({ match: 1, sender: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: 'string' } } });

module.exports = mongoose.model("Message", messageSchema);
