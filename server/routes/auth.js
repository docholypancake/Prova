const express = require('express');
const passport = require('passport');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');
const auth = require('../middleware/auth');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Start OAuth flow
router.get(
  '/github',
  passport.authenticate('github', { session: false, scope: ['user:email', 'repo'] })
);

// OAuth callback → issue JWT cookie → redirect to client
router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    const { user, accessToken } = req.user;
    const token = signToken({
      id: user._id.toString(),
      githubId: user.githubId,
      username: user.username,
      accessToken, // cached GitHub OAuth token (no separate token store)
    });
    setAuthCookie(res, token);
    res.redirect(`${CLIENT_URL}/dashboard`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Current user
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
