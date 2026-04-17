const router = require('express').Router();
const ctrl = require('../controllers/cmsh.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/members', ctrl.getMembers);
router.post('/members', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createMember);
router.put('/members/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateMember);
router.delete('/members/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteMember);

router.get('/meetings', ctrl.getMeetings);
router.post('/meetings', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.createMeeting);
router.put('/meetings/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.updateMeeting);
router.delete('/meetings/:id', requireRole('ADMIN', 'SH_SPECIALIST'), ctrl.deleteMeeting);

module.exports = router;
