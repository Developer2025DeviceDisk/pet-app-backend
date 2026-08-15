const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'moderation.log');

/**
 * Logs moderation events to logs/moderation.log and output to console.
 * @param {string} action The action being taken (e.g. REPORT_SUBMITTED, MESSAGE_DELETED, USER_BANNED)
 * @param {object} details Object containing dynamic event details
 */
const logEvent = (action, details) => {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${action.toUpperCase()}] ${JSON.stringify(details)}\n`;
    
    fs.appendFileSync(logFile, logMessage);
    console.log(`[ModerationLog] [${action.toUpperCase()}]:`, details);
  } catch (error) {
    console.error("Failed to write moderation log:", error);
  }
};

module.exports = {
  logEvent
};
