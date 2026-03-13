const Pet = require("../models/pet");
const Like = require("../models/like");
const Match = require("../models/match");

// Create Pet Profile
exports.createPetProfile = async (req, res) => {
    try {
        const { petName, breed, gender, age, healthBadge, temperament, goal } = req.body;
        const ownerId = req.user.id;

        const petData = {
            petName,
            breed,
            gender,
            age,
            healthBadge,
            temperament,
            goal,
            owner: ownerId,
        };

        if (req.files && req.files.length > 0) {
            petData.images = req.files.map(file => `/uploads/${file.filename}`);
        }

        const pet = await Pet.create(petData);

        res.status(201).json({
            success: true,
            message: "Pet profile created successfully",
            pet,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user's pets
exports.getMyPets = async (req, res) => {
    try {
        const pets = await Pet.find({ owner: req.user.id });
        res.status(200).json({ success: true, pets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get all pets for discovery (with optional filtering)
exports.getAllPets = async (req, res) => {
    try {
        const { breed, gender, ageRange, healthBadge, temperament } = req.query;

        // Base query: exclude current user's pets
        let query = { owner: { $ne: req.user.id } };

        // Apply filters if provided
        if (breed) {
            query.breed = { $regex: breed, $options: "i" };
        }
        if (gender) {
            query.gender = { $regex: gender, $options: "i" };
        }
        if (healthBadge) {
            query.healthBadge = { $regex: healthBadge, $options: "i" };
        }
        if (temperament) {
            query.temperament = { $regex: temperament, $options: "i" };
        }

        // Handle Age Ranges
        if (ageRange) {
            // ageRange could be "0-2" or "0-2,2-5"
            const ranges = ageRange.split(",");
            const ageQueries = ranges.map(range => {
                const [min, max] = range.split("-").map(num => parseInt(num));
                if (!isNaN(min) && !isNaN(max)) {
                    return { age: { $gte: min.toString(), $lte: max.toString() } };
                }
                return null;
            }).filter(q => q !== null);

            if (ageQueries.length > 1) {
                query.$or = ageQueries;
            } else if (ageQueries.length === 1) {
                query.age = ageQueries[0].age;
            }
        }

        const pets = await Pet.find(query)
            .populate("owner", "fullName city state profileImage")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, pets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Like a Pet and Check for Match
exports.likePet = async (req, res) => {
    try {
        const { petId, category } = req.body;
        const userId = req.user._id;

        if (!category) {
            return res.status(400).json({ message: "Category (Find Mate or Play Date) is required" });
        }

        // 1. Check if the pet exists
        const targetPet = await Pet.findById(petId).populate("owner");
        if (!targetPet) {
            return res.status(404).json({ message: "Pet not found" });
        }

        // 2. Create the like
        try {
            await Like.create({ user: userId, pet: petId, category });
        } catch (error) {
            // If already liked, just continue to check for match
            if (error.code !== 11000) {
                throw error;
            }
        }

        // 3. Check if the owner of targetPet has liked ANY of req.user's pets
        const myPets = await Pet.find({ owner: userId });
        const myPetIds = myPets.map(p => p._id);

        const reciprocalLike = await Like.findOne({
            user: targetPet.owner._id,
            pet: { $in: myPetIds },
            category: category // Ensure the reciprocal like is for the exact same category
        });

        if (reciprocalLike) {
            // It's a match!
            // Check if match already exists
            let match = await Match.findOne({
                users: { $all: [userId, targetPet.owner._id] },
                pets: { $all: [petId, reciprocalLike.pet] },
                category: category
            });

            if (!match) {
                match = await Match.create({
                    users: [userId, targetPet.owner._id],
                    pets: [petId, reciprocalLike.pet],
                    category: category
                });
            }

            return res.status(200).json({
                success: true,
                isMatch: true,
                match,
                matchedPet: targetPet
            });
        }

        res.status(200).json({
            success: true,
            isMatch: false,
            message: "Pet liked successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
