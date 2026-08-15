const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    reportType: {
      type: String,
      default: "message",
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "Spam",
        "Harassment or Bullying",
        "Hate Speech",
        "Sexual Content",
        "Scam or Fraud",
        "Violence",
        "Other"
      ],
    },
    optionalDescription: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Resolved"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
