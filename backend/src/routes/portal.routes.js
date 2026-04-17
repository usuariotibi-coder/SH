const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload.middleware');
const ctrl = require('../controllers/portal.controller');

// Public routes — no JWT middleware
router.get('/:token', ctrl.getPortalInfo);
router.post('/:token/documents', upload.single('file'), ctrl.uploadDocument);

module.exports = router;
