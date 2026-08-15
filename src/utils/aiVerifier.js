const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Verifies if the given image contains a dog using Gemini AI REST API.
 * @param {string} filePath - The path to the image file.
 * @returns {Promise<boolean>} - Returns true if a dog is found, false otherwise.
 */
async function verifyIsDogImage(filePath) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. Skipping AI verification.");
        return true;
    }

    try {
        // Read file and convert to base64
        const fileBytes = fs.readFileSync(filePath);
        const base64Data = fileBytes.toString("base64");
        const mimeType = getMimeType(filePath);

        const requestBody = JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: "Does this image contain a dog or a puppy? Look carefully. Answer with only the single word YES or NO."
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        });

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        const responseText = await httpPost(apiUrl, requestBody);
        const parsed = JSON.parse(responseText);

        // Extract the text response
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase() || "";

        console.log(`AI verification response for ${path.basename(filePath)}: "${text}"`);

        if (text.includes("YES")) {
            return true;
        } else if (text.includes("NO")) {
            return false;
        } else {
            // If ambiguous response, log and allow the upload
            console.warn("Ambiguous AI response:", text, "- allowing upload.");
            return true;
        }

    } catch (error) {
        console.error("AI verification error details:", error.message || error);
        // If the AI verification fails due to a network/API error, log it but allow
        // the upload to avoid blocking users due to transient API issues.
        // Change to 'throw error' if you want strict blocking.
        console.warn("AI verification failed - allowing upload due to API error.");
        return true;
    }
}

/**
 * Helper to make an HTTPS POST request.
 */
function httpPost(url, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    console.error("Gemini API HTTP error:", res.statusCode, data);
                    reject(new Error(`Gemini API returned status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error("Request to Gemini API timed out after 30s"));
        });

        req.write(body);
        req.end();
    });
}

/**
 * Basic mime-type helper based on file extension.
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
