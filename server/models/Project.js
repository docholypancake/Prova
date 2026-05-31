const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    github: {
      owner: { type: String, default: null },
      repo: { type: String, default: null },
    },
    webhookId: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
