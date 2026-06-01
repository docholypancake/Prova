const posthog = require('../utils/posthog');

// Central error handler. Routes forward errors via next(err).
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);
  const distinctId = req.user?._id?.toString();
  posthog.captureException(err, distinctId, {
    path: req.path,
    method: req.method,
    status_code: err.status || 500,
  });
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};
