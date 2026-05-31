const express = require('express');
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

const router = express.Router();
router.use(auth);

// GET /api/notifications → notifications across the user's projects (unread first)
router.get('/notifications', async (req, res, next) => {
  try {
    const projectIds = await Project.find({ owner: req.user._id }).distinct('_id');
    const notifications = await Notification.find({ projectId: { $in: projectIds } })
      .sort({ read: 1, createdAt: -1 })
      .limit(50);
    const unread = await Notification.countDocuments({
      projectId: { $in: projectIds },
      read: false,
    });
    res.json({ notifications, unread });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read → mark one read (must belong to user's project)
router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ error: 'Not found' });
    const project = await Project.findById(notification.projectId);
    if (!project || project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    notification.read = true;
    await notification.save();
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
