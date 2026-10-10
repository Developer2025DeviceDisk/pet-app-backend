const Pet = require('../models/pet');
const Match = require('../models/match');
exports.invite = async (req, res) => {
  try {
    const { petId, myPetId, category } = req.body;
    if (!['Play Date', 'Find Mate'].includes(category)) return res.status(400).json({ success: false, message: 'Choose an invitation type' });
    const [pet, mine] = await Promise.all([Pet.findById(petId), Pet.findOne({ _id: myPetId, owner: req.user._id })]);
    if (!pet || !mine || String(pet.owner) === String(req.user._id)) return res.status(400).json({ success: false, message: 'Choose a valid pet profile' });
    if (category === 'Find Mate' && !['Both', 'Find Mate'].includes(pet.goal)) return res.status(400).json({ success: false, message: 'This owner is looking for playdates' });
    const existing = await Match.findOne({ users: { $all: [req.user._id, pet.owner] } });
    if (existing?.blockedBy) return res.status(403).json({ success: false, message: 'Conversation unavailable' });
    // Atomic upsert prevents duplicate invitations for the same pet pair/category.
    const pets = [String(mine._id), String(pet._id)].sort();
    const match = await Match.findOneAndUpdate({ invitationKey: `${pets.join(':')}:${category}` }, { $setOnInsert: { users: [req.user._id, pet.owner], pets, category, invitedBy: req.user._id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ success: true, match });
  } catch { res.status(400).json({ success: false, message: 'Could not open this invitation' }); }
};
