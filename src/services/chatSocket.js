const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Match = require('../models/match');
const Message = require('../models/message');
const profanityFilter = require('../utils/profanityFilter');

const isParticipant = (match, userId) => Boolean(match && match.users.some(id => String(id) === String(userId)));

function configureChat(io, dependencies = {}) {
  const users = dependencies.User || User;
  const matches = dependencies.Match || Match;
  const messages = dependencies.Message || Message;
  const verify = dependencies.verify || (token => jwt.verify(token, process.env.JWT_SECRET));
  io.use(async (socket, next) => {
    try {
      // query is accepted for older clients; new clients use handshake.auth.
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (typeof token !== 'string') throw new Error('Unauthorized');
      const decoded = verify(token);
      const user = await users.findById(decoded.id);
      if (!user || (!user.isVerified && user.authMethod !== 'password') || user.isBanned) throw new Error('Unauthorized');
      if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) throw new Error('Unauthorized');
      socket.data.userId = String(user._id);
      socket.data.tokenVersion = decoded.tokenVersion || 0;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.data.userId}`);
    socket.on('join_room', async (matchId, acknowledgement) => {
      const reply = typeof acknowledgement === 'function' ? acknowledgement : () => {};
      try {
        const match = await matches.findById(matchId);
        if (!isParticipant(match, socket.data.userId)) return reply({ success: false, message: 'Not authorized' });
        await socket.join(String(matchId));
        reply({ success: true });
      } catch {
        reply({ success: false, message: 'Unable to join conversation' });
      }
    });
    socket.on('send_message', async (data, acknowledgement) => {
      const reply = typeof acknowledgement === 'function' ? acknowledgement : () => {};
      try {
        const user = await users.findById(socket.data.userId);
        if (!user || user.isBanned || (!user.isVerified && user.authMethod !== 'password')) return reply({ success: false, message: 'Unauthorized' });
        if (socket.data.tokenVersion !== (user.tokenVersion || 0)) return reply({ success: false, message: 'Session expired' });
        const { matchId, content, clientId } = data || {};
        const match = await matches.findById(matchId);
        if (!isParticipant(match, socket.data.userId)) return reply({ success: false, message: 'Not authorized' });
        if (match.blockedBy) return reply({ success: false, message: 'This conversation is blocked' });
        if (typeof content !== 'string' || !content.trim() || content.length > 4000) {
          return reply({ success: false, message: 'Enter a message of up to 4000 characters' });
        }
        // Media must use the authenticated HTTP upload endpoint.
        if (typeof clientId !== 'string' || !clientId || clientId.length > 100) return reply({ success: false, message: 'A message identifier is required' });
        const key = { match: matchId, sender: socket.data.userId, clientId };
        let saved;
        try {
          saved = await messages.findOneAndUpdate(key, { $setOnInsert: { ...key, content: profanityFilter.clean(content.trim()), hiddenFrom: null } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        } catch (error) {
          if (error.code !== 11000) throw error;
          saved = await messages.findOne(key);
        }
        const message = { _id: saved._id, matchId: String(matchId), senderId: socket.data.userId, content: saved.content, createdAt: saved.createdAt, clientId: typeof clientId === 'string' ? clientId.slice(0, 100) : undefined, hiddenFrom: null };
        io.to(String(matchId)).emit('receive_message', message);
        reply({ success: true, message });
        if (!dependencies.User) {
          for (const recipient of match.users.filter(id => String(id) !== socket.data.userId)) {
            // Keep message text private on the lock screen.
            require('./notifications').notify(recipient, 'Barkmate', 'You have a new message', { matchId: String(matchId) }).catch(() => {});
          }
        }
      } catch {
        reply({ success: false, message: 'Message could not be sent' });
      }
    });
  });
}

module.exports = { configureChat, isParticipant };
