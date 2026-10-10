const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");
router.put('/notifications', auth, require('../services/notifications').preferences);
router.get('/rewards', auth, require('../services/rewards').rewards);
router.put('/rewards/reminders', auth, require('../services/rewards').preferences);

router.put("/profile", auth, upload.single("profileImage"), userController.updateProfile);
router.get("/profile", auth, userController.getProfile);
router.get("/matches", auth, userController.getMatches);
router.delete("/account", auth, userController.deleteAccount);

module.exports = router;
