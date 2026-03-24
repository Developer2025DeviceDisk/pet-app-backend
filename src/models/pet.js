const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
    {
        petName: {
            type: String,
            required: true,
        },
        breed: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            enum: ["Male", "Female"],
            required: true,
        },
        age: {
            type: String,
            required: true,
        },
        // Support multiple health badges
        healthBadges: {
            type: [String],
            default: [],
        },
        // Legacy single badge (kept for backward compat)
        healthBadge: {
            type: String,
            default: "",
        },
        temperament: {
            type: String,
        },
        goal: {
            type: String,
            enum: ["Find Mate", "Play Date", "Both"],
            default: "Find Mate",
        },
        images: [
            {
                type: String,
            },
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);
