const express = require('express');
const passport = require('passport');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');
const auth = require('../middleware/auth');
const posthog = require('../utils/posthog');

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

    const distinctId = user._id.toString();
    posthog.identify({
      distinctId,
      properties: {
        $set: {
          username: user.username,
          email: user.email,
          plan: user.plan,
          avatar: user.avatar,
        },
        $set_once: { first_login: new Date().toISOString() },
      },
    });
    posthog.capture({
      distinctId,
      event: 'user signed in',
      properties: {
        username: user.username,
        github_id: user.githubId,
        plan: user.plan,
      },
    });

    res.redirect(`${CLIENT_URL}/dashboard`);
  }
);

// ── Dev-only bypass login (never active in production) ────────
// Creates/reuses a local dev user and sets a JWT cookie so you can
// test the UI without going through GitHub OAuth.
if (process.env.NODE_ENV !== 'production') {
  const User = require('../models/User');

  router.get('/dev-login', async (req, res) => {
    try {
      let user = await User.findOne({ githubId: 'dev_local_bypass' });
      if (!user) {
        user = await User.create({
          githubId:  'dev_local_bypass',
          username:  'dev',
          email:     'dev@localhost',
          avatar:    null,
          plan:      'free',
        });
      }
      const token = signToken({
        id:          user._id.toString(),
        githubId:    user.githubId,
        username:    user.username,
        accessToken: 'dev_no_github_token',
      });
      setAuthCookie(res, token);
      res.redirect(`${CLIENT_URL}/dashboard`);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

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
