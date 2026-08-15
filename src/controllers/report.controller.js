const Report = require("../models/report");
const { logEvent } = require("../utils/moderatorLogger");

exports.reportMessage = async (req, res) => {
  try {
    const { messageId, reporterId, senderId, reason, optionalDescription, createdAt } = req.body;

    if (!messageId || !reporterId || !senderId || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const report = new Report({
      reporter: reporterId,
      reportedUser: senderId,
      message: messageId,
      reportType: "message",
      reason: reason,
      optionalDescription: optionalDescription || "",
      createdAt: createdAt || new Date()
    });

    await report.save();

    // Log & notify admin
    logEvent("REPORT_SUBMITTED", {
      reportId: report._id,
      reporterId,
      reportedUserId: senderId,
      messageId,
      reason,
      optionalDescription: optionalDescription || ""
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
