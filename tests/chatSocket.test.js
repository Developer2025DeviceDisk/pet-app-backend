const { test } = require('node:test');
const assert = require('node:assert/strict');
const { configureChat, isParticipant } = require('../src/services/chatSocket');

function fixture({ banned = false, verified = true } = {}) {
  let middleware, connection;
  const events = {}, broadcasts = [], saved = [], joined = [];
  const io = { use(fn) { middleware = fn; }, on(name, fn) { connection = fn; }, to(room) { return { emit(event, data) { broadcasts.push({ room, data }); } }; } };
  configureChat(io, {
    verify(token) { if (token !== 'valid') throw new Error(); return { id: 'alice' }; },
    User: { async findById() { return { _id: 'alice', isVerified: verified, isBanned: banned }; } },
    Match: { async findById(id) { return id === 'allowed' ? { users: ['alice', 'bob'] } : id === 'blocked' ? { users: ['alice', 'bob'], blockedBy: 'bob' } : { users: ['bob', 'eve'] }; } },
    Message: { async findOneAndUpdate(key, update) { const prior = saved.find(item => item.clientId === key.clientId); if (prior) return prior; const value = { ...update.$setOnInsert, _id: 'message', createdAt: new Date() }; saved.push(value); return value; } },
  });
  const socket = { handshake: { auth: { token: 'valid' } }, data: {}, on(name, fn) { events[name] = fn; }, async join(id) { joined.push(id); } };
  return { middleware, connection, events, socket, broadcasts, saved, joined };
}

test('only actual conversation participants are admitted', () => {
  assert.equal(isParticipant(null, 'alice'), false);
  assert.equal(isParticipant({ users: ['bob'] }, 'alice'), false);
});
test('invalid, banned and unverified socket sessions are rejected', async () => {
  for (const config of [{ banned: true }, { verified: false }, {}]) {
    const f = fixture(config);
    if (!Object.keys(config).length) f.socket.handshake.auth.token = 'invalid';
    await f.middleware(f.socket, error => assert.ok(error));
  }
});
test('unauthorized joins and sends never reach storage or broadcasts', async () => {
  const f = fixture(); await f.middleware(f.socket, error => assert.equal(error, undefined)); f.connection(f.socket);
  await f.events.join_room('other', result => assert.equal(result.success, false));
  await f.events.send_message({ matchId: 'other', content: 'hello' }, result => assert.equal(result.success, false));
  assert.equal(f.joined.filter(room => room === 'other').length + f.saved.length + f.broadcasts.length, 0);
});
test('sender identity is derived from session; blocked and empty sends fail', async () => {
  const f = fixture(); await f.middleware(f.socket, () => {}); f.connection(f.socket);
  await f.events.send_message({ matchId: 'allowed', senderId: 'eve', content: 'hello', clientId: 'one' }, result => assert.equal(result.success, true));
  assert.equal(f.saved[0].sender, 'alice'); assert.equal(f.broadcasts[0].data.clientId, 'one');
  await f.events.send_message({ matchId: 'allowed', content: 'hello', clientId: 'one' }, result => assert.equal(result.success, true));
  assert.equal(f.saved.length, 1, 'retry must not insert a duplicate message');
  for (const data of [{ matchId: 'blocked', content: 'hello' }, { matchId: 'allowed', content: ' ' }]) {
    await f.events.send_message(data, result => assert.equal(result.success, false));
  }
  assert.equal(f.saved.length, 1);
});
