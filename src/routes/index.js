const express = require("express");
const router = express.Router();

const authRouter = require("./auth");
const userRouter = require("./user");
const petRouter = require("./pet");
const chatRouter = require("./chat");

// Mount routes
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/pet", petRouter);
router.use("/chat", chatRouter);

module.exports = router;