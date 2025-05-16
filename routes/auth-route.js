const express = require('express');
const router = express.Router();
const {
  googleAuth,
  googleCallback,
  register,
  login,
  getMe
} = require('../controllers/authcontroller');

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

module.exports = router;