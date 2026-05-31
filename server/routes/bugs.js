const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loadProject } = require('../middleware/ownership');
const { createIssue } = require('../utils/github');

const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const BugReport = require('../models/BugReport');

const router = express.Router();
router.use(auth);

// Load bug by :id + verify owner via project. Attaches req.bug + req.project.
async function loadBug(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid bug id' });
    const bug = await BugReport.findById(id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    const project = await Project.findById(bug.projectId);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.bug = bug;
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}

// GET /api/projects/:id/bugs → list project bugs (owner only)
router.get('/projects/:id/bugs', loadProject('id'), async (req, res, next) => {
  try {
    const bugs = await BugReport.find({ projectId: req.project._id })
      .sort({ createdAt: -1 })
      .populate('testCaseId', 'title testCaseId');
    res.json({ bugs });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/bugs → create a bug (optionally linked to run + case)
router.post(
  '/projects/:id/bugs',
  loadProject('id'),
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').optional().isString(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('runId').optional({ nullable: true }).isMongoId(),
  body('testCaseId').optional({ nullable: true }).isMongoId(),
  body('screenshotUrl').optional({ nullable: true }).isString(),
  validate,
  async (req, res, next) => {
    try {
      const bug = await BugReport.create({
        projectId: req.project._id,
        runId: req.body.runId || null,
        testCaseId: req.body.testCaseId || null,
        title: req.body.title,
        description: req.body.description || '',
        severity: req.body.severity || 'medium',
        screenshotUrl: req.body.screenshotUrl || null,
        createdBy: req.user._id,
      });

      // Link bug to the run case entry if provided.
      if (req.body.runId && req.body.testCaseId) {
        const run = await TestRun.findById(req.body.runId);
        if (run && run.projectId.toString() === req.project._id.toString()) {
          const entry = run.cases.find((c) => c.testCaseId.toString() === req.body.testCaseId);
          if (entry) {
            entry.bugId = bug._id;
            await run.save();
          }
        }
      }

      res.status(201).json({ bug });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/bugs/:id/github-sync → create a GitHub Issue (owner only, repo connected)
router.post('/bugs/:id/github-sync', loadBug, async (req, res, next) => {
  try {
    if (!req.project.github?.owner || !req.project.github?.repo) {
      return res.status(400).json({ error: 'Project has no connected GitHub repo' });
    }
    if (req.bug.github?.issueNumber) {
      return res.status(409).json({ error: 'Already synced', bug: req.bug });
    }

    const testCase = req.bug.testCaseId ? await TestCase.findById(req.bug.testCaseId) : null;
    const steps = testCase?.steps?.length
      ? testCase.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '_n/a_';
    const appUrl = process.env.APP_URL || 'http://localhost:5050';

    const bodyText = [
      testCase ? `**Test Case:** ${testCase.title}` : '',
      '',
      `**Steps:**\n${steps}`,
      '',
      `**Expected:**\n${testCase?.expectedResult || '_n/a_'}`,
      '',
      `**Actual:**\n${req.bug.description || '_n/a_'}`,
      '',
      `**Severity:** ${req.bug.severity}`,
      req.bug.screenshotUrl ? `\n![screenshot](${req.bug.screenshotUrl})` : '',
      '',
      '---',
      `*Reported via [Prova](${appUrl})*`,
    ].join('\n');

    const issue = await createIssue(req.githubToken, req.project.github.owner, req.project.github.repo, {
      title: req.bug.title,
      body: bodyText,
      labels: ['bug'],
    });

    req.bug.github = { issueNumber: issue.number, issueUrl: issue.url };
    await req.bug.save();
    res.json({ bug: req.bug });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bugs/:id (owner only)
router.delete('/bugs/:id', loadBug, async (req, res, next) => {
  try {
    await req.bug.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
