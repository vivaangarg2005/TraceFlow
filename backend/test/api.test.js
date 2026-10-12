const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/traceflow_test';

const app = require('../src/server');
const Event = require('../src/models/Event');

let server;
const BASE_URL = 'http://localhost:5001';

before(async () => {
  // Clear any existing test data
  if (mongoose.connection.readyState === 1) {
    await Event.deleteMany({});
  }
});

after(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await Event.deleteMany({});
      await mongoose.connection.close();
    }
  } catch (err) {}

  if (app.server) {
    await new Promise((resolve) => app.server.close(resolve));
  }
});

test('1. Health Check Endpoint returns healthy status', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'healthy');
});

test('2. Serve tracking script at /tracker.js', async () => {
  const res = await fetch(`${BASE_URL}/tracker.js`);
  assert.strictEqual(res.status, 200);
  const text = await res.text();
  assert.match(text, /TraceFlow/);
});

test('3. Ingest single page_view event (POST /api/events)', async () => {
  const payload = {
    sessionId: 'test_session_100',
    eventType: 'page_view',
    url: 'http://localhost:3000/index.html',
    title: 'Aura Store | Home',
    timestamp: new Date().toISOString(),
    viewportWidth: 1920,
    viewportHeight: 1080,
  };

  const res = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.count, 1);
});

test('4. Ingest batch of click events (POST /api/events)', async () => {
  const payload = [
    {
      sessionId: 'test_session_100',
      eventType: 'click',
      url: 'http://localhost:3000/index.html',
      timestamp: new Date().toISOString(),
      x: 350,
      y: 220,
      viewportWidth: 1920,
      viewportHeight: 1080,
      elementTag: 'BUTTON',
      elementId: 'hero-cta-shop-now',
      elementText: 'Explore Collection',
    },
    {
      sessionId: 'test_session_100',
      eventType: 'click',
      url: 'http://localhost:3000/index.html',
      timestamp: new Date().toISOString(),
      x: 480,
      y: 520,
      viewportWidth: 1920,
      viewportHeight: 1080,
      elementTag: 'BUTTON',
      elementId: 'btn-cart-runner',
      elementText: 'Add to Cart',
    },
    {
      sessionId: 'test_session_200',
      eventType: 'page_view',
      url: 'http://localhost:3000/product.html',
      title: 'Product Details',
      timestamp: new Date().toISOString(),
    },
    {
      sessionId: 'test_session_200',
      eventType: 'click',
      url: 'http://localhost:3000/product.html',
      x: 600,
      y: 400,
      viewportWidth: 1920,
      viewportHeight: 1080,
      elementTag: 'BUTTON',
      elementId: 'btn-buy-now',
      elementText: 'Buy Now',
    },
  ];

  const res = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.count, 4);
});

test('5. Reject invalid event without sessionId or missing click coordinates', async () => {
  // Missing sessionId
  const res1 = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: 'page_view', url: 'http://localhost:3000/' }),
  });
  assert.strictEqual(res1.status, 400);

  // Click event missing x/y
  const res2 = await fetch(`${BASE_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 's1', eventType: 'click', url: 'http://localhost:3000/' }),
  });
  assert.strictEqual(res2.status, 400);
});

test('6. Fetch list of sessions with event counts (GET /api/sessions)', async () => {
  const res = await fetch(`${BASE_URL}/api/sessions`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length >= 2, 'Should return at least 2 sessions');

  const s100 = data.data.find((s) => s.sessionId === 'test_session_100');
  assert.ok(s100, 'Session test_session_100 should be present');
  assert.strictEqual(s100.totalEvents, 3);
  assert.strictEqual(s100.pageViews, 1);
  assert.strictEqual(s100.clicks, 2);
});

test('7. Fetch user journey for a specific session (GET /api/sessions/:sessionId/events)', async () => {
  const res = await fetch(`${BASE_URL}/api/sessions/test_session_100/events`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.sessionId, 'test_session_100');
  assert.strictEqual(data.data.length, 3);
  assert.strictEqual(data.summary.totalEvents, 3);
  assert.strictEqual(data.summary.pageViews, 1);
  assert.strictEqual(data.summary.clicks, 2);
});

test('8. Fetch click heatmap data for a page (GET /api/analytics/clicks)', async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/clicks?url=http://localhost:3000/index.html`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.totalClicks, 2);
  assert.ok(data.data[0].x !== undefined);
  assert.ok(data.data[0].y !== undefined);
  assert.ok(data.data[0].xPercent !== undefined);
});

test('9. Fetch distinct tracked pages (GET /api/analytics/pages)', async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/pages`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length >= 2);
});

test('10. Fetch overview metrics (GET /api/analytics/overview)', async () => {
  const res = await fetch(`${BASE_URL}/api/analytics/overview`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.totalSessions, 2);
  assert.strictEqual(data.data.totalEvents, 5);
  assert.strictEqual(data.data.totalPageViews, 2);
  assert.strictEqual(data.data.totalClicks, 3);
});
