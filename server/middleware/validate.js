const { validationResult } = require('express-validator');

// Run after express-validator checks; returns 400 with field errors if any.
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
