const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizePhone, normalizeEmail, startVerification } = require('../src/services/verification');
const { createVerificationLimit } = require('../src/middlewares/verificationLimit');
test('phone normalization preserves Indian account compatibility and rejects malformed input', () => {
  assert.equal(normalizePhone('9876543210'), '+919876543210');
  assert.equal(normalizePhone('+91 98765 43210'), '+919876543210');
  for (const input of [undefined, {}, '123', 'a9876543210']) assert.equal(normalizePhone(input), null);
});
test('missing provider configuration fails closed without returning codes', async () => {
  const old = process.env.TWILIO_VERIFY_SERVICE_SID;
  delete process.env.TWILIO_VERIFY_SERVICE_SID;
  try { await assert.rejects(startVerification('+919876543210'), error => error.status === 503 && !error.message.includes('9876543210')); }
  finally { if (old !== undefined) process.env.TWILIO_VERIFY_SERVICE_SID = old; }
});
test('email addresses are normalized without accepting malformed contacts', () => {
  assert.equal(normalizeEmail(' Person@Example.com '), 'person@example.com'); assert.equal(normalizeEmail('not-an-email'), null);
});
test('aliases share send limit and expired limits allow requests again', () => {
  let time = 0, passes = 0, rejected = 0;
  const limit = createVerificationLimit({ maximum: 2, windowMs: 100, now: () => time });
  const res = { status(code) { assert.equal(code, 429); return this; }, json() { rejected++; } };
  for (const phone of ['9876543210', '+919876543210', '+91 9876543210']) limit({ ip: 'one', body: { phone } }, res, () => passes++);
  assert.equal(passes, 2); assert.equal(rejected, 1);
  time = 101; limit({ ip: 'one', body: { phone: '9876543210' } }, res, () => passes++);
  assert.equal(passes, 3);
});
