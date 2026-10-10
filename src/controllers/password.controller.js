const { randomBytes, scrypt, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const derive = promisify(scrypt);
const User = require('../models/user');
const { normalizeEmail } = require('../services/verification');
const { generateToken } = require('../utils/jwt');
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}
async function checkPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [salt, hex] = stored.split(':');
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hex || '')) return false;
  const actual = await derive(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hex, 'hex'));
}
exports.signup = async (req, res) => {
  const email = normalizeEmail(req.body.email), password = req.body.password;
  if (!email || typeof password !== 'string' || password.length < 12 || password.length > 128) return res.status(400).json({ success: false, message: 'Use a valid email and a password of 12–128 characters' });
  try {
    const passwordHash = await hashPassword(password);
    const referrer = typeof req.body.referralCode === 'string' && /^[a-f0-9]{16}$/i.test(req.body.referralCode) ? await User.findOne({ referralCode: req.body.referralCode.toLowerCase(), isBanned: false }) : null;
    const user = await User.create({ email, passwordHash, authMethod: 'password', ...(referrer ? { referredBy: referrer._id } : {}) });
    res.status(201).json({ success: true, user, token: generateToken(user._id, user.tokenVersion) });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 503).json({ success: false, message: error.code === 11000 ? 'An account with this email already exists. Please sign in.' : 'Could not create your account. Please try again.' });
  }
};
exports.login = async (req, res) => {
  const email = normalizeEmail(req.body.email), password = req.body.password;
  if (!email || typeof password !== 'string' || password.length > 128) return res.status(400).json({ success: false, message: 'Enter your email and password' });
  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    // A dummy hash keeps unknown-account requests on the same expensive path.
    const valid = await checkPassword(password, user?.passwordHash || `${'0'.repeat(32)}:${'0'.repeat(128)}`);
    if (!valid || !user || user.isBanned || user.authMethod !== 'password') return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    res.json({ success: true, user, token: generateToken(user._id, user.tokenVersion) });
  } catch { res.status(503).json({ success: false, message: 'Could not sign in. Please try again.' }); }
};
exports.hashPassword = hashPassword;
exports.checkPassword = checkPassword;
exports.change = async (req, res) => {
  const password = req.body.password;
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return res.status(400).json({ success: false, message: 'Use a password of 12–128 characters' });
  try {
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (user.authMethod === 'password' && (typeof req.body.currentPassword !== 'string' || !await checkPassword(req.body.currentPassword, user.passwordHash))) return res.status(403).json({ success: false, message: 'Current password is incorrect' });
    const email = normalizeEmail(req.body.email || user.email);
    if (!email) return res.status(400).json({ success: false, message: 'Add an email for your account' });
    user.passwordHash = await hashPassword(password); user.email = email; user.authMethod = 'password'; user.tokenVersion = (user.tokenVersion || 0) + 1; await user.save();
    req.app.get('socketio')?.in(`user:${user._id}`).disconnectSockets(true);
    res.json({ success: true, user, token: generateToken(user._id, user.tokenVersion) });
  } catch { res.status(400).json({ success: false, message: 'Could not update your password or email' }); }
};
