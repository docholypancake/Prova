const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const Project = require('../models/Project');
const TestSuite = require('../models/TestSuite');
const TestCase = require('../models/TestCase');

const router = express.Router();
router.use(auth);

// Load suite by :id + verify owner via project. Attaches req.suite + req.project.
async function loadSuite(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid suite id' });
    }
    const suite = await TestSuite.findById(id);
    if (!suite) return res.status(404).json({ error: 'Suite not found' });
    const project = await Project.findById(suite.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.suite = suite;
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}

// Load case by :id + verify owner via project. Attaches req.testCase + req.project.
async function loadCase(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid case id' });
    }
    const testCase = await TestCase.findById(id);
    if (!testCase) return res.status(404).json({ error: 'Case not found' });
    const project = await Project.findById(testCase.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.testCase = testCase;
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}

const caseValidators = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('testCaseId').optional().isString(),
  body('feature').optional().isString(),
  body('type').optional().isString(),
  body('priority').optional().isIn(['P0', 'P1', 'P2', 'P3']),
  body('preconditions').optional().isString(),
  body('testData').optional().isString(),
  body('steps').optional().isArray().withMessage('steps must be an array'),
  body('steps.*').optional().isString(),
  body('expectedResult').optional().isString(),
  body('postconditions').optional().isString(),
  body('rationale').optional().isString(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString(),
  body('order').optional().isInt(),
];

// Fields that can be set/updated on a case (title handled explicitly on create).
const CASE_FIELDS = [
  'title', 'testCaseId', 'feature', 'type', 'priority', 'preconditions',
  'testData', 'steps', 'expectedResult', 'postconditions', 'rationale', 'tags', 'order',
];

// GET /api/suites/:id/cases → cases in suite (owner only)
router.get('/suites/:id/cases', loadSuite, async (req, res, next) => {
  try {
    const cases = await TestCase.find({ suiteId: req.suite._id }).sort({ order: 1 });
    res.json({ cases });
  } catch (err) {
    next(err);
  }
});

// POST /api/suites/:id/cases → create case (owner only)
router.post('/suites/:id/cases', loadSuite, caseValidators, validate, async (req, res, next) => {
  try {
    const data = { suiteId: req.suite._id, projectId: req.suite.projectId };
    CASE_FIELDS.forEach((f) => {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    });
    const testCase = await TestCase.create(data);
    res.status(201).json({ case: testCase });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cases/:id → update (owner only)
router.put(
  '/cases/:id',
  loadCase,
  body('title').optional().trim().notEmpty(),
  body('testCaseId').optional().isString(),
  body('feature').optional().isString(),
  body('type').optional().isString(),
  body('priority').optional().isIn(['P0', 'P1', 'P2', 'P3']),
  body('preconditions').optional().isString(),
  body('testData').optional().isString(),
  body('steps').optional().isArray(),
  body('steps.*').optional().isString(),
  body('expectedResult').optional().isString(),
  body('postconditions').optional().isString(),
  body('rationale').optional().isString(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString(),
  body('order').optional().isInt(),
  validate,
  async (req, res, next) => {
    try {
      CASE_FIELDS.forEach((f) => {
        if (req.body[f] !== undefined) req.testCase[f] = req.body[f];
      });
      await req.testCase.save();
      res.json({ case: req.testCase });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/cases/:id → delete (owner only)
router.delete('/cases/:id', loadCase, async (req, res, next) => {
  try {
    await req.testCase.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
