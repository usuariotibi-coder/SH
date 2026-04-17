const router = require('express').Router();
const { getUsers, createUser, updateUser, toggleUser, deleteUser, getSelectUsers } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

// Endpoint accesible para roles con permiso de edición (para selector de responsable)
router.get('/select', requireRole('ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER'), getSelectUsers);

// Resto de rutas solo ADMIN
router.use(requireRole('ADMIN'));
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle', toggleUser);
router.delete('/:id', deleteUser);

module.exports = router;
