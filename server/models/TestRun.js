const mongoose = require('mongoose');

const runCaseSchema = new mongoose.Schema(
  {
    testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', required: true },
    result: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'skipped', 'blocked'],
      default: 'pending',
    },
    note: { type: String, default: '' },
    screenshotUrl: { type: String, default: null },
    bugId: { type: mongoose.Schema.Types.ObjectId, ref: 'BugReport', default: null },
  },
  { _id: false }
);

const testRunSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    githubPR: {
      type: {
        number: Number,
        title: String,
        sha: String,
      },
      default: null,
    },
    status: {
      type: String,
      enum: ['in_progress', 'passed', 'failed', 'aborted'],
      default: 'in_progress',
    },
    cases: { type: [runCaseSchema], default: [] },
    shareToken: { type: String, unique: true, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestRun', testRunSchema);
