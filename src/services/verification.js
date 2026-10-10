const axios = require('axios');

function normalizePhone(value) {
  if (typeof value !== 'string') return null;
  const phone = value.replace(/[\s()-]/g, '');
  if (/^[6-9]\d{9}$/.test(phone)) return `+91${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
function normalizeEmail(value) {
  if (typeof value !== 'string' || value.length > 254) return null;
  const email = value.trim().toLowerCase();
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email) ? email : null;
}

async function request(resource, fields) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!/^AC[0-9a-f]{32}$/i.test(TWILIO_ACCOUNT_SID || '') || !TWILIO_AUTH_TOKEN || !/^VA[0-9a-f]{32}$/i.test(TWILIO_VERIFY_SERVICE_SID || '')) {
    throw new Error('Verification provider is not configured');
  }
  const result = await axios.post(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/${resource}`, new URLSearchParams(fields).toString(), {
    auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 12000,
  });
  return result.data;
}

async function startVerification(phone, channel = 'sms') {
  try {
    const data = await request('Verifications', { To: phone, Channel: channel });
    if (data.status !== 'pending') throw new Error('Verification not started');
  } catch (error) {
    // Do not propagate provider response bodies, authorization headers or codes.
    const safe = new Error('Verification unavailable');
    safe.status = error.response?.status === 429 ? 429 : 503;
    throw safe;
  }
}

async function checkVerification(phone, code) {
  try {
    const data = await request('VerificationCheck', { To: phone, Code: code });
    return data.status === 'approved';
  } catch (error) {
    if ([400, 404].includes(error.response?.status)) return false;
    const safe = new Error('Verification unavailable');
    safe.status = error.response?.status === 429 ? 429 : 503;
    throw safe;
  }
}

module.exports = { normalizePhone, normalizeEmail, startVerification, checkVerification };
