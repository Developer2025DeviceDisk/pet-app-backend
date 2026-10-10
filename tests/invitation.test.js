const { test } = require('node:test');
const assert = require('node:assert/strict');
const Pet = require('../src/models/pet');
const Match = require('../src/models/match');
const { invite } = require('../src/controllers/invitation.controller');
let writes = 0, target = { _id: 'dogB', owner: 'bob', goal: 'Play Date' }, blocked = false;
Pet.findById = async () => target;
Pet.findOne = async query => query.owner === 'alice' && query._id === 'dogA' ? { _id: 'dogA' } : null;
Match.findOne = async () => blocked ? { blockedBy: 'bob' } : null;
Match.findOneAndUpdate = async (query, update) => { writes++; assert.equal(query.invitationKey, 'dogA:dogB:Play Date'); return { _id: 'conversation', ...update.$setOnInsert }; };
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; } });
test('invitation cannot use another owner’s pet or target oneself', async () => {
  const res = response(); await invite({ user: { _id: 'alice' }, body: { petId: 'dogB', myPetId: 'not-mine', category: 'Play Date' } }, res); assert.equal(res.statusCode, 400); assert.equal(writes, 0);
});
test('mating invitations respect the recipient’s preference', async () => {
  const res = response(); await invite({ user: { _id: 'alice' }, body: { petId: 'dogB', myPetId: 'dogA', category: 'Find Mate' } }, res); assert.equal(res.statusCode, 400); assert.equal(writes, 0);
});
test('blocked owners cannot create a new invitation', async () => {
  blocked = true; const res = response(); await invite({ user: { _id: 'alice' }, body: { petId: 'dogB', myPetId: 'dogA', category: 'Play Date' } }, res); assert.equal(res.statusCode, 403); assert.equal(writes, 0); blocked = false;
});
test('valid invitation opens a two-participant conversation', async () => {
  const res = response(); await invite({ user: { _id: 'alice' }, body: { petId: 'dogB', myPetId: 'dogA', category: 'Play Date' } }, res); assert.equal(res.body.success, true); assert.deepEqual(res.body.match.users, ['alice', 'bob']); assert.equal(writes, 1);
});
