const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.get("/messages/:matchId", auth, chatController.getMessages);
router.post("/send-media", auth, upload.media.single("media"), chatController.sendMediaMessage);
router.post("/block/:matchId", auth, chatController.blockUser);
router.post("/unblock/:matchId", auth, chatController.unblockUser);

module.exports = router;
