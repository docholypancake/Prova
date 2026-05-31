const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    suiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSuite',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    testCaseId: { type: String, default: '', trim: true }, // user-entered, e.g. AUTH-LOGIN-01
    feature: { type: String, default: '' },
    type: { type: String, default: '' }, // free text: Functional, UI, Regression, etc.
    priority: { type: String, enum: ['P0', 'P1', 'P2', 'P3'], default: 'P2' },
    preconditions: { type: String, default: '' },
    testData: { type: String, default: '' },
    steps: { type: [String], default: [] },
    expectedResult: { type: String, default: '' },
    postconditions: { type: String, default: '' },
    rationale: { type: String, default: '' }, // "Why this case matters"
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestCase', testCaseSchema);
