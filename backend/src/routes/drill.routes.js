const router = require('express').Router();
const ctrl = require('../controllers/drill.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getDrills);
router.get('/:id', ctrl.getDrill);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createDrill);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateDrill);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteDrill);

module.exports = router;
