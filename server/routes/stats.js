const express = require('express');

const auth = require('../middleware/auth');
const { loadProject } = require('../middleware/ownership');

const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const BugReport = require('../models/BugReport');

const router = express.Router();
router.use(auth);

function passRate(run) {
  const total = run.cases.length;
  if (!total) return 0;
  const passed = run.cases.filter((c) => c.result === 'passed').length;
  return Math.round((passed / total) * 100);
}

// GET /api/projects/:id/stats → dashboard aggregates (owner only)
router.get('/projects/:id/stats', loadProject('id'), async (req, res, next) => {
  try {
    const projectId = req.project._id;

    const [totalCases, runs, openBugs] = await Promise.all([
      TestCase.countDocuments({ projectId }),
      TestRun.find({ projectId }).sort({ createdAt: -1 }),
      BugReport.find({ projectId, 'github.issueNumber': null })
        .sort({ createdAt: -1 })
        .populate('testCaseId', 'title'),
    ]);

    const completed = runs.filter((r) => r.status !== 'in_progress');
    const avgPassRate = completed.length
      ? Math.round(completed.reduce((sum, r) => sum + passRate(r), 0) / completed.length)
      : 0;

    // 30-day pass-rate trend (one point per completed run in window).
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trend = completed
      .filter((r) => new Date(r.completedAt || r.createdAt) >= cutoff)
      .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt))
      .map((r) => ({
        date: new Date(r.completedAt || r.createdAt).toISOString().slice(0, 10),
        passRate: passRate(r),
        name: r.name,
      }));

    const recentRuns = runs.slice(0, 10).map((r) => ({
      _id: r._id,
      name: r.name,
      status: r.status,
      createdAt: r.createdAt,
      total: r.cases.length,
      passed: r.cases.filter((c) => c.result === 'passed').length,
      passRate: passRate(r),
      githubPR: r.githubPR,
    }));

    res.json({
      stats: {
        totalCases,
        totalRuns: runs.length,
        avgPassRate,
        openBugs: openBugs.length,
      },
      recentRuns,
      trend,
      openBugsList: openBugs.slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
