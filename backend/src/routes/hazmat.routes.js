const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');
const ctrl = require('../controllers/hazmat.controller');

router.use(authenticate);

router.get('/', ctrl.getDisposals);
router.get('/:id', ctrl.getDisposal);
router.post('/', ctrl.createDisposal);
router.put('/:id', ctrl.updateDisposal);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), ctrl.deleteDisposal);

// Evidence
router.post('/:id/evidence', upload.single('file'), ctrl.uploadEvidence);
router.delete('/:id/evidence/:evidenceId', requireRole('ADMIN', 'MANAGER'), ctrl.deleteEvidence);

module.exports = router;
