const User = require("../models/user.js");
const { generateToken } = require("../utils/jwt");

// Demo account for App Store / Play Store review (reviewers cannot receive a
// real SMS OTP). This phone number always uses the fixed OTP below.
const REVIEW_PHONE = "9555942520";
const REVIEW_OTP = "123456";

// 🔐 Generate Random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================= REGISTER / LOGIN (Unified) =================
exports.register = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({ phone });
    }

    // Generate OTP (fixed for the review account)
    const otp = phone === REVIEW_PHONE ? REVIEW_OTP : generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // In a real app, send OTP via SMS/Email. 
    // Here, we return it in the response for the app to display.
    res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      otp: otp, // RETURNED FOR TESTING
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN (Legacy endpoint, same logic) =================
exports.login = exports.register;

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Review account: accept the fixed OTP regardless of expiry so reviewers
    // can always log in.
    if (phone === REVIEW_PHONE && otp === REVIEW_OTP) {
      let reviewUser = await User.findOne({ phone });
      if (!reviewUser) {
        reviewUser = await User.create({ phone });
      }
      reviewUser.otp = undefined;
      reviewUser.otpExpires = undefined;
      reviewUser.isVerified = true;
      await reviewUser.save();

      const reviewToken = generateToken(reviewUser._id);
      return res.status(200).json({ success: true, token: reviewToken, user: reviewUser });
    }

    const user = await User.findOne({
      phone,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP after verification
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= RESEND OTP =================
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = phone === REVIEW_PHONE ? REVIEW_OTP : generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      otp: otp,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};