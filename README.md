# 🚀 TraceFlow Analytics

> **User Interaction Tracking & Behavioral Analytics Platform**  
> Built for the **CausalFunnel Full Stack Engineer** evaluation by **Vivaan Garg**.

[![Tests](https://img.shields.io/badge/tests-10%2F10%20passing-success?style=flat-square)](https://github.com/vivaangarg2005/TraceFlow)
[![Node.js](https://img.shields.io/badge/node.js-v18%2B-blue?style=flat-square)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-v19-61dafb?style=flat-square)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/mongodb-v7-green?style=flat-square)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)

---

## 📌 Executive Summary

**TraceFlow** is a full-stack, end-to-end user analytics application inspired by modern e-commerce behavioral analytics engines. It captures user journeys across storefronts, tracks pageviews and click coordinates, aggregates sessions, and provides visual session replay and click heatmaps.

### Key Capabilities:
- **Zero-Dependency Tracking Script (`tracker.js`)**: Captures `page_view` and `click` interactions with precise coordinates (`x`, `y`), responsive percentage normalization (`xPercent`, `yPercent`), and clicked DOM context (`<BUTTON>`, text, ID).
- **Resilient Transmission**: Dispatches events asynchronously via `navigator.sendBeacon` with `fetch({ keepalive: true })` fallback to eliminate interaction latency and prevent data loss during page unload.
- **High-Performance Node.js / Express Backend**: Bulk ingestion, session aggregation pipelines, and compound-indexed queries.
- **MongoDB Data Layer**: Schema optimized for time-series analytics, chronological user journeys, and spatial click density.
- **Modern React Analytics Dashboard**: 
  - **Sessions View**: Filterable session list with event counts, duration, and full chronological **User Journey Timeline** with coordinate tags.
  - **Heatmap View**: Visual click density viewer supporting **Radial Glow Heatmap**, **10×10 Density Grid**, and **Precision Element Pins** with hover tooltips and store wireframe overlay.
- **Interactive E-Commerce Demo Store**: A multi-page store (*Aura Wear*) to test real-world funnel tracking (`/index.html` → `/product.html` → `/checkout.html`).

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│                                                             │
│   🛒 Demo E-Commerce Store (Port 3000)                      │
│   ├── index.html (Catalog, Banner, Cart)                    │
│   ├── product.html (Product Details & Sizing)               │
│   └── checkout.html (Order Confirmation)                    │
│             │                                               │
│             ▼                                               │
│   ⚡ Client Tracker (tracker.js)                            │
│   • Auto-generates UUID session & 30-min inactivity timeout │
│   • Intercepts clicks & SPA route changes                   │
│   • Calculates (x, y) & responsive (x%, y%) coordinates     │
│   • Dispatches via navigator.sendBeacon                     │
└─────────────────────────────┬───────────────────────────────┘
                              │ POST /api/events
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND TIER                          │
│                                                             │
│   🚀 Express API Server (Port 5000)                         │
│   ├── POST /api/events                 (Ingestion)          │
│   ├── GET  /api/sessions               (Sessions & Counts)  │
│   ├── GET  /api/sessions/:id/events    (User Journey)       │
│   ├── GET  /api/analytics/clicks       (Heatmap Clicks)     │
│   ├── GET  /api/analytics/pages        (Tracked URLs)       │
│   ├── GET  /api/analytics/overview     (KPI Metrics)        │
│   └── GET  /tracker.js                 (Script Serving)     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE TIER                          │
│                                                             │
│   🍃 MongoDB (Port 27017)                                   │
│   • Event Collection with Compound Indexes:                 │
│     - { sessionId: 1, timestamp: 1 }                        │
│     - { url: 1, eventType: 1 }                              │
│     - { path: 1, eventType: 1 }                             │
└─────────────────────────────▲───────────────────────────────┘
                              │ Queries & Aggregations
┌─────────────────────────────┴───────────────────────────────┐
│                      DASHBOARD TIER                         │
│                                                             │
│   📊 TraceFlow Analytics Dashboard (Port 5173)              │
│   ├── 👥 Sessions View & Interactive Journey Replayer       │
│   ├── 🔥 Multi-Mode Heatmap (Glow / Grid / Pins)            │
│   └── 📈 High-Level Metrics & Top Elements Breakdown       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Client Tracker** | Vanilla JavaScript (ES5/ES6) | Zero dependencies (<4 KB), maximum compatibility across third-party websites without library conflicts. |
| **Backend** | Node.js, Express 4.x | Fast, non-blocking I/O ideal for event ingestion streaming and aggregation pipelines. |
| **Database** | MongoDB 7, Mongoose 8.x | Document model fits heterogeneous interaction payloads (clicks have coordinates and DOM elements, pageviews have referrers and titles). |
| **Frontend** | React 19, Vite | Lightning-fast HMR, component modularity, high-frequency dashboard re-rendering. |
| **Styling** | Vanilla CSS Design System | Custom glassmorphism, responsive grid layouts, custom scrollbars, and high-contrast dark theme without heavy CSS framework overhead. |
| **Containerization** | Docker & Docker Compose | Single-command reproducible database spin-up. |
| **Testing** | Native Node.js Test Runner (`node:test`, `node:assert`) | Zero external test dependencies, native speed, 10/10 automated tests passing. |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (Local service or Docker container or MongoDB Atlas cluster)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/vivaangarg2005/TraceFlow.git
cd TraceFlow
```

---

### Step 2: Start MongoDB

#### Option A: Using Docker (Recommended)
```bash
docker compose up -d
```
*Starts MongoDB 7 on `localhost:27017` with persistent volume storage.*

#### Option B: Using MongoDB Atlas
Create a `.env` file in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```
Update `MONGODB_URI` with your connection string:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/traceflow?retryWrites=true&w=majority
```

---

### Step 3: Install Dependencies

```bash
# Install root, backend, and frontend packages
npm run install:all
```
*(Or run `npm install` inside `backend/` and `frontend/`)*

---

### Step 4: Run the Application

You can start the services concurrently in separate terminals:

```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: React Analytics Dashboard (Port 5173)
npm run dev:frontend

# Terminal 3: Interactive Demo E-Commerce Store (Port 3000)
npm run dev:demo
```

---

### Step 5: Explore the Application

| Service | URL | Description |
|---|---|---|
| **📊 TraceFlow Dashboard** | [http://localhost:5173](http://localhost:5173) | Sessions view, user journey modal, click heatmaps. |
| **🛍️ Demo E-Commerce Store** | [http://localhost:3000](http://localhost:3000) | Test store with real-time tracking HUD. |
| **⚡ Backend Healthcheck** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | API status & server uptime. |
| **📦 Client Tracking Script** | [http://localhost:5000/tracker.js](http://localhost:5000/tracker.js) | Embeddable tracker script. |

---

## 🧪 Automated Testing

TraceFlow includes an integration test suite testing all API endpoints, edge cases, input validation, and database aggregations:

```bash
npm test
```

### Test Suite Output:
```text
✔ 1. Health Check Endpoint returns healthy status (86ms)
✔ 2. Serve tracking script at /tracker.js (24ms)
✔ 3. Ingest single page_view event (POST /api/events) (81ms)
✔ 4. Ingest batch of click events (POST /api/events) (47ms)
✔ 5. Reject invalid event without sessionId or missing click coordinates (20ms)
✔ 6. Fetch list of sessions with event counts (GET /api/sessions) (16ms)
✔ 7. Fetch user journey for a specific session (GET /api/sessions/:sessionId/events) (23ms)
✔ 8. Fetch click heatmap data for a page (GET /api/analytics/clicks) (19ms)
✔ 9. Fetch distinct tracked pages (GET /api/analytics/pages) (11ms)
✔ 10. Fetch overview metrics (GET /api/analytics/overview) (26ms)

ℹ pass 10 | fail 0 | duration_ms 1146ms
```

---

## 📡 API Reference

### 1. Ingest Events
- **Endpoint**: `POST /api/events`
- **Description**: Ingests single or batched user events.
- **Payload Example**:
```json
[
  {
    "sessionId": "tf_c8a7b1f2-9382-421d-91b4",
    "eventType": "page_view",
    "url": "http://localhost:3000/index.html",
    "title": "Aura Store | Home",
    "timestamp": "2026-10-12T14:00:00.000Z",
    "viewportWidth": 1440,
    "viewportHeight": 900
  },
  {
    "sessionId": "tf_c8a7b1f2-9382-421d-91b4",
    "eventType": "click",
    "url": "http://localhost:3000/index.html",
    "timestamp": "2026-10-12T14:00:02.500Z",
    "x": 480,
    "y": 620,
    "xPercent": 33.33,
    "yPercent": 68.89,
    "elementTag": "BUTTON",
    "elementId": "btn-cart-runner",
    "elementText": "Add to Cart"
  }
]
```

### 2. Fetch Sessions List
- **Endpoint**: `GET /api/sessions?page=1&limit=50`
- **Description**: Returns paginated sessions with total events, pageviews, clicks, and session duration.

### 3. Fetch User Journey
- **Endpoint**: `GET /api/sessions/:sessionId/events`
- **Description**: Returns all chronological events for a specific session.

### 4. Fetch Page Click Coordinates (Heatmap)
- **Endpoint**: `GET /api/analytics/clicks?url=...`
- **Description**: Returns all click points `(x, y, xPercent, yPercent, elementTag, elementText)` for heatmap rendering.

### 5. Fetch Tracked Pages
- **Endpoint**: `GET /api/analytics/pages`
- **Description**: Lists distinct tracked page URLs with total views and click counts for heatmap dropdown selection.

---

## ⚖️ Assumptions & Engineering Trade-offs

1. **Session Lifecycle & Inactivity Timeout**:
   - *Design*: The tracker stores `session_id` in `localStorage` (with cookie fallback) accompanied by an expiry timestamp. An inactivity window of **30 minutes** is enforced (matching Google Analytics standard). If a user returns after 30 minutes of inactivity, a new session is created.
   - *Trade-off*: Client-managed sessions remove the need for session state overhead on the backend while allowing offline event queueing.

2. **Responsive Heatmap Coordinate Normalization**:
   - *Challenge*: Raw pixel coordinates `(x, y)` vary drastically between a 13" laptop (`1280px` wide) and a 4K display (`3840px` wide), distorting heatmaps.
   - *Solution*: The tracker records both absolute pixel values `(x, y)` and viewport percentages `(xPercent, yPercent = (x / viewportWidth) * 100)`. The dashboard heatmap visualizer scales with percentage positioning, remaining responsive on all screen sizes.

3. **Reliability on Page Exit (`navigator.sendBeacon`)**:
   - *Challenge*: Standard `fetch()` or `XMLHttpRequest` calls on page unload are frequently cancelled by the browser before completing.
   - *Solution*: The tracker leverages `navigator.sendBeacon` for non-blocking dispatch during `beforeunload`/`pagehide`, with `fetch(..., { keepalive: true })` as fallback.

4. **Database Query Performance**:
   - *Design*: Instead of fetching all events and calculating session counts in memory, MongoDB Aggregation Pipelines (`$group`, `$min`, `$max`, `$facet`) are used. Compound indexes (`{ sessionId: 1, timestamp: 1 }` and `{ url: 1, eventType: 1 }`) ensure queries execute with sub-20ms latency.

5. **Event Debounce / Queueing**:
   - *Design*: To prevent overwhelming network sockets during rapid clicking or mouse movements, events are enqueued in client memory and flushed every 1.5 seconds, or immediately once the queue reaches 5 events.

---

## 👨‍💻 Author

- **Vivaan Garg**
- Repository: [github.com/vivaangarg2005/TraceFlow](https://github.com/vivaangarg2005/TraceFlow)
