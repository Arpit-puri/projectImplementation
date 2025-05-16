const express = require('express');
const router = express.Router();
const authService = require('../services/auth-service');
const oauthConfig = require('../config/oauth');
const authService = require('../services/authService');

// Initiate Google OAuth
router.get('/google', (req, res) => {
  const url = oauthConfig.googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: oauthConfig.providers.google.scopes
  });
  res.redirect(url);
});

// Google callback
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    const { token, user, tenants } = await authService.handleGoogleCallback(code);
    
    // Redirect or return token based on client
    res.json({ token, user, tenants });
  } catch (err) {
    next(err);
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.register(email, password);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Protected route example
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = await authService.verifyToken(token);
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;