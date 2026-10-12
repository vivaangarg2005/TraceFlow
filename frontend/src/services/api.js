/**
 * TraceFlow Frontend API Service
 * Centralized HTTP communication with backend analytics endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to handle HTTP responses safely
 */
async function request(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Fetch high-level summary overview metrics
 */
export async function getOverview() {
  return request('/analytics/overview');
}

/**
 * Fetch list of tracked sessions with pagination
 */
export async function getSessions(page = 1, limit = 50) {
  return request(`/sessions?page=${page}&limit=${limit}`);
}

/**
 * Fetch ordered chronological events for a specific session (User Journey)
 */
export async function getSessionEvents(sessionId) {
  return request(`/sessions/${encodeURIComponent(sessionId)}/events`);
}

/**
 * Fetch list of distinct tracked pages for Heatmap selector
 */
export async function getTrackedPages() {
  return request('/analytics/pages');
}

/**
 * Fetch click coordinates for a given page URL
 */
export async function getPageClicks(pageUrl) {
  return request(`/analytics/clicks?url=${encodeURIComponent(pageUrl)}`);
}

/**
 * Ingest events (batch or single)
 */
export async function trackEvents(events) {
  return request('/events', {
    method: 'POST',
    body: JSON.stringify(events),
  });
}
