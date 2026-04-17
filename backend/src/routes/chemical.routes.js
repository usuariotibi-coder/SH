const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');
const ctrl = require('../controllers/chemical.controller');

router.use(authenticate);

router.get('/', ctrl.getProducts);
router.get('/:id', ctrl.getProduct);
router.post('/', requireRole('ADMIN', 'MANAGER'), ctrl.createProduct);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), ctrl.updateProduct);
router.delete('/:id', requireRole('ADMIN'), ctrl.deleteProduct);

// File upload/delete
router.post('/:id/files', upload.single('file'), ctrl.uploadFile);
router.delete('/:id/files/:fileType', requireRole('ADMIN', 'MANAGER'), ctrl.deleteFile);

module.exports = router;
