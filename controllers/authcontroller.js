const authService = require('../services/auth-service');
const oauthConfig = require('../config/oauth');

exports.googleAuth = (req, res) => {
  const url = oauthConfig.googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: oauthConfig.providers.google.scopes
  });
  res.redirect(url);
};

exports.googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    const { token, user, tenants } = await authService.handleGoogleCallback(code);
    res.json({ token, user, tenants });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await authService.register(email, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, globalRoles, tenantRoles } = req.body;
    const token = await authService.login(email, password, globalRoles, tenantRoles);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = await authService.verifyToken(token);
    res.json(user);
  } catch (err) {
    next(err);
  }
};