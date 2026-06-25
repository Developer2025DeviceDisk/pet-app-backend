const multer = require("multer");

// Global error handler. Ensures errors thrown in middleware (e.g. multer file
// rejections or size limits) return JSON instead of Express's default HTML 500
// page, which clients cannot parse.
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    // Multer-specific errors (file too large, too many files, unexpected field)
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
        });
    }

    const status = err.status || err.statusCode || 500;
    const message =
        typeof err === "string" ? err : err.message || "Internal Server Error";

    console.error("API Error:", message);

    return res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
