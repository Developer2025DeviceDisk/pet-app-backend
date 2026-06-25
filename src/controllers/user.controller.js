const User = require("../models/user");
const Match = require("../models/match");
const Pet = require("../models/pet");
const Message = require("../models/message");
const Like = require("../models/like");
const Dislike = require("../models/dislike");

// Update User Profile (Owner Details)
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, state, city } = req.body;
        const userId = req.user.id;

        const updateData = {
            fullName,
            email,
            state,
            city
        };

        if (req.file) {
            updateData.profileImage = `/uploads/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get user's matches
exports.getMatches = async (req, res) => {
    try {
        const matches = await Match.find({
            users: req.user._id
        })
            .populate("users", "fullName profileImage")
            .populate("pets", "petName images breed owner")
            .lean(); // Use lean to freely modify the result objects

        // Fetch the last message for each match
        const matchesWithMessages = await Promise.all(matches.map(async (match) => {
            const lastMessage = await Message.findOne({ match: match._id })
                .sort({ createdAt: -1 }) // Get the newest message
                .select("content createdAt sender")
                .lean();

            return {
                ...match,
                lastMessage: lastMessage || null
            };
        }));

        res.status(200).json({ success: true, matches: matchesWithMessages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Permanently delete the current user's account and all associated data.
// Required by App Store Guideline 5.1.1(v): account deletion must remove the
// account and its data, not merely deactivate it.
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        // Pets owned by this user (used to clean up swipes against them)
        const myPets = await Pet.find({ owner: userId }).select("_id");
        const myPetIds = myPets.map((p) => p._id);

        // Matches the user is part of
        const myMatches = await Match.find({ users: userId }).select("_id");
        const myMatchIds = myMatches.map((m) => m._id);

        // Messages in those matches, plus any sent by the user
        await Message.deleteMany({
            $or: [{ match: { $in: myMatchIds } }, { sender: userId }],
        });

        // The matches themselves
        await Match.deleteMany({ users: userId });

        // Swipes made by the user, and swipes made by others on the user's pets
        await Like.deleteMany({ $or: [{ user: userId }, { pet: { $in: myPetIds } }] });
        await Dislike.deleteMany({ $or: [{ user: userId }, { pet: { $in: myPetIds } }] });

        // The user's pets
        await Pet.deleteMany({ owner: userId });

        // Finally, the user record
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
