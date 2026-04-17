const router = require('express').Router();
const ctrl = require('../controllers/risk.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getRisks);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createRisk);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateRisk);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteRisk);

module.exports = router;
