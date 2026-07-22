require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/companies', require('./routes/company.routes'));
app.use('/api/requirements', require('./routes/requirement.routes'));
app.use('/api/incidents', require('./routes/incident.routes'));
app.use('/api/cmsh', require('./routes/cmsh.routes'));
app.use('/api/trainings', require('./routes/training.routes'));
app.use('/api/drills', require('./routes/drill.routes'));
app.use('/api/fives', require('./routes/fiveS.routes'));
app.use('/api/maintenance', require('./routes/maintenance.routes'));
app.use('/api/risks', require('./routes/risk.routes'));
app.use('/api/audits', require('./routes/audit.routes'));
app.use('/api/program', require('./routes/program.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/calendar', require('./routes/calendar.routes'));
app.use('/api/brigades', require('./routes/brigade.routes'));
app.use('/api/suppliers', require('./routes/supplier.routes'));
app.use('/api/epp', require('./routes/epp.routes'));
app.use('/api/portal', require('./routes/portal.routes'));

// Error handler
app.use(errorHandler);

module.exports = app;
