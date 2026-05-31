const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const User = require('../models/User');

// Sessionless: we issue our own JWT, so no serialize/deserialize needed.
// Only register the strategy when credentials exist — keeps the server booting
// with a blank .env during scaffolding (passport-github2 throws on empty clientID).
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL || 'http://localhost:5000'}/auth/github/callback`,
        // repo scope needed for webhooks, commit statuses, and issue creation.
        scope: ['user:email', 'repo'],
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails.length ? profile.emails[0].value : null;

        const user = await User.findOneAndUpdate(
          { githubId: profile.id },
          {
            githubId: profile.id,
            username: profile.username || profile.displayName,
            email,
            avatar: profile.photos && profile.photos.length ? profile.photos[0].value : null,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Pass the GitHub access token through so we can cache it in the JWT.
        return done(null, { user, accessToken });
      } catch (err) {
        return done(err);
      }
    }
    )
  );
} else {
  console.warn('[passport] GITHUB_CLIENT_ID/SECRET not set — GitHub OAuth disabled');
}

module.exports = passport;
