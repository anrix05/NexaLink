/**
 * AlumniConnect REST API Server
 * Vidyalankar Institute of Technology, Mumbai (SIH25017)
 */

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database/db');

const authRoutes = require('./routes/authRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const jobRoutes = require('./routes/jobRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initializeDatabase();

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'AlumniConnect (VIT Wadala)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] AlumniConnect REST API Server listening on port ${PORT}`);
  });
}

module.exports = app;
