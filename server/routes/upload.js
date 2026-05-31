const express = require('express');
const { body } = require('express-validator');

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadImage } = require('../utils/cloudinary');

const router = express.Router();
router.use(auth);

// POST /api/upload → { image: "data:image/png;base64,..." } → { url }
// Body limit raised in app.js (express.json limit) to allow pasted screenshots.
router.post(
  '/upload',
  body('image').isString().notEmpty().withMessage('image (data URI) required'),
  validate,
  async (req, res, next) => {
    try {
      const url = await uploadImage(req.body.image);
      res.status(201).json({ url });
    } catch (err) {
      if (err.status === 503) {
        return res.status(503).json({ error: 'Screenshot upload unavailable — Cloudinary not configured' });
      }
      next(err);
    }
  }
);

module.exports = router;
