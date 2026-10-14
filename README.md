# 🚀 TraceFlow Analytics

<p align="center">
  <strong>High-Precision Behavioral Telemetry, Session Reconstruction & Real-Time Click Heatmaps</strong>
</p>

<p align="center">
  <a href="https://trace-flow-self.vercel.app/"><img src="https://img.shields.io/badge/Live%20Dashboard-Vercel-6366f1?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Dashboard on Vercel" /></a>
  <a href="https://trace-flow-self.vercel.app/demo/index.html"><img src="https://img.shields.io/badge/Demo%20Storefront-Aura%20Wear-10b981?style=for-the-badge&logo=shopify&logoColor=white" alt="Live Demo Storefront" /></a>
  <a href="https://traceflow-backend-gbi3.onrender.com/api/health"><img src="https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Backend API on Render" /></a>
  <img src="https://img.shields.io/badge/Tests-13%2F13%20Passing-22c55e?style=for-the-badge&logo=jest&logoColor=white" alt="Tests 13/13 Passing" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas Cloud" />
 
</p>

<p align="center">
  🔗 <strong>Direct Links:</strong>
  <a href="https://trace-flow-self.vercel.app/"><strong>Explore Live Dashboard ↗</strong></a> •
  <a href="https://trace-flow-self.vercel.app/demo/index.html"><strong>Visit Live Demo Store ↗</strong></a> •
  <a href="https://traceflow-backend-gbi3.onrender.com/api/health"><strong>API Health Status ↗</strong></a> •
  <a href="https://github.com/vivaangarg2005/TraceFlow"><strong>GitHub Repository ↗</strong></a>
</p>

---

## 📋 Executive Summary & Technical Architecture

**TraceFlow Analytics** is an open-source, full-stack behavioral telemetry and session intelligence platform designed for modern e-commerce storefronts. It captures high-fidelity user interaction telemetry without performance overhead, reconstructs chronological visitor journeys, and projects spatial click hotspots onto responsive webpage previews.

### 🌐 Live Cloud Deployment & Endpoints

