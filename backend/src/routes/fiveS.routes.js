const router = require('express').Router();
const ctrl = require('../controllers/fiveS.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getFiveS);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.createFiveS);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.updateFiveS);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteFiveS);

module.exports = router;
