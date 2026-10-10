const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
    {
        invitationKey: { type: String, unique: true, sparse: true },
        invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        pets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Pet",
                required: true,
            },
        ],
        category: {
            type: String,
            enum: ["Find Mate", "Play Date"],
            required: true,
        },
        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
