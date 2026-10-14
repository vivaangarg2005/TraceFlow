const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const eventRoutes = require('./routes/eventRoutes');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware: Enable CORS
// Analytics ingestion scripts run on external sites, so we allow flexible CORS for tracking
app.use(
  cors({
    origin: '*', // Allow demo store, frontend dashboard, and any embedded client
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Middleware: Parse JSON & Beacon text/plain bodies
app.use(express.json({ limit: '2mb' }));
app.use(express.text({ type: '*/*', limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Handle beacon text/plain JSON strings gracefully
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    const trimmed = req.body.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        req.body = JSON.parse(trimmed);
      } catch (e) {
        console.error('Failed to parse beacon JSON string:', e.message);
      }
    }
  }
  next();
});

// Lightweight request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TraceFlow Analytics Backend',
  });
});

// Serve client tracking script for external sites embedding
app.get(['/tracker.js', '/tracker/tracker.js'], (req, res) => {
  const fs = require('fs');
  const localTracker = path.resolve(__dirname, '../public/tracker.js');
  const rootTracker = path.resolve(__dirname, '../../tracker/tracker.js');
  if (fs.existsSync(localTracker)) {
    return res.sendFile(localTracker);
  }
  if (fs.existsSync(rootTracker)) {
    return res.sendFile(rootTracker);
  }
  res.status(404).send('Tracker script not found');
});

// Mount Analytics & Session Routes
app.use('/api', eventRoutes);

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`🚀 TraceFlow Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Ingestion API: http://localhost:${PORT}/api/events`);
  }
});

app.server = server;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
