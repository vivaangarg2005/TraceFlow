const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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

// Middleware: Parse JSON bodies (with beacon support for text/plain JSON strings)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Handle beacon text/plain payloads gracefully
app.use((req, res, next) => {
  if (req.is('text/plain') && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      // not JSON string, proceed as-is
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
  console.log(`🚀 TraceFlow Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Ingestion API: http://localhost:${PORT}/api/events`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
