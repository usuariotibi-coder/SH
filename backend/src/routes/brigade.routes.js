const router = require('express').Router();
const ctrl = require('../controllers/brigade.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getBrigades);
router.get('/:type', ctrl.getBrigade);
router.put('/:type', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateBrigade);
router.post('/:type/members', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.addMember);
router.put('/:type/members/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateMember);
router.delete('/:type/members/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteMember);

module.exports = router;
