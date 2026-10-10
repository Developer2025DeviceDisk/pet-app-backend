const Report = require("../models/report");
const { logEvent } = require("../utils/moderatorLogger");
const Message = require('../models/message');
const Match = require('../models/match');
const { isParticipant } = require('../services/chatSocket');

exports.reportMessage = async (req, res) => {
  try {
    const { messageId, reason, optionalDescription } = req.body;
    const reporterId = req.user._id;
    const message = await Message.findById(messageId);
    const match = message && await Match.findById(message.match);
    if (!isParticipant(match, reporterId) || String(message.sender) === String(reporterId)) return res.status(403).json({ success: false, message: 'Not authorized' });
    const senderId = message.sender;

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
      createdAt: new Date()
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
