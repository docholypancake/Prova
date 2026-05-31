const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loadProject } = require('../middleware/ownership');

const Project = require('../models/Project');
const TestSuite = require('../models/TestSuite');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const BugReport = require('../models/BugReport');
const Notification = require('../models/Notification');
const { deleteWebhook } = require('../utils/github');

const router = express.Router();

// All project routes require auth
router.use(auth);

const FREE_TIER_PROJECT_LIMIT = 1;

// GET /api/projects → current user's projects
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects → create (free tier: max 1 project)
router.post(
  '/',
  body('name').trim().notEmpty().withMessage('name is required'),
  body('description').optional().isString(),
  body('github.owner').optional({ nullable: true }).isString(),
  body('github.repo').optional({ nullable: true }).isString(),
  validate,
  async (req, res, next) => {
    try {
      if (req.user.plan === 'free') {
        const count = await Project.countDocuments({ owner: req.user._id });
        if (count >= FREE_TIER_PROJECT_LIMIT) {
          return res.status(403).json({
            error: 'Free tier allows a maximum of 1 project. Upgrade to Pro for more.',
          });
        }
      }
      const project = await Project.create({
        name: req.body.name,
        description: req.body.description || '',
        owner: req.user._id,
        github: {
          owner: req.body.github?.owner || null,
          repo: req.body.github?.repo || null,
        },
      });
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:id → owner only
router.get('/:id', loadProject('id'), (req, res) => {
  res.json({ project: req.project });
});

// PUT /api/projects/:id → update (owner only)
router.put(
  '/:id',
  loadProject('id'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('description').optional().isString(),
  body('github.owner').optional({ nullable: true }).isString(),
  body('github.repo').optional({ nullable: true }).isString(),
  validate,
  async (req, res, next) => {
    try {
      const { name, description, github } = req.body;
      if (name !== undefined) req.project.name = name;
      if (description !== undefined) req.project.description = description;
      if (github !== undefined) {
        req.project.github = {
          owner: github.owner ?? req.project.github.owner,
          repo: github.repo ?? req.project.github.repo,
        };
      }
      await req.project.save();
      res.json({ project: req.project });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:id → delete + cascade (owner only)
router.delete('/:id', loadProject('id'), async (req, res, next) => {
  try {
    const projectId = req.project._id;
    // Remove the GitHub webhook first (best-effort; never block deletion).
    if (req.project.webhookId && req.project.github?.owner) {
      try {
        await deleteWebhook(
          req.githubToken,
          req.project.github.owner,
          req.project.github.repo,
          req.project.webhookId
        );
      } catch (err) {
        console.error('[github] webhook delete on project delete failed:', err.message);
      }
    }
    // Cascade all child documents.
    await TestRun.deleteMany({ projectId });
    await TestCase.deleteMany({ projectId });
    await TestSuite.deleteMany({ projectId });
    await BugReport.deleteMany({ projectId });
    await Notification.deleteMany({ projectId });
    await req.project.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
