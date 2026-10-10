const axios = require('axios');
const User = require('../models/user');
async function notify(userId, title, body, data) {
  const user = await User.findById(userId).select('notificationsEnabled +pushTokens').lean();
  if (!user?.notificationsEnabled || !user.pushTokens?.length) return;
  await axios.post('https://exp.host/--/api/v2/push/send', user.pushTokens.map(to => ({ to, title, body, data, sound: 'default' })), { timeout: 10000 });
}
exports.notify = notify;
exports.preferences = async (req, res) => {
  const { pushToken, enabled } = req.body;
  if (typeof enabled !== 'boolean' || (pushToken && !/^(Expo|Exponent)PushToken\[[\w-]+\]$/.test(pushToken))) return res.status(400).json({ success: false, message: 'Invalid notification preferences' });
  const update = { $set: { notificationsEnabled: enabled } };
  if (pushToken) update.$addToSet = { pushTokens: pushToken };
  await User.findByIdAndUpdate(req.user._id, update);
  res.json({ success: true });
};
