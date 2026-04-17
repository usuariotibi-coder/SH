const router = require('express').Router();
const ctrl = require('../controllers/training.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.getTrainings);
router.get('/:id', ctrl.getTraining);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createTraining);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateTraining);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteTraining);

module.exports = router;
