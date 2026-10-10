const Pet = require('../models/pet');
const User = require('../models/user');
function distanceKm(a, b) {
  if (![a.latitude, a.longitude, b.latitude, b.longitude].every(value => typeof value === 'number' && Number.isFinite(value))) return null;
  const rad = value => value * Math.PI / 180;
  const dlat = rad(b.latitude - a.latitude), dlon = rad(b.longitude - a.longitude);
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function petAge(value) { return String(value).startsWith('<') ? .5 : parseFloat(value); }
async function discover(req, res) {
  try {
    const { breed, gender, temperament, goal } = req.query;
    const radius = Number(req.query.radius || 50), min = Number(req.query.minAge || 0), max = Number(req.query.maxAge || 30);
    if (!Number.isFinite(radius) || radius < 1 || radius > 50 || !Number.isFinite(min) || !Number.isFinite(max) || min > max) return res.status(400).json({ success: false, message: 'Choose valid filters' });
    const owner = await User.findById(req.user._id).lean();
    const query = { owner: { $ne: req.user._id } };
    for (const [key, value] of Object.entries({ breed, gender, temperament })) if (typeof value === 'string' && value.length < 100 && value !== 'Any') query[key] = value;
    if (goal === 'Play Date' || goal === 'Find Mate') query.goal = { $in: [goal, 'Both'] };
    if (req.query.cursor) query._id = { $lt: req.query.cursor };
    const candidates = await Pet.find(query).populate('owner', 'fullName city latitude longitude isBanned isVerified authMethod').sort({ _id: -1 }).limit(100).lean();
    const pets = candidates.filter(pet => (pet.owner?.isVerified || pet.owner?.authMethod === 'password') && !pet.owner.isBanned).map(pet => ({ ...pet, distanceKm: distanceKm(owner, pet.owner) })).filter(pet => {
      const age = petAge(pet.age);
      return age >= min && age <= max && (pet.distanceKm === null ? pet.owner.city === owner.city : pet.distanceKm <= radius);
    }).map(pet => ({ ...pet, owner: { _id: pet.owner._id, fullName: pet.owner.fullName, city: pet.owner.city } }));
    res.json({ success: true, pets, nextCursor: candidates.length === 100 ? String(candidates[candidates.length - 1]._id) : null, distanceSource: 'city-centre' });
  } catch { res.status(500).json({ success: false, message: 'Could not load nearby dogs' }); }
}
module.exports = { discover, distanceKm, petAge };
