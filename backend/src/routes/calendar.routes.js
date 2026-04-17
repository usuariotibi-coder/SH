const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getCalendarEvents } = require('../controllers/calendar.controller');

router.get('/', authenticate, getCalendarEvents);

module.exports = router;
