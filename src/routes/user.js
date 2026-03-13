const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.put("/profile", auth, upload.single("profileImage"), userController.updateProfile);
router.get("/profile", auth, userController.getProfile);
router.get("/matches", auth, userController.getMatches);

module.exports = router;
