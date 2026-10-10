const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { createVerificationLimit } = require('../middlewares/verificationLimit');
const sendLimit = createVerificationLimit({ maximum: 5 });
const checkLimit = createVerificationLimit({ maximum: 10 });
router.post('/password/signup', sendLimit, require('../controllers/password.controller').signup);
router.post('/password/login', checkLimit, require('../controllers/password.controller').login);
router.put('/password', require('../middlewares/auth'), checkLimit, require('../controllers/password.controller').change);

router.post("/register", sendLimit, authController.register);
router.post("/login", sendLimit, authController.login);
router.post("/verify-otp", checkLimit, authController.verifyOtp);
router.post("/resend-otp", sendLimit, authController.resendOtp);

module.exports = router;
