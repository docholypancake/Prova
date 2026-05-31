const mongoose = require('mongoose');

// Connect to MongoDB. Non-fatal: server still boots if URI missing/unreachable
// so health check and OAuth redirect wiring work during early scaffolding.
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[db] MONGO_URI not set — skipping MongoDB connection');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
  }
}

module.exports = connectDB;
