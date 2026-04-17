const router = require('express').Router();
const { getCompanies, getCompany, createCompany, updateCompany, deleteCompany } = require('../controllers/company.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', requireRole('ADMIN'), getCompanies);
router.get('/:id', getCompany);
router.post('/', requireRole('ADMIN'), createCompany);
router.put('/:id', requireRole('ADMIN'), updateCompany);
router.delete('/:id', requireRole('ADMIN'), deleteCompany);

module.exports = router;
