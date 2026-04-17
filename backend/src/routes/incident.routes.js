const router = require('express').Router();
const ctrl = require('../controllers/incident.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getIncidents);
router.get('/:id', ctrl.getIncident);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.createIncident);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.updateIncident);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteIncident);

module.exports = router;
