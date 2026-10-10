// Per-process protection. Use a shared gateway/Redis limit before scaling replicas.
const { createHash } = require('crypto');
function createVerificationLimit({ maximum = 5, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const time = now();
    for (const [key, bucket] of buckets) if (bucket.expires <= time) buckets.delete(key);
    const keys = [`ip:${req.ip}`, `recipient:${String(req.body.email || req.body.phone || '').trim().toLowerCase().replace(/[\s()-]/g, '').replace(/^\+91/, '')}`]
      .map(value => createHash('sha256').update(value).digest('hex'));
    if (keys.some(key => (buckets.get(key)?.count || 0) >= maximum) || buckets.size > 10000) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
    }
    for (const key of keys) {
      const bucket = buckets.get(key) || { count: 0, expires: time + windowMs };
      bucket.count++; buckets.set(key, bucket);
    }
    next();
  };
}
module.exports = { createVerificationLimit };
