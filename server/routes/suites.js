const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loadProject } = require('../middleware/ownership');

const Project = require('../models/Project');
const TestSuite = require('../models/TestSuite');
const TestCase = require('../models/TestCase');

const router = express.Router();
router.use(auth);

// Load a suite by :id, verify owner via its project. Attaches req.suite + req.project.
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

// Build a nested tree from flat suites (parentId references).
function buildTree(suites) {
  const byId = new Map();
  suites.forEach((s) => byId.set(s._id.toString(), { ...s.toObject(), children: [] }));
  const roots = [];
  byId.forEach((node) => {
    const pid = node.parentId ? node.parentId.toString() : null;
    if (pid && byId.has(pid)) byId.get(pid).children.push(node);
    else roots.push(node);
  });
  return roots;
}

// GET /api/projects/:id/suites → nested tree (owner only)
router.get('/projects/:id/suites', loadProject('id'), async (req, res, next) => {
  try {
    const suites = await TestSuite.find({ projectId: req.project._id }).sort({ order: 1 });
    res.json({ suites: buildTree(suites) });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/suites → create suite (owner only)
router.post(
  '/projects/:id/suites',
  loadProject('id'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('description').optional().isString(),
  body('parentId').optional({ nullable: true }).isMongoId(),
  body('order').optional().isInt(),
  validate,
  async (req, res, next) => {
    try {
      const suite = await TestSuite.create({
        projectId: req.project._id,
        name: req.body.name,
        description: req.body.description || '',
        parentId: req.body.parentId || null,
        order: req.body.order ?? 0,
      });
      res.status(201).json({ suite });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/suites/:id → update (owner only)
router.put(
  '/suites/:id',
  loadSuite,
  body('name').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('parentId').optional({ nullable: true }).isMongoId(),
  body('order').optional().isInt(),
  validate,
  async (req, res, next) => {
    try {
      const { name, description, parentId, order } = req.body;
      if (name !== undefined) req.suite.name = name;
      if (description !== undefined) req.suite.description = description;
      if (parentId !== undefined) req.suite.parentId = parentId || null;
      if (order !== undefined) req.suite.order = order;
      await req.suite.save();
      res.json({ suite: req.suite });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/suites/:id → delete + cascade cases + descendant suites (owner only)
router.delete('/suites/:id', loadSuite, async (req, res, next) => {
  try {
    // Collect this suite + all descendants.
    const all = await TestSuite.find({ projectId: req.suite.projectId });
    const childrenOf = new Map();
    all.forEach((s) => {
      const pid = s.parentId ? s.parentId.toString() : null;
      if (!childrenOf.has(pid)) childrenOf.set(pid, []);
      childrenOf.get(pid).push(s._id.toString());
    });
    const toDelete = [];
    const stack = [req.suite._id.toString()];
    while (stack.length) {
      const cur = stack.pop();
      toDelete.push(cur);
      (childrenOf.get(cur) || []).forEach((c) => stack.push(c));
    }
    await TestCase.deleteMany({ suiteId: { $in: toDelete } });
    await TestSuite.deleteMany({ _id: { $in: toDelete } });
    res.json({ ok: true, deletedSuites: toDelete.length });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
