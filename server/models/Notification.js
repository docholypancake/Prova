const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    type: { type: String, default: 'pr_opened' },
    message: { type: String, required: true },
    prNumber: { type: Number, default: null },
    prTitle: { type: String, default: null },
    prSha: { type: String, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
