const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getAudits);
router.get('/:id', ctrl.getAudit);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST', 'AUDITOR'), ctrl.createAudit);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST', 'AUDITOR'), ctrl.updateAudit);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteAudit);

module.exports = router;
