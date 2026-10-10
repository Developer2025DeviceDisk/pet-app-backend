const jwt = require('jsonwebtoken');

const generateToken = (id, tokenVersion = 0) => {
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
