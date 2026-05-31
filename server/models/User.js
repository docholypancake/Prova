const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    email: { type: String, default: null },
    avatar: { type: String, default: null },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
