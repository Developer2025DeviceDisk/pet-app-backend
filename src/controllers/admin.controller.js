const Report = require("../models/report");
const Message = require("../models/message");
const User = require("../models/user");
const { logEvent } = require("../utils/moderatorLogger");

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "phone fullName email profileImage")
      .populate("reportedUser", "phone fullName email profileImage")
      .populate("message", "content mediaUrl mediaType createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const deletedMessage = await Message.findByIdAndDelete(messageId);
    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Log deletion action
    logEvent("MESSAGE_DELETED", {
      messageId,
      senderId: deletedMessage.sender,
      deletedByAdminId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isBanned = true;
    await user.save();

    // Log user ban
    logEvent("USER_BANNED", {
      userId,
      phone: user.phone,
      bannedByAdminId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: "User banned successfully"
    });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    report.status = "Resolved";
    await report.save();

    // Log report resolution
    logEvent("REPORT_RESOLVED", {
      reportId,
      resolvedByAdminId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: "Report marked as resolved successfully",
      report
    });
  } catch (error) {
    console.error("Error resolving report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
