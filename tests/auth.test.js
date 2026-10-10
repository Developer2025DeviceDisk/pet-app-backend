const { test } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/user');
const verification = require('../src/services/verification');
let sent = 0, writes = 0, approved = false;
verification.startVerification = async () => { sent++; };
verification.checkVerification = async () => approved;
User.findOneAndUpdate = async (query, update) => {
  writes++;
  assert.equal(query.phone, '9876543210');
  assert.equal(update.$set.isAdmin, undefined);
  return { _id: 'user', phone: query.phone, isVerified: true, isAdmin: false };
};
const controller = require('../src/controllers/auth.controller');
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
test('requesting a code neither creates a profile nor returns the code', async () => {
  const res = response(); await controller.register({ body: { phone: '9876543210' } }, res);
  assert.equal(res.body.success, true); assert.equal(res.body.otp, undefined);
  assert.equal(sent, 1); assert.equal(writes, 0);
});
test('failed provider verification cannot create an account or token', async () => {
  const res = response(); await controller.verifyOtp({ body: { phone: '9876543210', otp: '123456' } }, res);
  assert.equal(res.statusCode, 400); assert.equal(res.body.token, undefined); assert.equal(writes, 0);
});
test('verified signup preserves identifiers without privilege assignment', async () => {
  approved = true; const old = process.env.JWT_SECRET; process.env.JWT_SECRET = 'isolated-test-only-secret';
  try {
    const res = response(); await controller.verifyOtp({ body: { phone: '+919876543210', otp: '123456' } }, res);
    assert.equal(res.body.success, true); assert.equal(res.body.user.isAdmin, false); assert.ok(res.body.token);
  } finally { if (old === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = old; }
});
