require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db.js");
const indexRouter = require("./src/routes/index");
const errorHandler = require("./src/middlewares/error");
const Message = require("./src/models/message");
const Match = require("./src/models/match");
const profanityFilter = require("./src/utils/profanityFilter");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("socketio", io);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(require('./src/config/storage').uploads, { dotfiles: 'deny', setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff') }));

connectDB();
app.use("/api", indexRouter);

// Global error handler (must be registered after routes) — returns JSON for
// errors thrown in middleware such as multer upload rejections.
app.use(errorHandler);

// Authenticate every socket and authorize each conversation operation.
require('./src/services/chatSocket').configureChat(io);
if (process.env.REFERRAL_REMINDERS_ENABLED === 'true') {
  setInterval(() => require('./src/services/rewards').sendReminders().catch(() => {}), 86400000).unref();
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
