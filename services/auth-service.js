const jwt = require('jsonwebtoken');
const { masterDB } = require('../config/database');
const { googleClient, githubClient } = require('../config/oauth');
const bcrypt = require('bcryptjs');

class AuthService {
  async handleGoogleCallback(code) {
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    return this.processOAuthUser({
      email: payload.email,
      oauthId: payload.sub,
      provider: 'google',
      name: payload.name
    });
  }

  async processOAuthUser({ email, oauthId, provider, name }) {
    const User = masterDB.model('User');
    
    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        oauthId,
        oauthProvider: provider,
        name
      });
      await user.save();
    }

    // Get user's tenants
    const tenantUsers = await masterDB.model('TenantUser')
      .find({ userId: user._id })
      .populate('tenantId');

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        tenants: tenantUsers.map(tu => ({
          tenantId: tu.tenantId.tenantId,
          roles: tu.roles
        }))
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return { token, user, tenants: tenantUsers };
  }
  // User registration
  async register(email, password) {
    const existingUser = await masterDB.model('User').findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new masterDB.model('User')({
      email,
      password: hashedPassword
    });

    await user.save();
    return this.generateToken(user);
  }

  // User login
  async login(email, password) {
    const user = await masterDB.model('User').findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user);
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      roles: user.roles || []
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
  }

  // Verify token middleware
  async verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService();