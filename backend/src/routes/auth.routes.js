const router = require('express').Router();
const { login, me, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Demasiados intentos de login, espera 15 minutos', code: 'RATE_LIMIT' },
});

router.post('/login', loginLimiter, login);
router.post('/logout', (req, res) => res.json({ message: 'Logout exitoso' }));
router.get('/me', authenticate, me);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
