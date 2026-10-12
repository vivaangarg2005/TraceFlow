/**
 * TraceFlow Client Tracking Script (tracker.js)
 * 
 * Lightweight, zero-dependency analytics tracker designed for modern e-commerce.
 * Captures user interactions (page views and clicks with coordinates) and dispatches
 * them to the TraceFlow backend API.
 * 
 * Features:
 * - Persistent session management (localStorage with fallback to cookies)
 * - Automatic 30-minute session expiry / renewal
 * - Automatic page_view capture on load and SPA route changes (popstate/pushState)
 * - Click tracking with exact page coordinates (x, y) and viewport percentages (xPercent, yPercent)
 * - DOM element context capture (tag, id, text, classes) for heatmap breakdown
 * - Non-blocking dispatch via navigator.sendBeacon & fetch keepalive
 * - Configurable via <script data-endpoint="..."> or TraceFlow.init()
 */

(function (window, document) {
  'use strict';

  // Prevent duplicate tracker initialization
  if (window.__TRACEFLOW_LOADED__) {
    return;
  }
  window.__TRACEFLOW_LOADED__ = true;

  // Configuration Defaults
  var config = {
    endpoint: 'http://localhost:5000/api/events',
    sessionKey: 'traceflow_session_id',
    sessionExpiryKey: 'traceflow_session_expiry',
    sessionDurationMs: 30 * 60 * 1000, // 30 minutes inactivity window
    debug: false,
    batchIntervalMs: 1500, // Debounce/batch event dispatching
  };

  // Inspect the script tag to auto-detect endpoint from data-endpoint attribute
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  if (currentScript) {
    var customEndpoint = currentScript.getAttribute('data-endpoint');
    if (customEndpoint) {
      config.endpoint = customEndpoint;
    }
    if (currentScript.getAttribute('data-debug') === 'true') {
      config.debug = true;
    }
  }

  // Event dispatch queue for batching
  var eventQueue = [];
  var dispatchTimer = null;

  /**
   * Log messages in debug mode
   */
  function log() {
    if (config.debug && window.console && window.console.log) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[TraceFlow]');
      console.log.apply(console, args);
    }
  }

  /**
   * Generate a unique Session ID (UUID v4 format)
   */
  function generateUUID() {
    if (window.crypto && window.crypto.randomUUID) {
      return 'tf_' + window.crypto.randomUUID();
    }
    return (
      'tf_' +
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
    );
  }

  /**
   * Cookie helpers as fallback if localStorage is disabled
   */
  function setCookie(name, value, maxAgeSeconds) {
    try {
      document.cookie =
        name +
        '=' +
        encodeURIComponent(value) +
        '; path=/; max-age=' +
        maxAgeSeconds +
        '; SameSite=Lax';
    } catch (e) {
      log('Cookie set failed:', e);
    }
  }

  function getCookie(name) {
    try {
      var matches = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
      );
      return matches ? decodeURIComponent(matches[1]) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get or create active session ID with inactivity timeout
   */
  function getSessionId() {
    var now = Date.now();
    var sessionId = null;
    var expiry = null;

    // Try localStorage
    try {
      sessionId = localStorage.getItem(config.sessionKey);
      expiry = parseInt(localStorage.getItem(config.sessionExpiryKey) || '0', 10);
    } catch (e) {
      // Fallback to cookie
      sessionId = getCookie(config.sessionKey);
      expiry = parseInt(getCookie(config.sessionExpiryKey) || '0', 10);
    }

    // Check if session exists and is still valid
    if (sessionId && expiry && now < expiry) {
      // Extend session expiry
      refreshSessionExpiry();
      return sessionId;
    }

    // Otherwise, generate a new session
    sessionId = generateUUID();
    log('Created new session:', sessionId);

    try {
      localStorage.setItem(config.sessionKey, sessionId);
      localStorage.setItem(config.sessionExpiryKey, (now + config.sessionDurationMs).toString());
    } catch (e) {
      setCookie(config.sessionKey, sessionId, config.sessionDurationMs / 1000);
      setCookie(config.sessionExpiryKey, (now + config.sessionDurationMs).toString(), config.sessionDurationMs / 1000);
    }

    return sessionId;
  }

  /**
   * Update session expiry timestamp upon active user interaction
   */
  function refreshSessionExpiry() {
    var newExpiry = Date.now() + config.sessionDurationMs;
    try {
      localStorage.setItem(config.sessionExpiryKey, newExpiry.toString());
    } catch (e) {
      setCookie(config.sessionExpiryKey, newExpiry.toString(), config.sessionDurationMs / 1000);
    }
  }

  /**
   * Send queued events to the backend API
   */
  function flushQueue() {
    if (eventQueue.length === 0) return;

    var payload = eventQueue.slice();
    eventQueue = [];

    var jsonString = JSON.stringify(payload);
    log('Flushing events count:', payload.length, payload);

    // 1. Try navigator.sendBeacon (ideal for async non-blocking delivery and page unloads)
    var beaconSent = false;
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([jsonString], { type: 'text/plain;charset=UTF-8' });
        beaconSent = navigator.sendBeacon(config.endpoint, blob);
      } catch (e) {
        beaconSent = false;
      }
    }

    // 2. Fallback to fetch with keepalive if beacon was not supported or returned false
    if (!beaconSent && window.fetch) {
      fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
        keepalive: true,
      }).catch(function (err) {
        log('Error dispatching events:', err);
      });
    } else if (!beaconSent) {
      // 3. Fallback to XMLHttpRequest
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', config.endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(jsonString);
      } catch (err) {
        log('XHR fallback error:', err);
      }
    }
  }

  /**
   * Enqueue an event and schedule batch dispatch
   */
  function enqueueEvent(eventData) {
    eventQueue.push(eventData);

    // Also dispatch a browser custom event for local UI updates or debugging
    try {
      window.dispatchEvent(new CustomEvent('traceflow:event', { detail: eventData }));
    } catch (e) {}

    // Flush immediately if queue reaches 5 events or on timer
    if (eventQueue.length >= 5) {
      if (dispatchTimer) clearTimeout(dispatchTimer);
      flushQueue();
    } else {
      if (!dispatchTimer) {
        dispatchTimer = setTimeout(function () {
          dispatchTimer = null;
          flushQueue();
        }, config.batchIntervalMs);
      }
    }
  }

  /**
   * Track a Page View event
   */
  function trackPageView(customUrl) {
    var sessionId = getSessionId();
    var currentUrl = customUrl || window.location.href;

    var event = {
      sessionId: sessionId,
      eventType: 'page_view',
      url: currentUrl,
      path: window.location.pathname,
      title: document.title || '',
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth || document.documentElement.clientWidth || 0,
      viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0,
      metadata: {
        referrer: document.referrer || '',
        userAgent: navigator.userAgent || '',
        screenResolution: window.screen.width + 'x' + window.screen.height,
        language: navigator.language || '',
      },
    };

    log('Page view captured:', event);
    enqueueEvent(event);
  }

  /**
   * Track a Click event
   */
  function trackClick(e) {
    if (!e) return;

    var sessionId = getSessionId();

    // Calculate document-relative coordinates (x, y)
    var pageX = typeof e.pageX === 'number' ? e.pageX : e.clientX + (window.scrollX || window.pageXOffset || 0);
    var pageY = typeof e.pageY === 'number' ? e.pageY : e.clientY + (window.scrollY || window.pageYOffset || 0);

    // Calculate viewport dimensions
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

    // Normalized percentage coordinates (0 - 100%) for responsive heatmap overlay
    var xPercent = Math.min(100, Math.max(0, Number(((pageX / viewportWidth) * 100).toFixed(2))));
    var yPercent = Math.min(100, Math.max(0, Number(((pageY / viewportHeight) * 100).toFixed(2))));

    // Extract target DOM element context
    var target = e.target;
    var elementTag = target && target.tagName ? target.tagName.toUpperCase() : '';
    var elementId = target && target.id ? target.id : '';
    var elementText = '';

    if (target) {
      var rawText = target.innerText || target.textContent || target.value || target.alt || '';
      elementText = rawText.trim().replace(/\s+/g, ' ').slice(0, 100);
    }

    var event = {
      sessionId: sessionId,
      eventType: 'click',
      url: window.location.href,
      path: window.location.pathname,
      title: document.title || '',
      timestamp: new Date().toISOString(),
      x: Math.round(pageX),
      y: Math.round(pageY),
      xPercent: xPercent,
      yPercent: yPercent,
      viewportWidth: viewportWidth,
      viewportHeight: viewportHeight,
      elementTag: elementTag,
      elementId: elementId,
      elementText: elementText,
      metadata: {
        button: e.button,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
      },
    };

    log('Click captured:', event);
    enqueueEvent(event);
  }

  /**
   * Initialize Tracking Listeners
   */
  function initTracker() {
    // 1. Initial Page View
    trackPageView();

    // 2. Global Click Capture (Capture phase to catch clicks on nested elements)
    document.addEventListener('click', trackClick, true);

    // 3. SPA Route Change Listeners
    window.addEventListener('popstate', function () {
      trackPageView();
    });

    // Monkey-patch history.pushState and history.replaceState for SPA frameworks
    var originalPushState = window.history.pushState;
    if (typeof originalPushState === 'function') {
      window.history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(function () {
          trackPageView();
        }, 50);
      };
    }

    var originalReplaceState = window.history.replaceState;
    if (typeof originalReplaceState === 'function') {
      window.history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        setTimeout(function () {
          trackPageView();
        }, 50);
      };
    }

    // 4. Ensure remaining events flush when user closes tab or navigates away
    window.addEventListener('beforeunload', function () {
      flushQueue();
    });

    window.addEventListener('pagehide', function () {
      flushQueue();
    });

    log('TraceFlow initialized successfully. Active Session:', getSessionId());
  }

  // Public API exposed to window.TraceFlow
  window.TraceFlow = {
    version: '1.0.0',
    init: function (opts) {
      if (opts) {
        if (opts.endpoint) config.endpoint = opts.endpoint;
        if (opts.debug !== undefined) config.debug = opts.debug;
        if (opts.sessionDurationMs) config.sessionDurationMs = opts.sessionDurationMs;
      }
      return this;
    },
    trackPageView: trackPageView,
    trackClick: trackClick,
    flush: flushQueue,
    getSessionId: getSessionId,
    getConfig: function () {
      return Object.assign({}, config);
    },
  };

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }
})(window, document);