| Resource                  | Live Cloud URL (Production)                                                                              | Local Development Address          | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| **Analytics Dashboard**   | [trace-flow-self.vercel.app](https://trace-flow-self.vercel.app/)                                        | `http://localhost:5173`            | React 19 analytics dashboard featuring real-time heatmaps & session replay |
| **Aura Demo Storefront**  | [trace-flow-self.vercel.app/demo/index.html](https://trace-flow-self.vercel.app/demo/index.html)         | `http://localhost:3000`            | Luxury test e-commerce storefront instrumented with `tracker.js`           |
| **Backend Ingestion API** | [traceflow-backend-gbi3.onrender.com](https://traceflow-backend-gbi3.onrender.com/api/events)            | `http://localhost:5000/api/events` | High-throughput Node.js Express telemetry ingestion & analytics API        |
| **API Health Status**     | [traceflow-backend-gbi3.onrender.com/api/health](https://traceflow-backend-gbi3.onrender.com/api/health) | `http://localhost:5000/api/health` | Live system diagnostics & MongoDB Atlas connection status check            |
| **Tracking Script SDK**   | [traceflow-backend-gbi3.onrender.com/tracker.js](https://traceflow-backend-gbi3.onrender.com/tracker.js) | `http://localhost:5000/tracker.js` | Embeddable, zero-dependency client tracking script (< 4KB)                 |

---

### 🎯 Core Capabilities & Technical Specification Matrix

| Feature & Specification            | TraceFlow Implementation                                                                                                     | Key Source Files                                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Client-Side Tracking Script** | Standalone zero-dependency vanilla JS tracker (`tracker.js`), embeddable via a single `<script>` tag.                        | [`backend/public/tracker.js`](backend/public/tracker.js)                                                                                                               |
| • `page_view` and `click` Events   | Automatically tracks pageviews on load, plus captures element tag, text, and click coordinates.                              | [`backend/public/tracker.js`](backend/public/tracker.js#L140-L210)                                                                                                     |
| • `session_id` Persistence         | Generated UUID-like session tokens stored in `localStorage` with fallback cookie & 30-min rolling expiration.                | [`backend/public/tracker.js`](backend/public/tracker.js#L40-L75)                                                                                                       |
| • Asynchronous Event Dispatch      | Priority event dispatch via `navigator.sendBeacon` with `fetch(..., { keepalive: true })` fallback and intelligent batching. | [`backend/public/tracker.js`](backend/public/tracker.js#L85-L135)                                                                                                      |
| • Demo Webpage                     | Multi-page modern luxury storefront (**Aura Wear**) with Home, Catalog, Product details, Cart, and Checkout flows.           | [`demo/index.html`](demo/index.html), [`demo/product.html`](demo/product.html), [`demo/checkout.html`](demo/checkout.html)                                             |
| **2. Backend API (Node.js)**       | High-throughput Express REST API with rigorous input validation and MongoDB aggregations.                                    | [`backend/src/server.js`](backend/src/server.js), [`backend/src/routes/eventRoutes.js`](backend/src/routes/eventRoutes.js)                                             |
| • Receive & Store Events           | `POST /api/events` supports single-event payloads and batch event ingestion with schema validation.                          | [`backend/src/controllers/eventController.js`](backend/src/controllers/eventController.js)                                                                             |
| • List Sessions + Event Counts     | `GET /api/sessions` returns paginated session summaries, entry/exit paths, duration, and device metadata.                    | [`backend/src/controllers/eventController.js`](backend/src/controllers/eventController.js)                                                                             |
| • Session Event Journey            | `GET /api/sessions/:sessionId/events` returns ordered chronological user journey with event details.                         | [`backend/src/controllers/eventController.js`](backend/src/controllers/eventController.js)                                                                             |
| • Page Click Data for Heatmaps     | `GET /api/analytics/clicks` returns raw & normalized `(xPercent, yPercent)` coordinates, sections, and DOM selectors.        | [`backend/src/controllers/eventController.js`](backend/src/controllers/eventController.js)                                                                             |
| **3. Database (MongoDB)**          | Indexed MongoDB collection designed for sub-100ms analytics queries and aggregation pipelines.                               | [`backend/src/models/Event.js`](backend/src/models/Event.js)                                                                                                           |
| **4. Frontend Dashboard (React)**  | React 19 + Vite dashboard featuring real-time heatmaps, multi-device previews, and interactive session replays.              | [`frontend/src/App.jsx`](frontend/src/App.jsx)                                                                                                                         |
| • Sessions View                    | Interactive session list with search, sorting, time range filters, and a slide-over User Journey modal.                      | [`frontend/src/components/SessionsView.jsx`](frontend/src/components/SessionsView.jsx)                                                                                 |
| • Heatmap View                     | Page URL selector, multi-device viewports (Desktop/Tablet/Mobile), thermal glow shader, 10×10 density grid, and pins.        | [`frontend/src/components/HeatmapView.jsx`](frontend/src/components/HeatmapView.jsx)                                                                                   |
| • Real-Time Live Streaming         | 2.5s live polling stream with visual click pulses that light up whenever a shopper clicks on the store.                      | [`frontend/src/components/HeatmapView.jsx`](frontend/src/components/HeatmapView.jsx)                                                                                   |
| • Instant Data Reset               | `DELETE /api/analytics/clicks` endpoint and 1-click `🗑️ Reset Data` button in dashboard for clean testing.                   | [`backend/src/controllers/eventController.js`](backend/src/controllers/eventController.js), [`frontend/src/components/Header.jsx`](frontend/src/components/Header.jsx) |

---

## 📑 Table of Contents

1. [System Architecture](#-system-architecture)
2. [Technology Stack](#-technology-stack)
3. [Live Cloud Demo vs. Local Setup](#-quick-start--setup-instructions)
4. [Application Services & URLs](#-application-services--urls)
5. [End-to-End Walkthrough Guide](#-how-to-test--use-the-platform-walkthrough)
6. [In-Depth Feature Tour](#-in-depth-feature-tour)
7. [REST API Documentation](#-api-documentation)
8. [Database Schema & Aggregation Pipeline](#-database-schema--aggregation-pipeline)
9. [Automated Test Suite (13/13 Passing)](#-automated-test-suite-1313-passing)
10. [Engineering Decisions & Edge Cases](#-assumptions-edge-cases--engineering-trade-offs)
11. [Repository Structure](#-folder-structure)
12. [Author](#-author)

---

## 🏗️ System Architecture

TraceFlow utilizes a decoupled 4-tier architecture designed for separation of concerns, high throughput, and zero-latency client tracking:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│                                                                        │
│   Aura Wear Storefront (Cloud: /demo | Local: Port 3000)               │
│   ├── index.html (Hero, Product Grid, Categories)                      │
│   ├── product.html?id=watch | tee | runner | pack (Dynamic Catalog)    │
│   └── checkout.html (Multi-step Order Checkout)                        │
│                 │                                                      │
│                 ▼                                                      │
│   tracker.js (Embedded SDK)                                            │
│   ├── Auto-captures page_view & click events                           │
│   ├── Session Token Generator (UUID + 30-min inactivity timeout)       │
│   ├── Dual Coordinate Resolution (Absolute PX & Normalized %)          │
│   ├── PII / Sensitive Text Scrubbing                                   │
│   └── Buffered Transmission (Beacon API + fetch keepalive fallback)    │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ POST /api/events (Single or Batch)
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API                                  │
│                                                                        │
│   Node.js 18+ & Express 4 (Cloud: Render | Local: Port 5000)           │
│   ├── Input Validation & Sanitization Middleware                       │
│   ├── Session Aggregation Pipelines ($group, $facet, $sort)            │
│   ├── Spatial Click Filtering (Device, URL, Date Range)                │
│   ├── Static Asset Delivery (Serves tracker.js)                        │
│   └── Data Management Endpoints (DELETE /api/analytics/clicks)         │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ Read / Write Operations
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE TIER                               │
│                                                                        │
│   MongoDB 7 (Atlas Cloud Cluster or Local Port 27017)                  │
│   ├── Collection: 'events'                                             │
│   ├── Compound Index: { sessionId: 1, timestamp: 1 }                   │
│   ├── Compound Index: { url: 1, eventType: 1 }                         │
│   └── Compound Index: { path: 1, eventType: 1 }                        │
└─────────────────────────────────▲──────────────────────────────────────┘
                                  │ Aggregated Metrics & Event Streams
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS DASHBOARD                             │
│                                                                        │
│   React 19 + Vite (Cloud: Vercel | Local: Port 5173)                   │
│   ├── Executive KPI Overview Cards                                     │
│   ├── Perspective Switcher: "Store Owner" vs "Technical Developer"     │
│   ├── Session Explorer with Chronological Journey Drawer               │
│   ├── Real-Time Spatial Heatmap Visualizer (Canvas Shader + Iframe)    │
│   │   ├── Modes: Thermal Glow | 10×10 Density Grid | Pin Hotspots      │
│   │   ├── Multi-Device Ratios: Desktop (1280×800), Tablet, Mobile      │
│   │   └── Real-time WebSocket-like Auto-Sync (2.5s Polling)            │
│   └── 1-Click "⚡ Simulate Shopper" & "🗑️ Reset Data" Controls        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer                  | Technology                                       | Rationale & Selection Criteria                                                                                  |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Client Tracker**     | Vanilla JavaScript (ES6+)                        | 0 dependencies, < 4KB minified, maximum browser compatibility, never interferes with host site execution.       |
| **API Runtime**        | Node.js 18+ & Express 4                          | Non-blocking event loop ideal for asynchronous telemetry ingestion and JSON API serving.                        |
| **Database**           | MongoDB (Atlas / 7.0)                            | Flexible schema accommodating polymorphic events (`page_view` vs `click`), native geospatial-style aggregation. |
| **ODM**                | Mongoose 8.x                                     | Strict schema enforcement, compound indexing, query population, and life-cycle validation.                      |
| **Frontend Framework** | React 19                                         | Fast concurrent rendering, composable UI components, declarative state management.                              |
| **Build Tool**         | Vite 8                                           | Instant Hot Module Replacement (HMR) and optimized production bundles.                                          |
| **Styling**            | Vanilla CSS (Modern CSS3)                        | Glassmorphism, HSL color tokens, CSS Grid, aspect-ratio containers without runtime CSS-in-JS overhead.          |
| **Cloud Hosting**      | Vercel (Frontend) & Render (Backend)             | Auto-deploying CI/CD pipelines with high availability and global CDN delivery.                                  |
| **Test Runner**        | Node.js Native Test (`node:test`, `node:assert`) | Zero external test dependencies, native execution, high speed.                                                  |

---

## 🚀 Quick Start & Setup Instructions

You can experience TraceFlow in two ways:

1. **Instant Cloud Live Testing (Recommended)** — No setup or installation required!
2. **Local Development Setup** — Full control on your local machine.

---

### Option A: Instant Cloud Live Testing (0 Setup)

Simply open the live cloud deployment in your browser:

1. Open the **[Live Dashboard](https://trace-flow-self.vercel.app/)** (`https://trace-flow-self.vercel.app/`).
2. Click **"🛍️ Demo Store ↗"** in the top-right header to launch the **[Aura Demo Storefront](https://trace-flow-self.vercel.app/demo/index.html)** in a second tab.
3. Interact with products and buttons on the store — click coordinates and sessions stream in real-time to the dashboard!

---

### Option B: Local Development Setup

#### Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (bundled with Node.js)
- **Git**: For repository cloning

#### Step 1: Clone Repository

```bash
git clone https://github.com/vivaangarg2005/TraceFlow.git
cd TraceFlow
```

#### Step 2: Install Dependencies

Install all dependencies across the monorepo with a single command:

```bash
npm run install:all
```

#### Step 3: Configure Environment Variables

Copy the pre-configured `.env.example` in `backend/` to `.env`:

```bash
# Windows PowerShell
cp backend/.env.example backend/.env

# macOS / Linux
cp backend/.env.example backend/.env
```

The default `backend/.env` is already configured with a cloud MongoDB Atlas connection so you can run the app immediately without installing local MongoDB:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://vivaangarg1204_db_user:RPya37sxxcZXw1OJ@traceflow.wd5fnue.mongodb.net/traceflow?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
DEMO_URL=http://localhost:3000
```

> **Note on Local MongoDB:** If you prefer running a local database instead, set:  
> `MONGODB_URI=mongodb://127.0.0.1:27017/traceflow`

#### Step 4: Launch the Services

Open three terminal windows from the repository root:

- **Terminal 1 — Backend API (Port 5000):**

  ```bash
  npm run dev:backend
  ```

  _Expected log:_ `✅ Server running on http://localhost:5000 | MongoDB Connected successfully`

- **Terminal 2 — React Dashboard (Port 5173):**

  ```bash
  npm run dev:frontend
  ```

  _Expected log:_ `VITE ready | Local: http://localhost:5173/`

- **Terminal 3 — Aura Demo Store (Port 3000):**
  ```bash
  npm run dev:demo
  ```
  _Expected log:_ `Aura Store running on http://localhost:3000`

---

## 🌐 Application Services & URLs

| Service                 | Production (Cloud)                                                                                       | Localhost (Development)                                              | Purpose                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------- |
| **Analytics Dashboard** | [trace-flow-self.vercel.app](https://trace-flow-self.vercel.app/)                                        | [http://localhost:5173](http://localhost:5173)                       | Primary React analytics dashboard   |
| **Aura Storefront**     | [trace-flow-self.vercel.app/demo/index.html](https://trace-flow-self.vercel.app/demo/index.html)         | [http://localhost:3000](http://localhost:3000)                       | Test e-commerce luxury storefront   |
| **API Health Status**   | [traceflow-backend-gbi3.onrender.com/api/health](https://traceflow-backend-gbi3.onrender.com/api/health) | [http://localhost:5000/api/health](http://localhost:5000/api/health) | System health & MongoDB diagnostics |
| **Tracking Script SDK** | [traceflow-backend-gbi3.onrender.com/tracker.js](https://traceflow-backend-gbi3.onrender.com/tracker.js) | [http://localhost:5000/tracker.js](http://localhost:5000/tracker.js) | Embeddable telemetry SDK script     |

---

## 🎮 How to Test & Use the Platform (Walkthrough)

Follow this end-to-end testing workflow to evaluate the complete telemetry pipeline:

### Step 1: Browse the Demo Storefront (Generate Telemetry)

1. Open the **Aura Storefront** ([Live Hosted](https://trace-flow-self.vercel.app/demo/index.html) or `http://localhost:3000`).
2. Browse the homepage: click banners, navigation tabs, or promotional items (e.g., _"Explore Collection"_).
3. Open any product page (e.g., click **Titanium Timepiece** or **Monochrome Runner V2**).
4. Select a size or color, and click **"Add to Cart"**.
5. Proceed to the **Checkout** page (`/checkout.html`), fill out sample shipping details, and click **"Complete Purchase"**.
   _(Note: A floating tracking HUD in the bottom-right corner shows events streaming in real time as you click)._

### Step 2: Inspect Visitor Journeys in the Dashboard

1. Open the **TraceFlow Dashboard** ([Live Hosted](https://trace-flow-self.vercel.app/) or `http://localhost:5173`).
2. In the **"👥 Visitor Journeys"** tab, you will see your browsing session listed immediately with device type, duration, pageview count, and total clicks.
3. Click on the session card to open the **User Journey Modal**:
   - Inspect the step-by-step chronological timeline of your journey.
   - View precise time offsets (`+0s`, `+14s`, `+42s`), clicked element IDs, and click coordinates.
4. Toggle between **"👔 Store Owner"** (plain-English behavioral insights) and **"🛠️ Technical"** (raw coordinates, DOM selectors, JSON payloads) in the top header.

### Step 3: Visualize Spatial Click Heatmaps

1. Switch to the **"🔥 Click Heatmaps"** tab in the dashboard.
2. Select any visited page from the dropdown (e.g., `🏠 Home (/index.html)` or `⌚ Product: Titanium Timepiece`).
3. Explore the **Three Visual Engines**:
   - **Thermal Glow**: Continuous radial density shader showing hot and cold interaction clusters.
   - **10×10 Spatial Grid Matrix**: Quantized cell density matrix with percentage concentrations.
   - **Interactive Element Pins**: Hover over individual pins to inspect target tags, button text, and session IDs.
4. Test the **Device Viewport Switcher**: Toggle between **Desktop (1280×800)**, **Tablet (768×960)**, and **Mobile (390×844)** to see proportional coordinate scaling.
5. **Real-Time Live Streaming**: Place the demo store and dashboard side-by-side. Click anywhere on the store and watch the heatmap update live every 2.5s with a green pulse badge!

### Step 4: Quick Simulation & Testing Tools

- **Instant Demo Data**: Click **"⚡ Simulate Shopper"** in the top header to instantly synthesize a multi-step shopper journey without manual clicking.
- **Instant Data Reset**: Click **"🗑️ Reset Data"** in the top header (or _"🗑️ Reset Clicks"_ in the Heatmap toolbar) to wipe click hotspots for clean testing.
- **Automated Tests**: Run `npm test` in your terminal to execute all 13 automated API integration tests.

---

## 🔍 In-Depth Feature Tour

### 1. Zero-Friction Client-Side SDK (`tracker.js`)

Add one line to any webpage to immediately enable interaction tracking:

```html
<!-- Hosted Production Script -->
<script
  src="https://traceflow-backend-gbi3.onrender.com/tracker.js"
  defer
></script>

<!-- Local Development Script -->
<script src="http://localhost:5000/tracker.js" defer></script>
```

#### What It Captures:

- **`page_view`**: Triggered automatically on page load and SPA navigation. Gathers URL, canonical path, title, viewport width/height, document dimensions, and referrer.
- **`click`**: Captures mouse/touch coordinates `(x, y)` and automatically computes normalized viewport percentages `(xPercent, yPercent)`.
- **DOM Contextual Enrichment**: Records `elementTag` (e.g. `BUTTON`, `A`), `elementId`, `elementText`, CSS selector path, and semantic parent section (e.g., `hero`, `catalog`, `checkout-form`).
- **Privacy Scrubbing**: Automatically strips credit card numbers (Luhn pattern detection) and email addresses from captured text before transmission.
- **Resilient Transport**: Uses `navigator.sendBeacon()` for page unloads, with fallback to `fetch(..., { keepalive: true })`. Queues and batches up to 5 events or flushes every 1.5 seconds.

---

### 2. Interactive Analytics Dashboard

#### A. Overview KPI Ribbon

Displays real-time high-level business metrics:

- **Total Unique Visitors** and active sessions.
- **Total Tracked Interactions** (broken down into pageviews and clicks).
- **Average Interaction Depth** (events per session).
- **Click-Through Rate (CTR)** and average session duration.

#### B. Visitor Journeys (Sessions Explorer)

- **Chronological Session List**: Filterable by time range (_Today, Past 24 Hours, Last 7 Days, All Time_) and searchable by session ID or path.
- **Device & Entry/Exit Tracking**: Shows initial landing page and last viewed page with clear visual badges.
- **User Journey Modal**: Clicking on any session opens a step-by-step chronological user journey timeline:
  - Visual icons for page entries, button clicks, and checkouts.
  - Formatted time offsets (e.g. `+0s`, `+12s`, `+45s`).
  - Technical DOM inspection: element tag, target ID, click coordinates `(x: 480, y: 720)`.

#### C. Real-Time Spatial Click Heatmaps

- **Live In-Situ Iframe Rendering**: Overlays click hotspots directly on top of the live web page, preserving the actual visual context of the site.
- **Responsive Device Switcher**: Switch between **Desktop (1280×800)**, **Tablet (768×960)**, and **Mobile (390×844)** with calibrated aspect ratios.
- **Three Render Engines**:
  1. **Thermal Glow**: Custom radial gradient shader with multi-stop color grading (Blue → Cyan → Lime → Yellow → Crimson).
  2. **10×10 Spatial Grid Matrix**: Groups clicks into spatial quadrants with percentage densities.
  3. **Interactive Element Pins**: Hoverable pins revealing exact element IDs, text labels, and session counts.
- **Real-Time Auto-Sync Stream**: An active background synchronization engine (every 2.5s) with live visual pulses whenever a customer clicks on the store in another tab.
- **Heatmap Calibration Controls**: Interactive sliders for Heat Radius (16px to 54px) and Heat Opacity (25% to 100%).

#### D. Audience Perspective Switcher

- **Store Owner Mode**: Translates raw data into plain-English e-commerce insights, product performance, and friction detection.
- **Technical Mode**: Exposes raw MongoDB session IDs, normalized coordinates, DOM selector paths, and raw JSON payloads.

---

## 📡 API Documentation

### Base URLs:

- **Production Cloud:** `https://traceflow-backend-gbi3.onrender.com/api`
- **Localhost Development:** `http://localhost:5000/api`

### 1. System Health Check

- **Route:** `GET /api/health`
- **Description:** Verifies service uptime and active MongoDB database connection.
- **Response:** `200 OK`

```json
{
  "status": "healthy",
  "database": "connected",
  "databaseHost": "traceflow.wd5fnue.mongodb.net",
  "uptimeSeconds": 1420
}
```

---

### 2. Ingest Events

- **Route:** `POST /api/events`
- **Description:** Ingests a single event or an array of batched events.
- **Sample Request:**

```json
{
  "sessionId": "tf_session_89f2a1b",
  "eventType": "click",
  "url": "https://trace-flow-self.vercel.app/demo/product.html?id=watch",
  "path": "/product.html?id=watch",
  "title": "Aura Store — Titanium Timepiece",
  "x": 640,
  "y": 420,
  "xPercent": 50.0,
  "yPercent": 46.67,
  "viewportWidth": 1280,
  "viewportHeight": 900,
  "documentWidth": 1280,
  "documentHeight": 1800,
  "elementTag": "BUTTON",
  "elementId": "btn-add-to-cart",
  "elementText": "Add to Cart",
  "elementSection": "product-details",
  "timestamp": "2026-10-14T05:00:00.000Z"
}
```

- **Response:** `201 Created`

```json
{ "success": true, "message": "Event recorded successfully", "count": 1 }
```

---

### 3. List Tracked Sessions

- **Route:** `GET /api/sessions`
- **Query Params:**
  - `page` _(default: 1)_
  - `limit` _(default: 50)_
  - `timeRange` (`today`, `24h`, `7d`, `30d`, `all`)
  - `includeSimulated` (`true`, `false`)
  - `search` _(searches session IDs and paths)_
  - `sort` (`lastSeen_desc`, `events_desc`, `duration_desc`)
- **Response:** `200 OK`

```json
{
  "success": true,
  "totalSessions": 12,
  "page": 1,
  "totalPages": 1,
  "data": [
    {
      "sessionId": "tf_session_89f2a1b",
      "totalEvents": 8,
      "pageViews": 3,
      "clicks": 5,
      "firstSeen": "2026-10-14T04:45:00.000Z",
      "lastSeen": "2026-10-14T04:52:30.000Z",
      "durationSeconds": 450.0,
      "entryPage": "/index.html",
      "exitPage": "/checkout.html",
      "deviceType": "desktop",
      "isSimulated": false
    }
  ]
}
```

---

### 4. Retrieve Session Event Timeline (User Journey)

- **Route:** `GET /api/sessions/:sessionId/events`
- **Description:** Returns the ordered chronological stream of all events performed in a given session.
- **Response:** `200 OK`

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "eventType": "page_view",
      "path": "/index.html",
      "timestamp": "2026-10-14T04:45:00.000Z"
    },
    {
      "eventType": "click",
      "elementText": "Shop Collection",
      "xPercent": 48.2,
      "yPercent": 25.1
    },
    {
      "eventType": "page_view",
      "path": "/product.html?id=watch",
      "timestamp": "2026-10-14T04:46:10.000Z"
    },
    {
      "eventType": "click",
      "elementText": "Add to Cart",
      "xPercent": 55.4,
      "yPercent": 38.6
    }
  ]
}
```

---

### 5. Fetch Page Click Heatmap Data

- **Route:** `GET /api/analytics/clicks`
- **Query Params:**
  - `url` or `path` _(required, e.g. `/index.html` or `/product.html?id=watch`)_
  - `deviceType` (`desktop`, `tablet`, `mobile`, optional)
  - `timeRange` (`today`, `24h`, `7d`, `all`)
- **Response:** `200 OK`

```json
{
  "success": true,
  "totalClicks": 24,
  "uniqueSessions": 9,
  "rapidClicksCount": 2,
  "sectionBreakdown": { "hero": 14, "product-details": 8, "footer": 2 },
  "data": [
    {
      "x": 640,
      "y": 420,
      "xPercent": 50.0,
      "yPercent": 46.67,
      "elementTag": "BUTTON",
      "elementId": "btn-add-to-cart",
      "elementText": "Add to Cart",
      "elementSection": "product-details",
      "timestamp": "2026-10-14T04:47:00.000Z"
    }
  ]
}
```

---

### 6. Reset Recorded Clicks

- **Route:** `DELETE /api/analytics/clicks`
- **Query Params:**
  - `allEvents` (`false` deletes only clicks; `true` resets all session and pageview data)
  - `url` _(optional, resets clicks for a specific page)_
- **Response:** `200 OK`

```json
{
  "success": true,
  "message": "Click events cleared successfully",
  "deletedCount": 24
}
```

---

## 🗄️ Database Schema & Aggregation Pipeline

TraceFlow stores events in a single high-performance `events` collection:

```javascript
const EventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  eventType: {
    type: String,
    enum: ["page_view", "click"],
    required: true,
    index: true,
  },
  url: { type: String, required: true, index: true },
  path: { type: String, index: true },
  title: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },

  // Spatial Geometry & Viewport Context
  x: { type: Number },
  y: { type: Number },
  xPercent: { type: Number },
  yPercent: { type: Number },
  viewportWidth: { type: Number },
  viewportHeight: { type: Number },
  documentWidth: { type: Number },
  documentHeight: { type: Number },
  scrollX: { type: Number, default: 0 },
  scrollY: { type: Number, default: 0 },
  deviceType: {
    type: String,
    enum: ["desktop", "tablet", "mobile"],
    default: "desktop",
  },

  // Element Metadata
  elementTag: { type: String },
  elementId: { type: String },
  elementText: { type: String },
  elementSection: { type: String },
  elementSelector: { type: String },

  // Meta Flags
  isSimulated: { type: Boolean, default: false },
});
```

### High-Performance MongoDB Compound Indexes:

1. `{ sessionId: 1, timestamp: 1 }`: Enables instantaneous chronological sorting for User Journey reconstruction.
2. `{ url: 1, eventType: 1, timestamp: -1 }`: Optimizes heatmap queries for specific pages.
3. `{ path: 1, eventType: 1 }`: Enables fast path aggregation across query parameter variations.

---

## 🧪 Automated Test Suite (13/13 Passing)

The project includes an automated test suite built on the native Node.js test runner (`node:test` and `node:assert`).

To run the tests locally:

```bash
npm test
```

### Test Coverage Report

```
✔ 1. Health Check Endpoint returns healthy status (257ms)
✔ 2. Serve tracking script at /tracker.js (33ms)
✔ 3. Ingest single page_view event (POST /api/events) (1023ms)
✔ 4. Ingest batch of click events (POST /api/events) (140ms)
✔ 5. Reject invalid event without sessionId or missing click coordinates (45ms)
✔ 6. Fetch list of sessions with event counts (GET /api/sessions) (141ms)
✔ 7. Fetch user journey for a specific session (GET /api/sessions/:sessionId/events) (100ms)
✔ 8. Fetch click heatmap data for a page (GET /api/analytics/clicks) (77ms)
✔ 9. Fetch distinct tracked pages (GET /api/analytics/pages) (88ms)
✔ 10. Fetch overview metrics (GET /api/analytics/overview) (583ms)
✔ 11. Privacy scrubbing: redacts sensitive card numbers and email patterns in elementText (71ms)
✔ 12. Query filtering supports timeRange and simulation isolation (88ms)
✔ 13. Reset click events (DELETE /api/analytics/clicks) (87ms)

ℹ tests 13 | pass 13 | fail 0 | cancelled 0 | duration_ms 4224ms
```

---

## 🧠 Engineering Decisions & Edge Cases

### 1. Dual Coordinate Strategy: Absolute PX vs. Viewport Percentages

- **Challenge:** Screen sizes vary drastically between visitors (4K monitors vs laptops vs smartphones). Absolute pixel coordinates alone distort heatmaps when viewed on different monitor resolutions.
- **Solution:** TraceFlow records both absolute `(x, y)` and normalized percentage coordinates `(xPercent, yPercent)`. The heatmap visualizer uses percentage normalization matched to strict container aspect ratios (`1280:800` desktop, `768:960` tablet, `390:844` mobile), guaranteeing that buttons and hotspots align identically across all viewports.

### 2. Client-Side Session Tokens vs. Server Cookies

- **Decision:** We opted for client-managed session generation (`localStorage` with cookie fallback and 30-minute rolling expiration).
- **Benefits:** Eliminates round-trip latency on the initial page load, allows cross-page persistence across static file origins, and avoids complex CORS cookie handling for third-party scripts.
- **Trade-off:** Incognito windows or users who clear their site data generate new session IDs upon return, which is standard for anonymous interaction tracking.

### 3. Asynchronous Beacon API with Batching

- **Decision:** Telemetry is dispatched via `navigator.sendBeacon()` with fallback to `fetch(..., { keepalive: true })`. Events are queued and dispatched in batches of 5 or flushed every 1.5 seconds.
- **Benefits:** Guarantees that clicks triggering immediate navigation (e.g., clicking an `<a>` link or "Proceed to Checkout") are not cancelled or lost when the page unloads, with zero frame drops or UI freezing for the shopper.

### 4. Database-Side Pipeline Aggregations

- **Decision:** Rather than fetching thousands of raw events to the Node.js server and aggregating in JavaScript, TraceFlow delegates all grouping, duration calculation, and entry/exit page resolution to MongoDB aggregation pipelines.
- **Benefits:** Constant sub-100ms response times even when the database contains tens of thousands of event documents.

---

## 📂 Folder Structure

```text
TraceFlow/
├── backend/
│   ├── public/
│   │   └── tracker.js               # Embeddable client-side tracking SDK
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # Resilient MongoDB connection manager
│   │   ├── controllers/
│   │   │   └── eventController.js   # Ingestion, session journeys, and heatmap logic
│   │   ├── models/
│   │   │   └── Event.js             # Mongoose event schema and compound indexes
│   │   ├── routes/
│   │   │   └── eventRoutes.js       # REST route declarations
│   │   └── server.js                # Express app initialization and middleware
│   ├── test/
│   │   └── api.test.js              # Comprehensive 13-case test suite
│   ├── .env.example                 # Sample configuration with Atlas connection
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── demo/                    # Bundled demo storefront for zero-PNA cloud previews
│   │   │   ├── index.html
│   │   │   ├── product.html
│   │   │   └── checkout.html
│   │   └── tracker.js               # Public client tracker copy
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Global controls, filters & reset button
│   │   │   ├── OverviewCards.jsx    # Top KPI metrics strip
│   │   │   ├── SessionsView.jsx     # Session explorer table and filters
│   │   │   ├── UserJourneyModal.jsx # Step-by-step chronological session replay
│   │   │   └── HeatmapView.jsx      # Multi-device canvas heatmap & live sync
│   │   ├── services/
│   │   │   └── api.js               # Centralized HTTP API client
│   │   ├── utils/
│   │   │   └── urlHelper.js         # Production environment & URL normalizer
│   │   ├── App.jsx                  # Main dashboard controller
│   │   ├── App.css                  # Modern dark glassmorphic styling system
│   │   └── main.jsx
│   └── package.json
│
├── demo/
│   ├── index.html                   # Storefront landing page & category grid
│   ├── product.html                 # Dynamic multi-product detail page
│   ├── checkout.html                # Multi-step checkout experience
│   └── styles.css                   # Minimalist modern storefront theme
│
├── package.json                     # Monorepo orchestration scripts
└── README.md                        # Comprehensive system documentation
```

---

## 👨‍💻 Author

**Vivaan Garg**

- **GitHub:** [@vivaangarg2005](https://github.com/vivaangarg2005)
- **Repository:** [https://github.com/vivaangarg2005/TraceFlow](https://github.com/vivaangarg2005/TraceFlow)
- **Live Demo:** [https://trace-flow-self.vercel.app/](https://trace-flow-self.vercel.app/)

---

<p align="center">
  <strong>TraceFlow Analytics</strong> • High-Precision User Analytics & Click Heatmap Dashboard
</p>
