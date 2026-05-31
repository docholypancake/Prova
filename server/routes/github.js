const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loadProject } = require('../middleware/ownership');
const { registerWebhook, deleteWebhook } = require('../utils/github');

const router = express.Router();
router.use(auth);

// POST /api/projects/:id/github/connect → register PR webhook, store on project
router.post(
  '/projects/:id/github/connect',
  loadProject('id'),
  body('owner').trim().notEmpty().withMessage('owner is required'),
  body('repo').trim().notEmpty().withMessage('repo is required'),
  validate,
  async (req, res, next) => {
    try {
      const { owner, repo } = req.body;
      const webhookUrl = process.env.WEBHOOK_URL;
      const secret = process.env.WEBHOOK_SECRET;

      let webhookId = null;
      if (webhookUrl && secret) {
        try {
          webhookId = await registerWebhook(req.githubToken, owner, repo, webhookUrl, secret);
        } catch (err) {
          // Webhook registration can fail (perms, already exists) — connect anyway,
          // surface a warning so the user knows PR notifications won't fire.
          console.error('[github] webhook registration failed:', err.message);
        }
      }

      // Remove a previous webhook if reconnecting to a different repo.
      if (req.project.webhookId && req.project.github?.owner) {
        try {
          await deleteWebhook(
            req.githubToken,
            req.project.github.owner,
            req.project.github.repo,
            req.project.webhookId
          );
        } catch (err) {
          console.error('[github] old webhook delete failed:', err.message);
        }
      }

      req.project.github = { owner, repo };
      req.project.webhookId = webhookId;
      await req.project.save();

      res.json({
        project: req.project,
        webhookRegistered: !!webhookId,
        warning: webhookId ? undefined : 'Repo connected, but webhook not registered (check WEBHOOK_URL/SECRET and repo admin access).',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/projects/:id/github/disconnect → remove webhook + clear github config
router.post('/projects/:id/github/disconnect', loadProject('id'), async (req, res, next) => {
  try {
    if (req.project.webhookId && req.project.github?.owner) {
      try {
        await deleteWebhook(
          req.githubToken,
          req.project.github.owner,
          req.project.github.repo,
          req.project.webhookId
        );
      } catch (err) {
        console.error('[github] webhook delete failed:', err.message);
      }
    }
    req.project.github = { owner: null, repo: null };
    req.project.webhookId = null;
    await req.project.save();
    res.json({ project: req.project });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
