const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl      = require('../controllers/epp.controller');
const loansCtrl = require('../controllers/epp-loans.controller');

router.use(authenticate);

// Loan routes (before /:id to avoid conflicts)
router.get('/loans',              loansCtrl.getLoans);
router.post('/loans',             requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), loansCtrl.createLoan);
router.put('/loans/:id/return',   requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), loansCtrl.returnLoan);

// Matrix routes (before /:id to avoid conflicts)
router.get('/matrix', ctrl.getMatrix);
router.post('/matrix', requireRole('ADMIN', 'AREA_MANAGER'), ctrl.upsertMatrixEntry);
router.delete('/matrix/:entryId', requireRole('ADMIN', 'AREA_MANAGER'), ctrl.deleteMatrixEntry);

// Item routes
router.get('/', ctrl.getItems);
router.get('/:id', ctrl.getItem);
router.post('/', requireRole('ADMIN', 'AREA_MANAGER'), ctrl.createItem);
router.put('/:id', requireRole('ADMIN', 'AREA_MANAGER'), ctrl.updateItem);
router.delete('/:id', requireRole('ADMIN'), ctrl.deleteItem);

// Movement routes
router.post('/bulk-movements', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.bulkMovements);
router.post('/:id/movements', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.createMovement);

module.exports = router;
