const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const auth = require("../middlewares/auth");

router.get("/messages/:matchId", auth, chatController.getMessages);

module.exports = router;
