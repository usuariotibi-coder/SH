const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/epp.controller');

router.use(authenticate);

// Matrix routes (before /:id to avoid conflicts)
router.get('/matrix', ctrl.getMatrix);
router.post('/matrix', requireRole('ADMIN', 'MANAGER'), ctrl.upsertMatrixEntry);
router.delete('/matrix/:entryId', requireRole('ADMIN', 'MANAGER'), ctrl.deleteMatrixEntry);

// Item routes
router.get('/', ctrl.getItems);
router.get('/:id', ctrl.getItem);
router.post('/', requireRole('ADMIN', 'MANAGER'), ctrl.createItem);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), ctrl.updateItem);
router.delete('/:id', requireRole('ADMIN'), ctrl.deleteItem);

// Movement routes
router.post('/bulk-movements', ctrl.bulkMovements);
router.post('/:id/movements', ctrl.createMovement);

module.exports = router;
