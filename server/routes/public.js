const express = require('express');

const TestRun = require('../models/TestRun');
const Project = require('../models/Project');
const BugReport = require('../models/BugReport');

// Public router — NO auth. Mounted before the authenticated /api routers.
const router = express.Router();

function summarize(cases) {
  const total = cases.length;
  const by = (r) => cases.filter((c) => c.result === r).length;
  return {
    total,
    passed: by('passed'),
    failed: by('failed'),
    skipped: by('skipped'),
    blocked: by('blocked'),
    pending: by('pending'),
  };
}

// GET /api/runs/share/:shareToken → public read-only report
router.get('/runs/share/:shareToken', async (req, res, next) => {
  try {
    const run = await TestRun.findOne({ shareToken: req.params.shareToken }).populate(
      'cases.testCaseId'
    );
    if (!run) return res.status(404).json({ error: 'Report not found' });

    const project = await Project.findById(run.projectId).select('name');
    const bugs = await BugReport.find({ runId: run._id }).select(
      'title severity github testCaseId'
    );

    res.json({
      run: {
        name: run.name,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        githubPR: run.githubPR,
        cases: run.cases.map((c) => ({
          title: c.testCaseId?.title || 'Case',
          testCaseId: c.testCaseId?.testCaseId || '',
          priority: c.testCaseId?.priority || '',
          result: c.result,
          note: c.note,
          screenshotUrl: c.screenshotUrl,
        })),
      },
      project: { name: project?.name || 'Project' },
      summary: summarize(run.cases),
      bugs,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/badge/:shareToken → SVG status badge
router.get('/badge/:shareToken', async (req, res) => {
  const run = await TestRun.findOne({ shareToken: req.params.shareToken });
  let label = 'no data';
  let color = '#9f9f9f';
  if (run) {
    const total = run.cases.length;
    const passed = run.cases.filter((c) => c.result === 'passed').length;
    label = `${passed}/${total} passed`;
    color = passed === total && total > 0 ? '#3fb950' : '#e5534b';
  }

  const left = 'prova';
  const charW = 6.5;
  const lw = Math.round(left.length * charW + 16);
  const rw = Math.round(label.length * charW + 16);
  const w = lw + rw;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${left}: ${label}">
  <rect width="${lw}" height="20" fill="#555"/>
  <rect x="${lw}" width="${rw}" height="20" fill="${color}"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${lw / 2}" y="14">${left}</text>
    <text x="${lw + rw / 2}" y="14">${label}</text>
  </g>
</svg>`;

  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(svg);
});

module.exports = router;
