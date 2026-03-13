const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
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

// Ensure a user can only like a specific pet once per category
likeSchema.index({ user: 1, pet: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);
