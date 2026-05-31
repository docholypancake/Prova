const mongoose = require('mongoose');
const Project = require('../models/Project');

// Loads a project by req.params[paramName] and verifies req.user owns it.
// Attaches req.project. Returns 400 (bad id), 404 (missing), 403 (not owner).
function loadProject(paramName = 'id') {
  return async (req, res, next) => {
    try {
      const id = req.params[paramName];
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid project id' });
      }
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.project = project;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { loadProject };
