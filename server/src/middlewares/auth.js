import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.header('Authorization');

    // Check if token exists and starts with "Bearer "
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied',
      });
    }

    // Extract token (remove "Bearer " prefix)
    const tokenValue = token.slice(7);

    // Verify token
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

    // Check if decoded token has id field
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
      });
    }

    // Find user by id from token and exclude password
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Handle JWT verification errors
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
      });
    }

    // Handle other errors (e.g., database errors)
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export default auth;
