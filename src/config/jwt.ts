// config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  expiresIn: '7d', // Token expiration time (7 days)
  refreshExpiresIn: '30d' // Refresh token expiration
};