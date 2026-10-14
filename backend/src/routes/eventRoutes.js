const express = require('express');
const router = express.Router();
const {
  trackEvents,
  getSessions,
  getSessionEvents,
  getPageClicks,
  getTrackedPages,
  getOverview,
  resetClicks,
} = require('../controllers/eventController');

// 1. Ingestion endpoint: track page_view and click events
router.post('/events', trackEvents);

// 2. Sessions listing with event counts and duration
router.get('/sessions', getSessions);

// 3. User Journey for a specific session (chronological event stream)
router.get('/sessions/:sessionId/events', getSessionEvents);

// 4. Click heatmap coordinates for a given page URL
router.get('/analytics/clicks', getPageClicks);

// 5. Distinct tracked pages list (for dropdown selection in Heatmap view)
router.get('/analytics/pages', getTrackedPages);

// 6. High-level summary metrics (Total sessions, events, pageviews, clicks)
router.get('/analytics/overview', getOverview);

// 7. Reset / Delete clicks or all events
router.delete('/analytics/clicks', resetClicks);

module.exports = router;
