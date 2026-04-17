const router = require('express').Router();
const ctrl = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getMaintenances);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createMaintenance);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateMaintenance);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteMaintenance);

module.exports = router;
