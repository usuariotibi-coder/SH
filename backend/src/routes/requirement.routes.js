const router = require('express').Router();
const ctrl = require('../controllers/requirement.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');
const { uploadEvidence, deleteEvidence } = require('../controllers/evidence.controller');

router.use(authenticate);

router.get('/', ctrl.getRequirements);
router.get('/:id', ctrl.getRequirement);
router.post('/', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createRequirement);
router.put('/:id', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.updateRequirement);
router.delete('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteRequirement);
router.patch('/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.patchRequirement);

// Activities
router.post('/:requirementId/activities', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.createActivity);
router.put('/:requirementId/activities/:activityId', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.updateActivity);
router.delete('/:requirementId/activities/:activityId', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), ctrl.deleteActivity);

// Evidences
router.post('/evidences/upload', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), upload.single('file'), uploadEvidence);
router.delete('/evidences/:id', requireRole('ADMIN', 'SH_SPECIALIST'), deleteEvidence);

module.exports = router;
