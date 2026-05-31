const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const passport = require('./config/passport');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
// Capture raw body so the GitHub webhook route can verify X-Hub-Signature-256.
app.use(
  express.json({
    limit: '12mb', // room for base64 screenshot uploads
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true });
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/webhooks', require('./routes/webhooks')); // no auth — GitHub calls this
app.use('/api', require('./routes/public')); // no auth — public report + badge (mount before authed /api)
app.use('/api/projects', require('./routes/projects'));
app.use('/api', require('./routes/suites'));
app.use('/api', require('./routes/cases'));
app.use('/api', require('./routes/runs'));
app.use('/api', require('./routes/upload'));
app.use('/api', require('./routes/github'));
app.use('/api', require('./routes/notifications'));
app.use('/api', require('./routes/bugs'));
app.use('/api', require('./routes/stats'));

// Error handler (must be last)
app.use(require('./middleware/errorHandler'));

module.exports = app;
