const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, checkPassword } = require('../src/controllers/password.controller');
const User = require('../src/models/user');
test('password hashing uses independent salts and never stores the password', async () => {
  const a = await hashPassword('an-example-long-password'), b = await hashPassword('an-example-long-password');
  assert.notEqual(a, b); assert.equal(a.includes('an-example-long-password'), false);
  assert.equal(await checkPassword('an-example-long-password', a), true);
  assert.equal(await checkPassword('the-wrong-password', a), false);
  assert.equal(await checkPassword('anything', 'malformed'), false);
});
test('password hashes are excluded from API serialization', () => {
  const user = new User({ email: 'test@example.com', passwordHash: 'secret-hash', authMethod: 'password' });
  assert.equal(user.toJSON().passwordHash, undefined);
  assert.equal(user.isAdmin, false); assert.equal(user.isVerified, false);
});
