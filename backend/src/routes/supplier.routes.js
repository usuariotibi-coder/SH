const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/supplier.controller');

router.use(authenticate);

router.get('/', ctrl.getSuppliers);
router.get('/:id', ctrl.getSupplier);
router.post('/', requireRole('ADMIN', 'MANAGER'), ctrl.createSupplier);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), ctrl.updateSupplier);
router.delete('/:id', requireRole('ADMIN'), ctrl.deleteSupplier);

// Access token management
router.post('/:id/token', requireRole('ADMIN', 'MANAGER'), ctrl.generateToken);
router.delete('/:id/token', requireRole('ADMIN', 'MANAGER'), ctrl.revokeToken);

// Document review
router.put('/documents/:docId/review', requireRole('ADMIN', 'MANAGER'), ctrl.reviewDocument);

module.exports = router;
