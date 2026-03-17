const mongoose = require("mongoose");

const dislikeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        pet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Pet",
            required: true,
        },
        category: {
            type: String,
            enum: ["Find Mate", "Play Date"],
            required: true,
        }
    },
    { timestamps: true }
);

// Ensure a user can only dislike a specific pet once per category
dislikeSchema.index({ user: 1, pet: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Dislike", dislikeSchema);
