const { PostHog } = require('posthog-node');

// No-op stub used when POSTHOG_API_KEY is absent (local dev / misconfigured envs).
const noop = {
  capture: () => {},
  identify: () => {},
  captureException: () => {},
  flush: () => Promise.resolve(),
  shutdown: () => Promise.resolve(),
};

if (!process.env.POSTHOG_API_KEY) {
  console.warn('[posthog] POSTHOG_API_KEY not set — analytics disabled');
  module.exports = noop;
} else {
  const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
    enableExceptionAutocapture: true,
    flushInterval: 3000,
    flushAt: 1, // flush immediately after every event — avoids data loss on Render free tier
  });
  console.log('[posthog] analytics enabled →', process.env.POSTHOG_HOST || 'https://eu.i.posthog.com');
  module.exports = posthog;
}
