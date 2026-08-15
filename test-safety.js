const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Models
const User = require("./src/models/user");
const Message = require("./src/models/message");
const Match = require("./src/models/match");
const Report = require("./src/models/report");

// Profanity Filter Utility
const { clean, hasProfanity } = require("./src/utils/profanityFilter");

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=== STARTING SAFETY FEATURE TESTS ===");

  // 1. Test Profanity Filter (no DB needed)
  console.log("\n--- Testing Profanity Filter Utility ---");
  const testPhrase = "You are an idiot and a stupid bastard";
  const cleaned = clean(testPhrase);
  console.log("Input:", testPhrase);
  console.log("Cleaned:", cleaned);

  const checkClean = !hasProfanity("This is a clean message");
  const checkDirty = hasProfanity("You idiot");
  if (checkClean && checkDirty) {
    console.log("✅ Profanity filter tests passed");
  } else {
    console.error("❌ Profanity filter tests failed", { checkClean, checkDirty });
  }

  // Connect to DB
  console.log("\nConnecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Clear any existing test users
  await User.deleteMany({ phone: { $in: ["1111111111", "2222222222", "9999999999"] } });

  // Create Test Users
  console.log("\nCreating test users...");
  const userA = await User.create({ phone: "1111111111", fullName: "Reporter User", isVerified: true });
  const userB = await User.create({ phone: "2222222222", fullName: "Offending User", isVerified: true });
  const adminUser = await User.create({ phone: "9999999999", fullName: "Admin User", isAdmin: true, isVerified: true });
  console.log("✅ Test users created");

  // Create Mock Match and Message
  const match = await Match.create({
    users: [userA._id, userB._id],
    pets: [],
    category: "Play Date"
  });
  const message = await Message.create({
    match: match._id,
    sender: userB._id,
    content: "This is an offensive test message."
  });
  console.log("✅ Test match and message created, messageId:", message._id.toString());

  // Generate Tokens
  const tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET);
  const tokenAdmin = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET);

  let createdReportId;

  // 2. Test Report Submission (POST /reports/message)
  console.log("\n--- Testing POST /api/reports/message ---");
  try {
    const response = await axios.post(`${BASE_URL}/reports/message`, {
      messageId: message._id.toString(),
      reporterId: userA._id.toString(),
      senderId: userB._id.toString(),
      reason: "Harassment or Bullying",
      optionalDescription: "This user was bullying me.",
      createdAt: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${tokenA}` } });

    if (response.status === 201 && response.data.success) {
      console.log("✅ Report submission passed");
      createdReportId = response.data.report._id;
    } else {
      console.error("❌ Report submission failed:", response.data);
    }
  } catch (err) {
    console.error("❌ Report submission error:", err.response?.data || err.message);
  }

  // 3. Test Admin View Reports (GET /admin/reports)
  console.log("\n--- Testing GET /api/admin/reports ---");
  try {
    const response = await axios.get(`${BASE_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });

    if (response.status === 200 && response.data.success && response.data.reports.length > 0) {
      const found = response.data.reports.find(r => r._id.toString() === createdReportId.toString());
      if (found) {
        console.log("✅ Admin view reports passed — found report with reason:", found.reason);
      } else {
        console.error("❌ Submitted report not found in admin list");
      }
    } else {
      console.error("❌ Admin view reports failed");
    }
  } catch (err) {
    console.error("❌ Admin view reports error:", err.response?.data || err.message);
  }

  // 4. Test Admin Delete Message (DELETE /admin/messages/:messageId)
  console.log("\n--- Testing DELETE /api/admin/messages/:messageId ---");
  try {
    const response = await axios.delete(`${BASE_URL}/admin/messages/${message._id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });

    if (response.status === 200 && response.data.success) {
      const deletedCheck = await Message.findById(message._id);
      if (!deletedCheck) {
        console.log("✅ Admin delete message passed — message removed from DB");
      } else {
        console.error("❌ Message still exists in DB after delete!");
      }
    } else {
      console.error("❌ Admin delete message failed:", response.data);
    }
  } catch (err) {
    console.error("❌ Admin delete message error:", err.response?.data || err.message);
  }

  // 5. Test Admin Ban User (POST /admin/users/:userId/ban)
  console.log("\n--- Testing POST /api/admin/users/:userId/ban ---");
  try {
    const response = await axios.post(`${BASE_URL}/admin/users/${userB._id}/ban`, {}, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });

    if (response.status === 200 && response.data.success) {
      const bannedCheck = await User.findById(userB._id);
      if (bannedCheck.isBanned) {
        console.log("✅ Admin ban user passed — user.isBanned = true in DB");
      } else {
        console.error("❌ User is NOT banned in DB after ban request!");
      }
    } else {
      console.error("❌ Admin ban user failed:", response.data);
    }
  } catch (err) {
    console.error("❌ Admin ban user error:", err.response?.data || err.message);
  }

  // 6. Test Banned User Auth (POST /auth/register with banned user phone)
  console.log("\n--- Testing Auth rejected for banned user ---");
  try {
    const tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET);
    const response = await axios.get(`${BASE_URL}/chat/messages/FAKEMATCHID`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    console.error("❌ Banned user was NOT rejected! Status:", response.status);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log("✅ Banned user correctly rejected with 403:", err.response.data.message);
    } else {
      console.error("❌ Unexpected error for banned user check:", err.response?.status, err.response?.data || err.message);
    }
  }

  // 7. Test Admin Resolve Report (POST /admin/reports/:reportId/resolve)
  console.log("\n--- Testing POST /api/admin/reports/:reportId/resolve ---");
  try {
    const response = await axios.post(`${BASE_URL}/admin/reports/${createdReportId}/resolve`, {}, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });

    if (response.status === 200 && response.data.success) {
      const resolvedCheck = await Report.findById(createdReportId);
      if (resolvedCheck.status === "Resolved") {
        console.log("✅ Admin resolve report passed — report status = Resolved");
      } else {
        console.error("❌ Report is NOT resolved in DB!");
      }
    } else {
      console.error("❌ Admin resolve report failed:", response.data);
    }
  } catch (err) {
    console.error("❌ Admin resolve report error:", err.response?.data || err.message);
  }

  // 8. Test Non-Admin Cannot Access Admin Routes
  console.log("\n--- Testing non-admin user cannot access admin routes ---");
  try {
    const response = await axios.get(`${BASE_URL}/admin/reports`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    console.error("❌ Non-admin was NOT rejected! Status:", response.status);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log("✅ Non-admin correctly rejected with 403");
    } else {
      console.error("❌ Unexpected error for non-admin check:", err.response?.status, err.response?.data || err.message);
    }
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await User.deleteMany({ _id: { $in: [userA._id, userB._id, adminUser._id] } });
  await Match.deleteMany({ _id: match._id });
  await Message.deleteMany({ _id: message._id });
  await Report.deleteMany({ _id: createdReportId });
  console.log("✅ Cleanup complete.");

  await mongoose.disconnect();
  console.log("\n=== ALL TESTS COMPLETED ===");
}

runTests().catch(err => {
  console.error("FATAL Test error:", err);
  mongoose.disconnect();
});
