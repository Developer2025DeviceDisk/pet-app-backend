const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const auth = require("../middlewares/auth");

// Middleware to verify admin privileges
const adminAuth = (req, res, next) => {
  const allowed = (process.env.ADMIN_USER_IDS || '').split(',').map(value => value.trim());
  if (req.user && req.user.isAdmin && allowed.includes(String(req.user._id))) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
};

router.get("/reports", auth, adminAuth, adminController.getReports);
router.delete("/messages/:messageId", auth, adminAuth, adminController.deleteMessage);
router.post("/users/:userId/ban", auth, adminAuth, adminController.banUser);
router.post("/reports/:reportId/resolve", auth, adminAuth, adminController.resolveReport);

module.exports = router;
