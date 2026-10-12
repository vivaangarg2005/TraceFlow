# 🚀 TraceFlow Analytics

**A Full-Stack User Interaction Tracking & Behavioral Analytics Platform**

TraceFlow is an end-to-end behavioral analytics platform that captures user interactions, reconstructs browsing sessions, and visualizes click behavior through interactive heatmaps and user journey timelines.

Built as part of the **CausalFunnel Full Stack Engineer Evaluation** by **Vivaan Garg**.

<p align="center">
  <a href="https://github.com/vivaangarg2005/TraceFlow">
    <img src="https://img.shields.io/badge/Project-TraceFlow-6366f1?style=for-the-badge" alt="TraceFlow Project" />
  </a>
  <img src="https://img.shields.io/badge/Tests-10%2F10%20Passing-22c55e?style=for-the-badge" alt="10 out of 10 tests passing" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 18 or higher" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB 7" />
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
- [Database Design](#-database-design)
- [Testing](#-testing)
- [Engineering Decisions](#-engineering-decisions)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Future Improvements](#-future-improvements)
- [Author](#-author)
- [License](#-license)

---

## 📌 Overview

TraceFlow is a full-stack analytics application inspired by behavioral analytics systems used in modern e-commerce platforms.

It captures client-side events, associates them with browsing sessions, stores them in MongoDB, and exposes analytics through a REST API and a React dashboard.

The project includes **Aura Wear**, an interactive demo storefront that simulates an e-commerce customer journey, from browsing products to adding items to a cart and proceeding through checkout.

### The Problem

Understanding how users interact with a website requires more than counting pageviews. Product teams need to know:

- Which pages users visit and in what order.
- Where users click and which interface elements attract attention.
- How users navigate between pages during a session.
- Which pages and elements receive the most interactions.
- How interaction patterns differ across viewport sizes.

### The Solution

TraceFlow combines lightweight browser instrumentation, event ingestion, database aggregation, and interactive visualization into one cohesive application.

The result is a locally runnable analytics platform with a real demo storefront, a tracking script, a backend API, and a dashboard for exploring collected behavioral data.

---

## ✨ Key Features

### ⚡ Lightweight Client-Side Tracking

- Dependency-free JavaScript tracking script.
- Automatic `page_view` event capture.
- Click tracking with viewport-relative and pixel coordinates.
- DOM context collection, including element tag, ID, and text.
- Client-generated session identifiers.
- Session renewal after 30 minutes of inactivity.
- Asynchronous event delivery using `navigator.sendBeacon` with a `fetch` keepalive fallback.
- Batched event transmission to reduce request overhead.

### 📊 Interactive Analytics Dashboard

**Sessions Explorer**
- Browse recorded sessions.
- View event counts, pageviews, clicks, and session duration.
- Explore chronological user journeys.
- Inspect event timestamps, URLs, and click coordinates.

**Click Heatmaps**
- Radial glow visualization for click density.
- 10 × 10 density grid for spatial analysis.
- Element-level click pins with contextual tooltips.
- Store wireframe overlay for visual orientation.
- Page selection based on tracked URLs.

**Overview Metrics**
- High-level activity metrics.
- Tracked-page summaries.
- Click and pageview breakdowns.
- Insights derived from collected interaction events.

### 🛍️ Interactive E-Commerce Demo

The included Aura Wear storefront provides a realistic environment for testing tracking behavior.

- Product catalog and promotional banner.
- Product details and sizing interactions.
- Cart interactions.
- Checkout flow.
- Multi-page navigation for session reconstruction.
- Real-time tracking HUD for observing tracking activity during testing.

### 🚀 Backend & Data Processing

- RESTful API built with Node.js and Express.
- Single-event and batch-event ingestion.
- Event validation.
- Session aggregation using MongoDB aggregation pipelines.
- Chronological event retrieval.
- Click analytics and tracked-page discovery.
- Compound database indexes for common query patterns.

### 🧪 Automated Testing

- Native Node.js test runner using `node:test`.
- Assertions using `node:assert`.
- Integration coverage for the core API endpoints.
- Validation of malformed events and missing click coordinates.
- Coverage of session aggregation and analytics retrieval.

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
                         │
┌────────────────────────┴─────────────────────────────────┐
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
3. Pageviews and user clicks are converted into structured events.
4. Events are batched and transmitted to the backend.
5. Express validates and persists accepted events in MongoDB.
6. Aggregation pipelines calculate session-level and page-level metrics.
7. The React dashboard requests the resulting data and renders timelines, metrics, and heatmaps.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Tracking | Vanilla JavaScript | Lightweight browser instrumentation |
| Backend | Node.js 18+ | Server-side JavaScript runtime |
| API | Express 4.x | REST endpoints and event ingestion |
| Database | MongoDB 7 | Persistent event storage |
| ODM | Mongoose 8.x | Document schemas and database access |
| Frontend | React 19 | Interactive analytics dashboard |
| Build Tool | Vite | Development server and frontend bundling |
| Styling | Vanilla CSS | Custom dark theme and responsive UI |
| Containers | Docker Compose | Reproducible MongoDB setup |
| Testing | `node:test` | Native Node.js test execution |

---

## 🚀 Getting Started

Follow these steps to run TraceFlow locally.

### Prerequisites

Ensure the following tools are installed:

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

**Option A — Docker Compose (recommended)**

From the project root, run:

```bash
docker compose up -d
```

This starts the MongoDB service defined in the project's Compose configuration.

The default local MongoDB connection string is typically:

```env
mongodb://127.0.0.1:27017/traceflow
```

Use the actual connection settings defined in your project if they differ.

**Option B — MongoDB Atlas**

1. Create a MongoDB Atlas cluster.
2. Configure database access and network permissions.
3. Copy the database connection string.
4. Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

5. Update `MONGODB_URI` in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/traceflow?retryWrites=true&w=majority
```

Replace the placeholders with your actual credentials and cluster hostname. Do not commit `.env` files or database credentials to Git.

### 3. Install Dependencies

If the repository root defines the documented `install:all` script, run:

```bash
npm run install:all
```

Alternatively, install dependencies separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Return to the project root before running root-level scripts.

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

Keep all three processes running while testing the application.

> **Note:** The commands above reflect the project's documented npm scripts. If a command is unavailable, check the root and package-level `package.json` files for the actual script names.

### 5. Verify the Installation

Open the backend health endpoint:

```text
http://localhost:5000/api/health
```

Then open the following applications:

- Dashboard: `http://localhost:5173`
- Demo store: `http://localhost:3000`

Navigate through the storefront, click product and cart elements, and proceed through the checkout flow. Return to the dashboard to inspect the collected sessions and interactions.

For reliable results, confirm that MongoDB is connected and that the browser's Network panel shows successful requests to the event ingestion endpoint.

---

## 🌐 Application URLs

| Service | URL | Description |
|---|---|---|
| Analytics Dashboard | [localhost:5173](http://localhost:5173) | Session explorer, metrics, and heatmaps |
| Aura Wear Store | [localhost:3000](http://localhost:3000) | Interactive storefront for generating events |
| Backend Health | [localhost:5000/api/health](http://localhost:5000/api/health) | API health check |
| Tracking Script | [localhost:5000/tracker.js](http://localhost:5000/tracker.js) | Browser tracking script |
| MongoDB | `localhost:27017` | Local database, when exposed by the Compose configuration |

These URLs assume the default local ports and a successful startup.

---

## 🔄 How It Works

### 1. Event Tracking

The tracking script captures supported user interactions and sends structured event documents to the backend.

**Pageview event**

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

**Click event**

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

These payloads illustrate the documented event format; they are examples, not records from a live session.

### 2. Session Management

The tracker uses a client-generated session identifier to associate events with a browsing session.

The documented lifecycle is:

- Reuse the existing session while it remains valid.
- Track inactivity using a 30-minute window.
- Generate a new session after the inactivity threshold is exceeded.

The implementation uses browser storage with a cookie fallback, as described in the project design.

### 3. Event Transmission

To reduce overhead and improve delivery during navigation:

- Events are placed into a client-side queue.
- The queue is flushed periodically.
- The queue is also flushed when it reaches the configured batch threshold.
- `navigator.sendBeacon` is used where appropriate.
- `fetch` with `keepalive: true` provides a fallback.

The documented batching configuration uses a 1.5-second interval or a queue size of five events.

Asynchronous delivery reduces interference with the user interface, but it does not guarantee delivery in every browser, network, or shutdown scenario.

### 4. Coordinate Normalization

TraceFlow records both absolute and viewport-relative click coordinates.

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

The backend exposes aggregated session and page data, while the dashboard uses those responses to render:

- Session summaries and activity counts.
- Chronological user journeys.
- Click density overlays.
- Element-level click details.
- Tracked-page analytics.

This separation keeps event collection, persistence, aggregation, and visualization independently organized.

---

## 📡 API Reference

The following endpoints describe the documented TraceFlow API.

### Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check API health |
| `GET` | `/tracker.js` | Serve the client tracking script |
| `POST` | `/api/events` | Ingest a single event or batch |
| `GET` | `/api/sessions` | Retrieve paginated session summaries |
| `GET` | `/api/sessions/:sessionId/events` | Retrieve a session's event timeline |
| `GET` | `/api/analytics/clicks` | Retrieve click data for heatmaps |
| `GET` | `/api/analytics/pages` | List tracked pages and their activity |
| `GET` | `/api/analytics/overview` | Retrieve overview metrics |

### 1. Ingest Events

**`POST /api/events`**

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

For click events, provide the required coordinate fields and other fields expected by the backend schema.

### 2. Retrieve Sessions

**`GET /api/sessions?page=1&limit=50`**

Returns paginated session summaries, including the documented event counts, pageviews, clicks, and duration.

Example:

```bash
curl "http://localhost:5000/api/sessions?page=1&limit=50"
```

### 3. Retrieve a User Journey

**`GET /api/sessions/:sessionId/events`**

Returns the events associated with a specified session in chronological order.

Example:

```bash
curl "http://localhost:5000/api/sessions/tf_example-session-id/events"
```

### 4. Retrieve Click Heatmap Data

**`GET /api/analytics/clicks?url=...`**

Retrieves click coordinates and DOM context for the requested page.

Example:

```bash
curl -G "http://localhost:5000/api/analytics/clicks" \
  --data-urlencode "url=http://localhost:3000/index.html"
```

The exact response fields and URL matching behavior depend on the backend implementation.

### 5. Retrieve Tracked Pages

**`GET /api/analytics/pages`**

Returns the distinct tracked pages and their associated activity counts for dashboard page selection.

```bash
curl http://localhost:5000/api/analytics/pages
```

### 6. Retrieve Overview Metrics

**`GET /api/analytics/overview`**

Returns high-level analytics metrics used by the dashboard.

```bash
curl http://localhost:5000/api/analytics/overview
```

> **API note:** Example commands illustrate how to call the documented endpoints. Response schemas, error codes, authentication requirements, and exact validation rules should be taken from the implementation.

---

## 🗄️ Database Design

MongoDB stores interaction events as documents, allowing pageviews and clicks to share common fields while retaining event-specific attributes.

### Event Data Model

The documented event payloads include:

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

Their intended use is:

- **Session and timestamp:** efficient retrieval of a session's events in chronological order.
- **URL and event type:** filtering page activity by event category.
- **Path and event type:** querying activity grouped by normalized page path.

Index usefulness depends on actual query predicates, sorting, cardinality, and data volume. Indexes should be validated against representative workloads using MongoDB's query explain plans.

### Aggregation

MongoDB aggregation pipelines are used to calculate session and analytics summaries without requiring the application to load every event into memory.

The documented design uses operations such as:

- `$group` for grouping events and calculating session-level metrics.
- `$min` and `$max` for temporal boundaries.
- `$facet` for combining multiple aggregation outputs where appropriate.

This approach keeps common analytics calculations close to the data.

---

## 🧪 Testing

TraceFlow uses Node.js's built-in test runner, `node:test`, with assertions from `node:assert`.

Run the test suite from the project root:

```bash
npm test
```

The repository documentation reports the following ten test cases as passing.

| # | Test | Expected behavior |
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

The results above reflect the project's supplied test report. Run `npm test` to verify the current checkout and environment.

---

## 🧠 Engineering Decisions & Trade-offs

### 1. Client-Managed Session Lifecycle

**Decision:** Generate and maintain session identifiers in the browser.

**Rationale:**
- Reduces the need for server-side session state.
- Simplifies association of events across page navigation.
- Supports a consistent inactivity policy.

**Trade-off:** Browser storage restrictions, privacy settings, cleared storage, and cross-device activity can affect session continuity. A 30-minute inactivity threshold is a product decision, not a universal analytics standard.

### 2. Pixel and Percentage Coordinates

**Decision:** Record both absolute coordinates and normalized percentages.

**Rationale:**
- Pixel coordinates preserve the original viewport-relative measurements.
- Percentages allow responsive heatmap positioning.
- Both formats are useful for debugging and analysis.

**Trade-off:** Viewport percentages do not fully account for document scrolling, page layout shifts, content changes, or differing element positions. More precise replay may require document coordinates, scroll offsets, viewport metadata, and element identifiers.

### 3. Asynchronous Event Delivery

**Decision:** Use `navigator.sendBeacon` with a `fetch` keepalive fallback.

**Rationale:**
- Avoids blocking the main interaction flow with synchronous network requests.
- Improves the likelihood of delivery during page navigation or shutdown.
- Supports lightweight event transmission.

**Trade-off:** Delivery is not guaranteed. Beacon payload limits, network failures, browser restrictions, and server errors can still result in lost events. High-reliability deployments may need durable local queues, retry policies, idempotency keys, and ingestion monitoring.

### 4. Event Batching

**Decision:** Buffer events and flush them periodically or when the batch reaches a configured size.

**Rationale:**
- Reduces the number of individual network requests.
- Helps control request overhead during rapid interactions.
- Separates event collection from transmission timing.

**Trade-off:** Batching introduces a small delay before ingestion and may lose queued events if the page closes unexpectedly before delivery.

### 5. Aggregation at the Database Layer

**Decision:** Use MongoDB aggregation pipelines for session summaries and analytics.

**Rationale:**
- Avoids loading large event collections into application memory for basic summaries.
- Uses database-side filtering and grouping.
- Supports compound-indexed access patterns.

**Trade-off:** Performance still depends on data volume, index selection, pipeline structure, and concurrency. Query plans and latency should be measured against realistic datasets.

### 6. Minimal Tracking Dependencies

**Decision:** Implement browser tracking with vanilla JavaScript.

**Rationale:**
- Keeps the tracking payload lightweight.
- Avoids coupling the tracker to a specific frontend framework.
- Makes embedding on conventional multi-page websites straightforward.

**Trade-off:** Framework-independent tracking requires careful handling of navigation, event listeners, storage, cross-origin requests, and browser compatibility.

### 7. Clear Separation of Responsibilities

**Decision:** Separate the tracker, backend, database, and dashboard.

**Rationale:**
- Each layer has a well-defined responsibility.
- The API can serve analytics clients independently of the demo store.
- Individual components can evolve without requiring a complete architectural rewrite.

**Trade-off:** Separate services introduce configuration, startup ordering, network, and integration-testing requirements.

---

## 📂 Project Structure

The following is a logical overview based on the documented components. Confirm exact filenames and directories against the repository.

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

The project includes a browser tracking script served through `/tracker.js`. Its source location should be confirmed from the backend configuration.

---

## 🔧 Troubleshooting

### MongoDB Connection Failure

- Verify that MongoDB is running.
- Check the `MONGODB_URI` value in the backend environment.
- Confirm that the selected port is accessible.
- For Atlas, verify network access and database credentials.
- Check backend logs for connection errors.

### Dashboard Shows No Sessions

- Start the backend and demo storefront.
- Browse the store to generate pageviews and clicks.
- Inspect the browser Network panel for `POST /api/events`.
- Confirm that the backend accepts the events and MongoDB persists them.
- Check that the dashboard is using the correct API URL.

### Click Heatmap Is Empty

- Generate click events on the relevant page.
- Select the correct tracked URL in the dashboard.
- Confirm that the click requests contain valid coordinates.
- Check whether URL query strings, trailing slashes, or path normalization affect matching.
- Verify the response from `/api/analytics/clicks`.

### Port Already in Use

If a port is occupied, stop the process using it or update the corresponding service configuration and its dependent URLs.

### npm Script Not Found

Inspect the relevant `package.json` file and use the script names actually defined in the checked-out version of the project.

---

## 🛣️ Future Improvements

Potential extensions for a production-oriented version include:

- **Session replay:** Reconstruct interactions with scroll positions, navigation, and element context.
- **Funnel analytics:** Measure conversion between product views, cart actions, and checkout.
- **Retention analysis:** Track returning sessions over time.
- **Event reliability:** Add durable client queues, retries, idempotency, and ingestion monitoring.
- **Privacy controls:** Add consent management, configurable data retention, and sensitive-field redaction.
- **Advanced heatmaps:** Support document coordinates, scroll depth, and responsive layout-aware visualization.
- **Performance monitoring:** Track API latency, ingestion throughput, and aggregation costs.
- **Scalable ingestion:** Introduce queue-based processing and background workers when event volume justifies the additional complexity.
- **Deployment:** Add automated CI checks, production configuration, and deployment documentation.

These are possible directions for future development, not claims about existing functionality.

---

## 👨‍💻 Author

**Vivaan Garg**

Full-stack engineering project developed for the CausalFunnel Full Stack Engineer evaluation.

- **Repository:** [github.com/vivaangarg2005/TraceFlow](https://github.com/vivaangarg2005/TraceFlow)

---

## 📄 License

This project is intended to be distributed under the MIT License, as indicated by the repository's existing license badge.

See the [`LICENSE`](LICENSE) file for the complete license terms.

---

<p align="center">
  <strong>TraceFlow Analytics</strong>
  <br />
  <sub>From raw interactions to actionable behavioral insights.</sub>
</p>
