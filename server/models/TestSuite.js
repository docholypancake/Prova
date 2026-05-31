const mongoose = require('mongoose');

const testSuiteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSuite', default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestSuite', testSuiteSchema);
