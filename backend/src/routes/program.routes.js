const router = require('express').Router();
const { getProgram, upsertProgram } = require('../controllers/program.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', getProgram);
router.put('/', requireRole('ADMIN', 'SH_SPECIALIST'), upsertProgram);

module.exports = router;
