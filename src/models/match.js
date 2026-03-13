const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
    {
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
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
