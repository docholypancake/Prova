const { COOKIE_NAME, verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Verify JWT and attach req.user (Mongo doc) + req.githubToken.
// Token source: httpOnly cookie (the web app) OR `Authorization: Bearer <jwt>`
// header (API tooling like Postman/curl, which can't easily set the cookie).
module.exports = async function auth(req, res, next) {
  try {
    let token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token && req.headers.authorization) {
      const [scheme, value] = req.headers.authorization.split(' ');
      if (scheme === 'Bearer' && value) token = value.trim();
    }
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    req.githubToken = payload.accessToken; // cached GitHub OAuth token
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
