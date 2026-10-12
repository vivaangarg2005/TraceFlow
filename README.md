# 🚀 TraceFlow Analytics

**A Full-Stack User Interaction Tracking & Behavioral Analytics Platform**

TraceFlow is an end-to-end behavioral analytics platform that captures user interactions, reconstructs browsing sessions, and visualizes click behavior through interactive heatmaps and user journey timelines.

Built with **Vanilla JavaScript, Node.js, Express, MongoDB, React, and Vite**, TraceFlow provides a complete environment for collecting, processing, and exploring user interaction data across an e-commerce storefront.

<p align="center">
  <a href="https://github.com/vivaangarg2005/TraceFlow">
    <img src="https://img.shields.io/badge/Project-TraceFlow-6366f1?style=for-the-badge" alt="TraceFlow" />
  </a>
  <img src="https://img.shields.io/badge/Tests-10%2F10%20Passing-22c55e?style=for-the-badge" alt="Tests Passing" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</p>

<p align="center">
  <strong>Track interactions. Reconstruct journeys. Understand behavior.</strong>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#️-system-architecture)
- [Technology Stack](#️-technology-stack)
- [Getting Started](#-getting-started)
- [Application URLs](#-application-urls)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Database Design](#️-database-design)
- [Testing](#-testing)
- [Engineering Decisions](#-engineering-decisions)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Future Improvements](#️-future-improvements)
- [Author](#-author)
- [License](#-license)

---

## 📌 Overview

TraceFlow Analytics is a full-stack behavioral analytics application designed to help developers and product teams understand how users interact with websites.

Traditional analytics often focus on aggregate metrics such as pageviews and sessions. TraceFlow goes further by capturing individual interactions, preserving their chronological order, and visualizing where users click on a page.

The platform combines a lightweight browser tracking script, a REST API, MongoDB-based event storage, and a React analytics dashboard into a single application.

### The Problem

Understanding user behavior requires more than knowing how many people visited a website. Developers and product teams also need to understand:

- Which pages users visit and in what order.
- Which buttons and interface elements receive the most interactions.
- How users navigate between pages during a session.
- Where clicks are concentrated within a page.
- How interaction patterns vary across viewport sizes.
- How users move through an e-commerce journey.

### The Solution

TraceFlow captures structured interaction events, associates them with browsing sessions, and exposes the resulting data through an interactive analytics dashboard.

The included **Aura Wear** demo storefront provides a practical environment for generating real browsing sessions and testing the tracking pipeline.

### Project Goals

- Build a lightweight, framework-independent client tracking script.
- Design a reliable event ingestion API.
- Store and query behavioral events efficiently.
- Reconstruct chronological user journeys.
- Visualize click distributions using interactive heatmaps.
- Provide a reproducible local development environment.

---

## ✨ Key Features

### ⚡ Lightweight Client-Side Tracking

- Dependency-free JavaScript tracking script.
- Automatic pageview event capture.
- Click tracking with pixel and percentage-based coordinates.
- DOM context collection, including element tag, ID, and text.
- Client-generated session identifiers.
- Session renewal after 30 minutes of inactivity.
- Asynchronous event transmission using `navigator.sendBeacon`.
- `fetch` with `keepalive: true` as a fallback.
- Client-side event batching to reduce request overhead.

### 📊 Interactive Analytics Dashboard

**Sessions Explorer**

- Browse recorded user sessions.
- View total events, pageviews, clicks, and session duration.
- Inspect chronological user journeys.
- Explore timestamps, URLs, and click coordinates.
- Filter and navigate through recorded session data.

**Click Heatmaps**

- **Radial Glow:** Visualizes areas with concentrated clicks.
- **10 × 10 Density Grid:** Groups interactions into spatial cells.
- **Element Pins:** Displays individual click locations with contextual tooltips.
- **Store Wireframe:** Provides visual context for the demo storefront.
- **Page Selection:** Switch between tracked pages to explore interaction patterns.

**Overview Analytics**

- High-level activity metrics.
- Tracked-page summaries.
- Pageview and click breakdowns.
- Metrics derived from stored interaction events.

### 🛍️ Interactive E-Commerce Demo

TraceFlow includes **Aura Wear**, a multi-page storefront for testing tracking functionality.

- Product catalog and promotional banner.
- Product details and sizing interactions.
- Add-to-cart interactions.
- Checkout flow.
- Multi-page navigation.
- Tracking HUD for observing events during testing.

### 🚀 Backend & Data Processing

- RESTful API built with Node.js and Express.
- Single-event and batch-event ingestion.
- Event validation.
- Session-level aggregation using MongoDB pipelines.
- Chronological event retrieval.
- Click analytics and tracked-page discovery.
- Compound indexes for common query patterns.
- Health-check endpoint.

### 🧪 Automated Testing

- Native Node.js test runner using `node:test`.
- Assertions using `node:assert`.
- API integration tests.
- Event validation and edge-case coverage.
- Session aggregation and analytics tests.

---

## 🏗️ System Architecture

TraceFlow follows a layered architecture that separates browser instrumentation, API processing, data persistence, and analytics visualization.

```text
┌──────────────────────────────────────────────────────────┐
│                     CLIENT TIER                          │
│                                                          │
│  Aura Wear Demo Store                 Port 3000          │
│  ├── index.html                                         │
│  ├── product.html                                       │
│  └── checkout.html                                      │
│                 │                                        │
│                 ▼                                        │
│  tracker.js                                              │
│  ├── Pageview and click capture                          │
│  ├── Session identification                             │
│  ├── Coordinate normalization                           │
│  ├── Event batching                                      │
│  └── Asynchronous transmission                           │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ POST /api/events
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND TIER                          │
│                                                          │
│  Node.js + Express API                Port 5000          │
│  ├── Event ingestion and validation                      │
│  ├── Session aggregation                                 │
│  ├── Journey retrieval                                   │
│  ├── Click analytics                                     │
│  ├── Page analytics                                      │
│  └── Health check and tracker delivery                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ Queries and aggregations
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    DATABASE TIER                         │
│                                                          │
│  MongoDB 7                           Port 27017          │
│  ├── Event documents                                     │
│  ├── Chronological session events                         │
│  ├── Click coordinate data                               │
│  └── Compound indexes                                    │
└────────────────────────▲─────────────────────────────────┘
                         │
                         │ Analytics API responses
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   DASHBOARD TIER                         │
│                                                          │
│  React 19 + Vite                     Port 5173           │
│  ├── Sessions explorer                                   │
│  ├── User journey timeline                               │
│  ├── Interactive click heatmaps                           │
│  └── Overview and page metrics                            │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. A visitor opens the Aura Wear storefront.
2. `tracker.js` initializes or resumes a tracking session.
3. Pageviews and clicks are converted into structured events.
4. Events are buffered and transmitted to the backend.
5. Express validates and persists accepted events in MongoDB.
6. MongoDB aggregation pipelines calculate session-level and page-level metrics.
7. The React dashboard requests the resulting data and renders timelines, metrics, and heatmaps.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Tracking | Vanilla JavaScript | Lightweight browser instrumentation |
| Runtime | Node.js 18+ | Server-side JavaScript execution |
| Backend | Express 4.x | REST API and event ingestion |
| Database | MongoDB 7 | Persistent event storage |
| ODM | Mongoose 8.x | Document schemas and database access |
| Frontend | React 19 | Interactive analytics dashboard |
| Build Tool | Vite | Frontend development and bundling |
| Styling | Vanilla CSS | Custom dark theme and responsive layouts |
| Containers | Docker Compose | Reproducible database setup |
| Testing | `node:test` | Native Node.js test execution |

---

## 🚀 Getting Started

Follow these steps to run TraceFlow locally.

### Prerequisites

Install the following tools before proceeding:

- [Node.js](https://nodejs.org/) — version 18 or later.
- npm — included with Node.js.
- [Git](https://git-scm.com/).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose, or a running MongoDB instance.
- A modern web browser.

### 1. Clone the Repository

```bash
git clone https://github.com/vivaangarg2005/TraceFlow.git
cd TraceFlow
```

### 2. Configure MongoDB

#### Option A: Docker Compose (Recommended)

From the project root, run:

```bash
docker compose up -d
```

This starts the MongoDB service defined in the project's Compose configuration.

The default local connection string is typically:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/traceflow
```

Use the actual connection settings configured for your environment.

#### Option B: MongoDB Atlas

1. Create a cluster in [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).
2. Configure database access and network permissions.
3. Copy the cluster connection string.
4. Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

5. Update `MONGODB_URI` in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/traceflow?retryWrites=true&w=majority
```

Replace the placeholders with your actual credentials and cluster hostname.

**Security note:** Never commit `.env` files, database credentials, or private connection strings to version control.

### 3. Install Dependencies

If the root `package.json` defines the documented `install:all` script, run:

```bash
npm run install:all
```

Alternatively, install the backend and frontend dependencies separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Return to the project root before running root-level commands.

### 4. Start the Application

Run each service in a separate terminal from the project root.

**Terminal 1 — Backend API**

```bash
npm run dev:backend
```

**Terminal 2 — React Dashboard**

```bash
npm run dev:frontend
```

**Terminal 3 — Demo Store**

```bash
npm run dev:demo
```

Keep all three services running while testing the application.

> These commands reflect the documented project scripts. If a script is unavailable, check the relevant `package.json` file for the actual script name.

### 5. Verify the Installation

Open the backend health endpoint:

```text
http://localhost:5000/api/health
```

Then open the dashboard and demo storefront:

- Dashboard: `http://localhost:5173`
- Demo store: `http://localhost:3000`

Navigate through the storefront, click product and cart elements, and proceed through checkout.

Return to the dashboard to inspect recorded sessions, user journeys, and click heatmaps.

For reliable results, confirm that MongoDB is connected and that the browser's Network panel shows successful requests to the event ingestion endpoint.

---

## 🌐 Application URLs

| Service | URL | Description |
|---|---|---|
| Analytics Dashboard | [localhost:5173](http://localhost:5173) | Sessions, metrics, and heatmaps |
| Aura Wear Store | [localhost:3000](http://localhost:3000) | Demo storefront for generating events |
| Backend Health | [localhost:5000/api/health](http://localhost:5000/api/health) | API health check |
| Tracking Script | [localhost:5000/tracker.js](http://localhost:5000/tracker.js) | Embeddable tracking script |
| MongoDB | `localhost:27017` | Local database, if exposed by the Compose configuration |

These URLs assume the default ports and a successful startup.

---

## 🔄 How It Works

### 1. Event Tracking

The browser tracking script captures supported user interactions and converts them into structured event documents.

**Example: Pageview event**

```json
{
  "sessionId": "tf_example-session-id",
  "eventType": "page_view",
  "url": "http://localhost:3000/index.html",
  "title": "Aura Store | Home",
  "timestamp": "2026-10-12T14:00:00.000Z",
  "viewportWidth": 1440,
  "viewportHeight": 900
}
```

**Example: Click event**

```json
{
  "sessionId": "tf_example-session-id",
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
```

These payloads illustrate the documented event format. They are examples rather than records from a live session.

### 2. Session Management

The tracker uses a client-generated session identifier to associate events with a browsing session.

The documented session lifecycle is:

- Reuse the existing session while it remains valid.
- Track inactivity using a 30-minute window.
- Generate a new session after the inactivity threshold is exceeded.

The implementation uses browser storage with a cookie fallback, as described in the project design.

### 3. Event Transmission

To reduce network overhead and improve delivery during navigation, the tracker:

- Buffers events in a client-side queue.
- Flushes events periodically.
- Flushes when the queue reaches the configured batch threshold.
- Uses `navigator.sendBeacon` where appropriate.
- Uses `fetch` with `keepalive: true` as a fallback.

The documented batching configuration uses a 1.5-second interval or a queue size of five events.

Asynchronous delivery reduces interference with the user interface, but it cannot guarantee delivery under every network or browser condition.

### 4. Coordinate Normalization

TraceFlow records both absolute click coordinates and viewport-relative percentages.

The normalization formulas are:

\[
xPercent = \frac{x}{viewportWidth}\times100
\]

\[
yPercent = \frac{y}{viewportHeight}\times100
\]

For example, a click at `(480, 620)` in a viewport measuring `1440 × 900` corresponds to approximately `(33.33%, 68.89%)`.

Percentage-based coordinates make heatmaps more adaptable to different viewport dimensions. They do not, by themselves, guarantee alignment across different page layouts, scrolling positions, or content versions.

### 5. Analytics & Visualization

The backend exposes session and page analytics, while the dashboard uses the resulting data to render:

- Session summaries and activity counts.
- Chronological user journeys.
- Click density overlays.
- Element-level click details.
- Tracked-page analytics.

This separation keeps event collection, persistence, aggregation, and visualization independently organized.

---

## 📡 API Reference

TraceFlow exposes REST endpoints for event ingestion, session retrieval, and analytics.

### Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check API health |
| `GET` | `/tracker.js` | Serve the client tracking script |
| `POST` | `/api/events` | Ingest a single event or batch |
| `GET` | `/api/sessions` | Retrieve paginated session summaries |
| `GET` | `/api/sessions/:sessionId/events` | Retrieve a session's event timeline |
| `GET` | `/api/analytics/clicks` | Retrieve click data for heatmaps |
| `GET` | `/api/analytics/pages` | List tracked pages and activity |
| `GET` | `/api/analytics/overview` | Retrieve overview metrics |

### 1. Ingest Events

**Endpoint:** `POST /api/events`

Accepts a single event object or a batch of events, subject to the backend's validation rules.

Example request:

```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "tf_example-session-id",
    "eventType": "page_view",
    "url": "http://localhost:3000/index.html",
    "title": "Aura Store | Home",
    "timestamp": "2026-10-12T14:00:00.000Z",
    "viewportWidth": 1440,
    "viewportHeight": 900
  }'
```

For click events, provide the required coordinate fields and any other fields expected by the backend schema.

### 2. Retrieve Sessions

**Endpoint:** `GET /api/sessions?page=1&limit=50`

Returns paginated session summaries, including documented event counts, pageviews, clicks, and session duration.

```bash
curl "http://localhost:5000/api/sessions?page=1&limit=50"
```

### 3. Retrieve a User Journey

**Endpoint:** `GET /api/sessions/:sessionId/events`

Returns events associated with a specified session in chronological order.

```bash
curl "http://localhost:5000/api/sessions/tf_example-session-id/events"
```

### 4. Retrieve Click Heatmap Data

**Endpoint:** `GET /api/analytics/clicks?url=...`

Retrieves click coordinates and DOM context for the requested page.

```bash
curl -G "http://localhost:5000/api/analytics/clicks" \
  --data-urlencode "url=http://localhost:3000/index.html"
```

### 5. Retrieve Tracked Pages

**Endpoint:** `GET /api/analytics/pages`

Returns the distinct tracked pages and their associated activity counts for dashboard page selection.

```bash
curl http://localhost:5000/api/analytics/pages
```

### 6. Retrieve Overview Metrics

**Endpoint:** `GET /api/analytics/overview`

Returns high-level analytics metrics used by the dashboard.

```bash
curl http://localhost:5000/api/analytics/overview
```

> **API note:** These examples demonstrate how to call the documented endpoints. Exact response schemas, status codes, and validation behavior should be verified against the implementation.

---

## 🗄️ Database Design

MongoDB stores interaction events as documents, allowing pageviews and clicks to share common fields while retaining event-specific attributes.

### Event Data Model

| Field | Purpose |
|---|---|
| `sessionId` | Associates events with a browsing session |
| `eventType` | Identifies the interaction type |
| `url` | Full page URL associated with the event |
| `timestamp` | Event occurrence time |
| `title` | Page title, when available |
| `viewportWidth` | Browser viewport width |
| `viewportHeight` | Browser viewport height |
| `x`, `y` | Absolute click coordinates |
| `xPercent`, `yPercent` | Normalized click coordinates |
| `elementTag` | Clicked element's tag name |
| `elementId` | Clicked element's ID, when available |
| `elementText` | Clicked element's text, when available |

Fields vary according to event type. Click-specific fields are not expected to be present on every pageview.

### Indexing Strategy

The documented compound indexes are:

```javascript
{ sessionId: 1, timestamp: 1 }
{ url: 1, eventType: 1 }
{ path: 1, eventType: 1 }
```

Their intended purposes are:

- **Session and timestamp:** Retrieve session events in chronological order.
- **URL and event type:** Filter page activity by event category.
- **Path and event type:** Query activity grouped by normalized page path.

Index effectiveness depends on query predicates, sorting, data distribution, and event volume. Query plans should be evaluated against representative workloads.

### Aggregation Strategy

MongoDB aggregation pipelines calculate session and analytics summaries without requiring the application to load every event into memory.

The documented design uses operations such as:

- `$group` to group events and calculate session-level metrics.
- `$min` and `$max` to identify temporal boundaries.
- `$facet` to combine multiple aggregation outputs where appropriate.

This keeps common analytics calculations close to the data.

---

## 🧪 Testing

TraceFlow uses Node.js's built-in test runner, `node:test`, with assertions from `node:assert`.

Run the test suite from the project root:

```bash
npm test
```

The project's documented test suite contains ten test cases.

| # | Test | Expected Behavior |
|---:|---|---|
| 1 | Health check | Returns a healthy API status |
| 2 | Tracker delivery | Serves `tracker.js` |
| 3 | Single-event ingestion | Accepts a valid pageview |
| 4 | Batch ingestion | Accepts a valid batch of click events |
| 5 | Input validation | Rejects invalid events and missing required click coordinates |
| 6 | Session listing | Returns session summaries and event counts |
| 7 | User journey | Retrieves events for a specified session |
| 8 | Click analytics | Returns click data for a selected page |
| 9 | Tracked pages | Retrieves distinct tracked pages |
| 10 | Overview analytics | Returns overview metrics |

**Reported result: 10 passed, 0 failed.**

These results reflect the project's supplied test report. Run `npm test` to verify the current checkout and environment.

---

## 🧠 Engineering Decisions & Trade-offs

### 1. Client-Managed Session Lifecycle

**Decision:** Generate and maintain session identifiers in the browser.

**Benefits**
- Reduces the need for server-side session state.
- Simplifies association of events across page navigation.
- Supports a consistent inactivity policy.

**Trade-offs**

Browser storage restrictions, cleared storage, privacy settings, and cross-device activity can affect session continuity. A 30-minute inactivity threshold is a design choice rather than a universal standard.

### 2. Pixel and Percentage Coordinates

**Decision:** Record both absolute coordinates and normalized percentages.

**Benefits**
- Pixel coordinates preserve the original viewport-relative measurements.
- Percentages allow responsive heatmap positioning.
- Both representations are useful for analysis and debugging.

**Trade-offs**

Viewport percentages do not fully account for document scrolling, page layout shifts, content changes, or differing element positions. More precise replay may require document coordinates, scroll offsets, viewport metadata, and element identifiers.

### 3. Asynchronous Event Delivery

**Decision:** Use `navigator.sendBeacon` with a `fetch` keepalive fallback.

**Benefits**
- Avoids blocking the main interaction flow with synchronous requests.
- Improves the likelihood of delivery during page navigation or shutdown.
- Supports lightweight event transmission.

**Trade-offs**

Delivery is not guaranteed. Payload limits, network failures, browser restrictions, and server errors can still result in lost events. More demanding deployments may require durable local queues, retries, idempotency keys, and ingestion monitoring.

### 4. Event Batching

**Decision:** Buffer events and flush them periodically or when the batch reaches a configured size.

**Benefits**
- Reduces individual network request overhead.
- Helps control request volume during rapid interactions.
- Separates event collection from transmission timing.

**Trade-offs**

Batching introduces a short ingestion delay and may lose queued events if the page closes unexpectedly before delivery.

### 5. Database-Level Aggregation

**Decision:** Use MongoDB aggregation pipelines for session summaries and analytics.

**Benefits**
- Avoids loading all events into application memory for basic summaries.
- Uses database-side filtering and grouping.
- Supports indexed query patterns.

**Trade-offs**

Performance depends on data volume, index selection, pipeline structure, and concurrency. Query plans and latency should be measured against realistic datasets.

### 6. Minimal Tracking Dependencies

**Decision:** Implement browser tracking with vanilla JavaScript.

**Benefits**
- Keeps the tracking payload lightweight.
- Avoids coupling the tracker to a specific frontend framework.
- Supports embedding on conventional multi-page websites.

**Trade-offs**

Framework-independent tracking requires careful handling of navigation, event listeners, storage, cross-origin requests, and browser compatibility.

### 7. Separation of Responsibilities

**Decision:** Separate the tracker, backend, database, and dashboard.

**Benefits**
- Gives each layer a clearly defined responsibility.
- Allows the API to serve analytics clients independently of the demo storefront.
- Makes individual components easier to maintain and extend.

**Trade-offs**

Separate services introduce configuration, startup ordering, networking, and integration-testing requirements.

---

## 📂 Project Structure

The following is a logical overview of the documented components. Update it to match the actual repository layout.

```text
TraceFlow/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── ...                  # API, models, routes, and tests
│
├── frontend/
│   ├── package.json
│   └── ...                  # React dashboard and styles
│
├── demo/
│   └── ...                  # Aura Wear storefront
│
├── docker-compose.yml       # Or docker-compose.yaml
├── package.json             # Root scripts, if configured
└── README.md
```

The project also includes a browser tracking script served through `/tracker.js`. Confirm its source location against the backend configuration.

---

## 🔧 Troubleshooting

### MongoDB Connection Failure

- Verify that MongoDB is running.
- Check `MONGODB_URI` in the backend environment.
- Confirm that the configured port is accessible.
- For Atlas, verify network access and database credentials.
- Inspect backend logs for connection errors.

### Dashboard Shows No Sessions

- Start the backend and demo storefront.
- Browse the store to generate pageviews and clicks.
- Inspect the browser Network panel for `POST /api/events`.
- Confirm that the backend accepts events and MongoDB persists them.
- Check that the dashboard is using the correct API URL.

### Click Heatmap Is Empty

- Generate click events on the selected page.
- Select the correct tracked URL in the dashboard.
- Confirm that the requests contain valid click coordinates.
- Check whether query strings, trailing slashes, or path normalization affect URL matching.
- Verify the response from `/api/analytics/clicks`.

### Port Already in Use

If a port is occupied, stop the conflicting process or update the corresponding service configuration and dependent URLs.

### npm Script Not Found

Inspect the relevant `package.json` file and use the script names defined in the checked-out version of the project.

---

## 🛣️ Future Improvements

Potential extensions for a production-oriented version include:

- **Session Replay:** Reconstruct interactions using scroll positions, navigation events, and element context.
- **Funnel Analytics:** Measure conversion between product views, cart actions, and checkout.
- **Retention Analysis:** Track returning sessions over time.
- **Event Reliability:** Add durable client queues, retries, idempotency, and ingestion monitoring.
- **Privacy Controls:** Implement consent management, configurable data retention, and sensitive-field redaction.
- **Advanced Heatmaps:** Support document coordinates, scroll depth, and layout-aware visualization.
- **Performance Monitoring:** Track API latency, ingestion throughput, and aggregation costs.
- **Scalable Ingestion:** Introduce queue-based processing and background workers when event volume justifies the added complexity.
- **Automated CI:** Run tests and quality checks on every change.
- **Deployment:** Document production configuration, environment variables, and deployment procedures.

These are potential directions for future development, not claims about existing functionality.

---

## 👨‍💻 Author

**Vivaan Garg**

GitHub: [@vivaangarg2005](https://github.com/vivaangarg2005)

Project repository: [TraceFlow Analytics](https://github.com/vivaangarg2005/TraceFlow)

---

## 📄 License

This project is intended to be distributed under the MIT License, as indicated by the existing repository badge.

See the [`LICENSE`](LICENSE) file for the complete license terms.

---

<p align="center">
  <strong>TraceFlow Analytics</strong>
  <br />
  <sub>From raw interactions to actionable behavioral insights.</sub>
</p>
