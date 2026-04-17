const router = require('express').Router();
const { getKPIs, getChartData, getAlerts, markAlertRead } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/kpis', getKPIs);
router.get('/charts', getChartData);
router.get('/alerts', getAlerts);
router.patch('/alerts/:id/read', markAlertRead);

module.exports = router;
