const express = require('express');
const crypto = require('crypto');

const Project = require('../models/Project');
const Notification = require('../models/Notification');
const posthog = require('../utils/posthog');

const router = express.Router();

// Verify X-Hub-Signature-256 against WEBHOOK_SECRET using the RAW body.
function verifySignature(req) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false;
  const sig = req.get('X-Hub-Signature-256');
  if (!sig || !req.rawBody) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  // timingSafeEqual requires equal-length buffers.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// POST /webhooks/github
router.post('/github', async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.get('X-GitHub-Event');
  const payload = req.body;

  try {
    if (event === 'pull_request' && payload.action === 'opened') {
      const repo = payload.repository;
      const owner = repo?.owner?.login;
      const name = repo?.name;
      const project = await Project.findOne({ 'github.owner': owner, 'github.repo': name });
      if (project) {
        const pr = payload.pull_request;
        await Notification.create({
          projectId: project._id,
          type: 'pr_opened',
          message: `PR #${pr.number} opened: ${pr.title}`,
          prNumber: pr.number,
          prTitle: pr.title,
          prSha: pr.head?.sha || null,
        });
        posthog.capture({
          distinctId: project.owner.toString(),
          event: 'pr webhook received',
          properties: {
            project_id: project._id.toString(),
            github_repo: `${owner}/${name}`,
            pr_number: pr.number,
            has_sha: !!pr.head?.sha,
          },
        });
      }
    }
    // Always 200 so GitHub marks delivery successful.
    res.json({ ok: true });
  } catch (err) {
    console.error('[webhook] handler error:', err.message);
    res.json({ ok: true }); // never fail the delivery
  }
});

module.exports = router;
