const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db.js");
const indexRouter = require("./src/routes/index"); // ✅ import router

const app = express();

app.use(cors());
app.use(express.json());
console.log(mongoose , "this is my mosogdfy")
connectDB();
app.use("/api", indexRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
