const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI with the API key from environment variables
// Note: It's better to initialize this inside the function or lazily if dotenv isn't loaded yet.
// We'll initialize lazily to ensure process.env.GEMINI_API_KEY is available.
let genAI = null;

/**
 * Verifies if the given image contains a dog using Gemini AI.
 * @param {string} filePath - The absolute or relative path to the image file.
 * @returns {Promise<boolean>} - Returns true if a dog is found, false otherwise.
 */
async function verifyIsDogImage(filePath) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set. Skipping AI verification.");
        return true; // Bypass if key is missing (optional fallback)
    }

    if (!genAI) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    try {
        // Read file and convert to base64
        const fileBytes = fs.readFileSync(filePath);
        const base64Data = fileBytes.toString("base64");

        const mimeType = getMimeType(filePath);

        // Get the model (using 1.5 flash for fast multimodal tasks)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Does this image contain a dog? Answer with only 'YES' or 'NO'.";

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().trim().toUpperCase();

        // Check if the response contains 'YES'
        if (text.includes("YES")) {
            return true;
        } else {
            return false;
        }

    } catch (error) {
        console.error("Error during AI image verification:", error);
        // Let it pass if AI fails, or block it. Usually safer to throw error if strict.
        // We will throw error so the controller handles it.
        throw new Error("Failed to verify image content with AI. Please try again later.");
    }
}

/**
 * Basic mime-type helper based on extension.
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.webp':
            return 'image/webp';
        default:
            return 'image/jpeg';
    }
}

module.exports = {
    verifyIsDogImage
};
