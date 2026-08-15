// List of profane/offensive words. Easy to extend.
const profaneWords = [
  "idiot",
  "stupid",
  "asshole",
  "bitch",
  "bastard",
  "nigger",
  "faggot",
  "cunt",
  "fuck",
  "shit",
  "whore",
  "slut",
  "bastards"
];

/**
 * Checks if a string contains any profane words.
 * @param {string} text 
 * @returns {boolean}
 */
const hasProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;
  return profaneWords.some(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
    return regex.test(text);
  });
};

/**
 * Replaces profane words with asterisks matching their exact length.
 * @param {string} text 
 * @returns {string}
 */
const clean = (text) => {
  if (!text || typeof text !== 'string') return text;
  let cleanedText = text;
  
  profaneWords.forEach(word => {
    const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, (match) => '*'.repeat(match.length));
  });

  return cleanedText;
};

module.exports = {
  profaneWords,
  hasProfanity,
  clean
};
