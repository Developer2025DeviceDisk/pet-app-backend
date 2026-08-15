const express = require("express");
const router = express.Router();

const authRouter = require("./auth");
const userRouter = require("./user");
const petRouter = require("./pet");
const chatRouter = require("./chat");
const reportRouter = require("./report");
const adminRouter = require("./admin");

// Mount routes
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/pet", petRouter);
router.use("/chat", chatRouter);
router.use("/reports", reportRouter);
router.use("/admin", adminRouter);

module.exports = router;