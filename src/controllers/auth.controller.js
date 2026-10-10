const User = require('../models/user');
const { generateToken } = require('../utils/jwt');
const { startVerification, checkVerification, normalizePhone, normalizeEmail } = require('../services/verification');

exports.register = async (req, res) => {
  const phone = req.body.email ? normalizeEmail(req.body.email) : normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ success: false, message: 'Enter a valid mobile number or email' });
  try {
    await startVerification(phone, req.body.email ? 'email' : 'sms');
    // No user or privileges are created before possession is verified.
    res.json({ success: true, message: 'Check for your verification code' });
  } catch (error) {
    res.status(error.status || 503).json({ success: false, message: error.status === 429 ? 'Please wait before requesting another code' : 'Verification is temporarily unavailable. Please try again later.' });
  }
};
exports.login = exports.register;
exports.resendOtp = exports.register;
exports.verifyOtp = async (req, res) => {
  const phone = req.body.email ? normalizeEmail(req.body.email) : normalizePhone(req.body.phone);
  const otp = req.body.otp;
  if (!phone || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: 'Enter your six-digit verification code' });
  try {
    if (!await checkVerification(phone, otp)) return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    // Preserve existing ten-digit Indian account identifiers.
    const storedPhone = phone.startsWith('+91') && phone.length === 13 ? phone.slice(3) : phone;
    const referrer = typeof req.body.referralCode === 'string' && /^[a-f0-9]{16}$/i.test(req.body.referralCode) ? await User.findOne({ referralCode: req.body.referralCode.toLowerCase(), isBanned: false }) : null;
    const user = await User.findOneAndUpdate(req.body.email ? { email: phone } : { phone: storedPhone }, { $set: { isVerified: true }, $unset: { otp: '', otpExpires: '' }, ...(referrer ? { $setOnInsert: { referredBy: referrer._id } } : {}) }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'This account is unavailable' });
    res.json({ success: true, token: generateToken(user._id, user.tokenVersion), user });
  } catch (error) {
    res.status(error.status === 429 ? 429 : 503).json({ success: false, message: 'Unable to verify right now. Please try again later.' });
  }
};
