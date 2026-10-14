/**
 * URL and Environment Helper for TraceFlow Frontend
 * Guarantees ZERO "localhost" leakage when running in production/cloud environments
 */

export function isHostedEnvironment() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

/**
 * Returns the base URL for the Aura demo store.
 * - On hosted environments (e.g. *.vercel.app): always returns ${window.location.origin}/demo
 *   (any VITE_DEMO_URL pointing to localhost is strictly rejected).
 * - On local development: returns http://localhost:3000 (or custom VITE_DEMO_URL).
 */
export function getDemoStoreBaseUrl() {
  const hosted = isHostedEnvironment();
  const envDemo = import.meta.env.VITE_DEMO_URL;

  if (hosted) {
    if (envDemo && !envDemo.includes('localhost') && !envDemo.includes('127.0.0.1')) {
      return envDemo.replace(/\/+$/, '');
    }
    // Hosted fallback: always serve bundled demo storefront directly from origin
    return `${window.location.origin}/demo`;
  }

  // Local development
  if (envDemo) {
    return envDemo.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * Full URL to demo store home page
 */
export function getDemoStoreHomeUrl() {
  return `${getDemoStoreBaseUrl()}/index.html`;
}

/**
 * Cleanly normalizes a page path or URL for display and iframe usage.
 * Strips out redundant localhost origins, cleans /demo duplicates, and produces
 * the exact target URL on the active environment.
 */
export function resolvePageUrl(inputUrlOrPath) {
  if (!inputUrlOrPath) return getDemoStoreHomeUrl();

  let pathWithQuery = String(inputUrlOrPath);
  try {
    if (pathWithQuery.startsWith('http://') || pathWithQuery.startsWith('https://')) {
      const parsed = new URL(pathWithQuery);
      pathWithQuery = (parsed.pathname || '/index.html') + (parsed.search || '');
    }
  } catch {
    pathWithQuery = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  }

  // Strip duplicate /demo prefix if present in pathname
  if (pathWithQuery.startsWith('/demo/')) {
    pathWithQuery = pathWithQuery.replace(/^\/demo/, '');
  }
  if (!pathWithQuery || pathWithQuery === '/') {
    pathWithQuery = '/index.html';
  }

  return `${getDemoStoreBaseUrl()}${pathWithQuery}`;
}
