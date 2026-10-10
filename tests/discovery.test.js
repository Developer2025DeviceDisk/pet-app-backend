const { test } = require('node:test');
const assert = require('node:assert/strict');
const { distanceKm, petAge } = require('../src/services/discovery');
test('radius calculations reject missing coordinates and handle nearby cities', () => {
  const a = { latitude: 12.9716, longitude: 77.5946 };
  assert.equal(distanceKm(a, {}), null); assert.equal(distanceKm(a, a), 0);
  const distance = distanceKm(a, { latitude: 12.98, longitude: 77.6 });
  assert.ok(distance > .5 && distance < 2);
});
test('existing pet age formats remain searchable', () => {
  assert.equal(petAge('< 1 year'), .5); assert.equal(petAge('5+ years'), 5); assert.equal(petAge('10 years'), 10);
});
