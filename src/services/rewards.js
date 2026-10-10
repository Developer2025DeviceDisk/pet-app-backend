const { randomBytes } = require('crypto');
const User = require('../models/user');
const Pet = require('../models/pet');
const { notify } = require('./notifications');
exports.rewards = async (req, res) => {
  try {
    let account = await User.findById(req.user._id);
    if (!account.referralCode) account = await User.findOneAndUpdate({ _id: account._id, referralCode: { $exists: false } }, { $set: { referralCode: randomBytes(8).toString('hex') } }, { new: true }) || await User.findById(req.user._id);
    const referred = await User.find({ referredBy: account._id, $or: [{ isVerified: true }, { authMethod: 'password' }], isBanned: false, fullName: { $nin: [null, ''] }, city: { $nin: [null, ''] } }).select('_id');
    const completed = await Pet.distinct('owner', { owner: { $in: referred.map(user => user._id) } });
    res.json({ success: true, code: account.referralCode, referrals: completed.length, points: completed.length * 100, reminders: account.referralReminders });
  } catch { res.status(500).json({ success: false, message: 'Could not load rewards' }); }
};
exports.preferences = async (req, res) => {
  if (typeof req.body.enabled !== 'boolean') return res.status(400).json({ success: false, message: 'Choose a preference' });
  await User.findByIdAndUpdate(req.user._id, { $set: { referralReminders: req.body.enabled } }); res.json({ success: true });
};
exports.sendReminders = async () => {
  const cutoff = new Date(Date.now() - 7 * 86400000);
  const candidates = await User.find({ referralReminders: true, notificationsEnabled: true, isBanned: false, $and: [{ $or: [{ isVerified: true }, { authMethod: 'password' }] }, { $or: [{ lastReferralReminder: { $lt: cutoff } }, { lastReferralReminder: { $exists: false } }] }] }).select('_id').limit(100);
  for (const user of candidates) {
    if (Math.random() > .15) continue;
    const claimed = await User.findOneAndUpdate({ _id: user._id, $or: [{ lastReferralReminder: { $lt: cutoff } }, { lastReferralReminder: { $exists: false } }] }, { $set: { lastReferralReminder: new Date() } });
    if (claimed) await notify(user._id, 'A friend for every dog', 'Know another dog owner? Invite them to Barkmate and earn Paw Points.', { screen: 'rewards' }).catch(() => {});
  }
};
