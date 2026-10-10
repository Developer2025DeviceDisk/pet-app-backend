const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    authMethod: { type: String, enum: ['otp', 'password'], default: 'otp' },
    tokenVersion: { type: Number, default: 0 },
    passwordHash: { type: String, select: false },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referralReminders: { type: Boolean, default: false },
    lastReferralReminder: { type: Date },
    latitude: { type: Number },
    longitude: { type: Number },
    pushTokens: { type: [String], default: [], select: false },
    notificationsEnabled: { type: Boolean, default: false },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    fullName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { transform(doc, result) { delete result.otp; delete result.otpExpires; delete result.pushTokens; delete result.passwordHash; return result; } } }
);

module.exports = mongoose.model("User", userSchema);
