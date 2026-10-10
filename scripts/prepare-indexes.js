// Run only against an explicitly selected staging/production database.
// Dry run is the default; --apply performs the reviewed index migration.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Message = require('../src/models/message');
const Match = require('../src/models/match');
async function main() {
  if (!process.env.MONGO_URI) throw new Error('Choose the database with MONGO_URI first');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false });
  const indexes = await User.collection.indexes();
  const legacy = indexes.find(index => index.key.phone === 1 && !index.sparse);
  console.log(legacy ? 'Phone unique index must become sparse for email-only accounts.' : 'Phone index is compatible.');
  if (!process.argv.includes('--apply')) { console.log('Dry run only. No indexes changed.'); return; }
  if (legacy) await User.collection.dropIndex(legacy.name);
  await User.collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
  await User.collection.createIndex({ referralCode: 1 }, { unique: true, sparse: true });
  await Match.collection.createIndex({ invitationKey: 1 }, { unique: true, sparse: true });
  await Message.collection.createIndex({ match: 1, sender: 1, clientId: 1 }, { unique: true, partialFilterExpression: { clientId: { $type: 'string' } } });
  console.log('Required indexes created.');
}
main().catch(() => { console.error('Index preparation failed. Inspect database state privately before retrying.'); process.exitCode = 1; }).finally(() => mongoose.disconnect());
