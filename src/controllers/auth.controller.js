const User = require("../models/user.js");
const axios = require("axios");
const jwt = require("jsonwebtoken");

// 🔐 Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


// ================= REGISTER =================
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

    // 🔹 Send OTP via MSG91
    await axios.post(
      `https://control.msg91.com/api/v5/otp`,
      {
        mobile: phone,
        template_id: process.env.MSG91_TEMPLATE_ID,
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "User not registered" });
    }

    // Send OTP
    await axios.post(
      `https://control.msg91.com/api/v5/otp`,
      {
        mobile: phone,
        template_id: process.env.MSG91_TEMPLATE_ID,
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "OTP sent for login",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const response = await axios.get(
      `https://control.msg91.com/api/v5/otp/verify`,
      {
        params: {
          mobile: phone,
          otp: otp,
        },
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    if (response.data.type === "success") {
      const user = await User.findOne({ phone });

      user.isVerified = true;
      await user.save();

      const token = generateToken(user);

      return res.status(200).json({
        success: true,
        token,
        user,
      });
    }

    res.status(400).json({ message: "Invalid OTP" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= RESEND OTP =================
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    await axios.post(
      `https://control.msg91.com/api/v5/otp/retry`,
      {
        mobile: phone,
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};