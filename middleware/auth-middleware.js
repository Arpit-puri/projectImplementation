const jwt = require('jsonwebtoken');
const authService = require('../services/auth-service');

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No authorization header provided',
        code: 'AUTH_HEADER_MISSING'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token and attach user to request
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    // Log unexpected errors
    console.error('Auth middleware error:', err);
    res.status(500).json({ 
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = authMiddleware;