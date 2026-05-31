const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    runId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun', default: null },
    testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    screenshotUrl: { type: String, default: null },
    github: {
      issueNumber: { type: Number, default: null },
      issueUrl: { type: String, default: null },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BugReport', bugReportSchema);
