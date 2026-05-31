const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loadProject } = require('../middleware/ownership');

const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const { postStatus } = require('../utils/github');

const router = express.Router();
router.use(auth);

// Load a run by :id and verify owner via its project. Attaches req.run + req.project.
async function loadRun(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid run id' });
    }
    const run = await TestRun.findById(id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    const project = await Project.findById(run.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.run = run;
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}

function computeStatus(run) {
  const total = run.cases.length;
  const passed = run.cases.filter((c) => c.result === 'passed').length;
  const failedOrBlocked = run.cases.filter((c) => ['failed', 'blocked'].includes(c.result)).length;
  return { total, passed, failedOrBlocked };
}

// GET /api/projects/:id/runs → list runs for a project (owner only)
router.get('/projects/:id/runs', loadProject('id'), async (req, res, next) => {
  try {
    const runs = await TestRun.find({ projectId: req.project._id }).sort({ createdAt: -1 });
    res.json({ runs });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/runs → create run (body: name, selectedCaseIds[], githubPR?)
router.post(
  '/projects/:id/runs',
  loadProject('id'),
  body('name').trim().notEmpty().withMessage('name is required'),
  body('selectedCaseIds').isArray({ min: 1 }).withMessage('select at least one case'),
  body('selectedCaseIds.*').isMongoId(),
  body('githubPR').optional({ nullable: true }).isObject(),
  validate,
  async (req, res, next) => {
    try {
      // Only include cases that actually belong to this project.
      const cases = await TestCase.find({
        _id: { $in: req.body.selectedCaseIds },
        projectId: req.project._id,
      });
      if (cases.length === 0) {
        return res.status(400).json({ error: 'No valid cases for this project' });
      }
      const run = await TestRun.create({
        projectId: req.project._id,
        name: req.body.name,
        githubPR: req.body.githubPR || null,
        cases: cases.map((c) => ({ testCaseId: c._id, result: 'pending' })),
        shareToken: nanoid(10),
        createdBy: req.user._id,
        status: 'in_progress',
      });
      res.status(201).json({ run });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/runs/:id → run with populated case details (owner only)
router.get('/runs/:id', loadRun, async (req, res, next) => {
  try {
    const populated = await TestRun.findById(req.run._id).populate('cases.testCaseId');
    res.json({ run: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/runs/:id/cases/:caseId → update a single case result (owner only)
router.put(
  '/runs/:id/cases/:caseId',
  loadRun,
  body('result').optional().isIn(['pending', 'passed', 'failed', 'skipped', 'blocked']),
  body('note').optional().isString(),
  body('screenshotUrl').optional({ nullable: true }).isString(),
  body('bugId').optional({ nullable: true }).isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const entry = req.run.cases.find((c) => c.testCaseId.toString() === req.params.caseId);
      if (!entry) return res.status(404).json({ error: 'Case not in this run' });

      ['result', 'note', 'screenshotUrl', 'bugId'].forEach((f) => {
        if (req.body[f] !== undefined) entry[f] = req.body[f];
      });
      await req.run.save();
      res.json({ run: req.run });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/runs/:id/complete → finalize run status + completedAt (owner only)
router.post('/runs/:id/complete', loadRun, async (req, res, next) => {
  try {
    const { total, passed, failedOrBlocked } = computeStatus(req.run);
    req.run.status = failedOrBlocked > 0 || passed < total ? 'failed' : 'passed';
    req.run.completedAt = new Date();
    await req.run.save();

    // PR status check — only if the run is tied to a PR sha and a repo is connected.
    // Never throw on GitHub API failure (CLAUDE.md): log and continue.
    if (req.run.githubPR?.sha && req.project.github?.owner && req.project.github?.repo) {
      try {
        const appUrl = process.env.APP_URL || 'http://localhost:5050';
        await postStatus(req.githubToken, req.project.github.owner, req.project.github.repo, req.run.githubPR.sha, {
          state: passed === total ? 'success' : 'failure',
          description: `Manual QA: ${passed}/${total} passed`,
          context: 'prova/manual-qa',
          target_url: `${appUrl}/runs/share/${req.run.shareToken}`,
        });
      } catch (err) {
        console.error('[github] PR status check failed:', err.message);
      }
    }

    res.json({ run: req.run, summary: { total, passed } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
