/**
 * TraceFlow Frontend API Service
 * Centralized HTTP communication with backend analytics endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Serialize query parameters safely
 */
function toQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

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
 * Fetch high-level summary overview metrics with date & simulation filters
 */
export async function getOverview(params = {}) {
  return request(`/analytics/overview${toQueryString(params)}`);
}

/**
 * Fetch list of tracked sessions with pagination, sorting, search, and filters
 */
export async function getSessions(params = {}) {
  const defaults = { page: 1, limit: 50 };
  const query = { ...defaults, ...params };
  return request(`/sessions${toQueryString(query)}`);
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
export async function getTrackedPages(params = {}) {
  return request(`/analytics/pages${toQueryString(params)}`);
}

/**
 * Fetch click coordinates for a given page URL with device & time filtering
 */
export async function getPageClicks(params = {}) {
  // Can pass url directly or params object
  if (typeof params === 'string') {
    params = { url: params };
  }
  return request(`/analytics/clicks${toQueryString(params)}`);
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
