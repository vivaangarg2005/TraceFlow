/**
 * TraceFlow Client Tracking Script (tracker.js)
 * 
 * Lightweight, zero-dependency analytics tracker designed for modern e-commerce.
 * Captures user interactions (page views and clicks with coordinates) and dispatches
 * them to the TraceFlow backend API.
 * 
 * Core Features & Privacy Guarantees:
 * - Persistent session management (localStorage with fallback to cookies, 30-min window)
 * - Automatic page_view capture on initial load and SPA route changes (popstate/pushState)
 * - Strict Privacy-First DOM scraping: Form inputs, passwords, emails, and sensitive values
 *   are NEVER collected or transmitted.
 * - Accurate coordinate semantics: distinguishes document-relative (x, y) across full page
 *   length from visible viewport-relative percentages (clientXPercent, clientYPercent).
 * - Records scroll position (scrollX, scrollY), document dimensions, and device classification.
 * - Resilient non-blocking transmission via navigator.sendBeacon with fetch keepalive fallback.
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
   * Detect Device Type based on viewport width
   */
  function getDeviceType() {
    var width = window.innerWidth || document.documentElement.clientWidth || 1024;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
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

    try {
      sessionId = localStorage.getItem(config.sessionKey);
      expiry = parseInt(localStorage.getItem(config.sessionExpiryKey) || '0', 10);
    } catch (e) {
      sessionId = getCookie(config.sessionKey);
      expiry = parseInt(getCookie(config.sessionExpiryKey) || '0', 10);
    }

    if (sessionId && expiry && now < expiry) {
      refreshSessionExpiry();
      return sessionId;
    }

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
   * Safe DOM Element Text Extraction with Strict Privacy Guarantees
   * NEVER captures passwords, typed input values, credit cards, or private content.
   */
  function getSafeElementText(target) {
    if (!target) return '';

    var tag = target.tagName ? target.tagName.toUpperCase() : '';

    // If element is an input, textarea, or select: NEVER read raw user input value!
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      var type = (target.type || '').toLowerCase();
      // Only read value if it's explicitly a button/submit label
      if (type === 'button' || type === 'submit' || type === 'reset') {
        return (target.value || '').trim().slice(0, 80);
      }
      // For text, password, email, number, credit card: mask it!
      var placeholder = target.placeholder ? '[' + target.placeholder + ']' : '';
      var ariaLabel = target.getAttribute('aria-label') ? '[' + target.getAttribute('aria-label') + ']' : '';
      var name = target.name || target.id ? '(' + (target.name || target.id) + ')' : '';
      return (ariaLabel || placeholder || name || '[Input Field]').slice(0, 80);
    }

    // Check for developer-defined privacy masking attribute
    if (target.hasAttribute('data-tf-mask') || target.hasAttribute('data-private')) {
      return '[Redacted Content]';
    }

    // Extract text content from button, link, heading, card, etc.
    var text = target.innerText || target.textContent || target.alt || target.title || '';
    var cleaned = text.trim().replace(/\s+/g, ' ');

    // Security check: Redact if text accidentally looks like an email or credit card number
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cleaned)) {
      cleaned = '[Email Redacted]';
    }
    if (/\b(?:\d[ -]*?){13,16}\b/.test(cleaned)) {
      cleaned = '[Card Number Redacted]';
    }

    return cleaned.slice(0, 100);
  }

  /**
   * Determine the page section/landmark where an element resides
   */
  function getElementSection(target) {
    if (!target || !target.closest) return 'main';

    try {
      if (target.closest('header, nav, #header, .header')) return 'header';
      if (target.closest('#hero, .hero, .hero-section')) return 'hero';
      if (target.closest('#cart, .cart-drawer, .cart-modal')) return 'cart';
      if (target.closest('#checkout, .checkout-section, form#checkout-form')) return 'checkout';
      if (target.closest('.product-grid, #products, .catalog')) return 'catalog';
      if (target.closest('.product-details, .product-layout')) return 'product-details';
      if (target.closest('footer, #footer, .footer')) return 'footer';
      if (target.closest('aside, .sidebar')) return 'sidebar';
    } catch (e) {}

    return 'main';
  }

  /**
   * Generate a concise CSS selector for debugging
   */
  function getElementSelector(target) {
    if (!target) return '';
    try {
      var parts = [];
      var curr = target;
      while (curr && curr.nodeType === Node.ELEMENT_NODE && parts.length < 3) {
        var part = curr.tagName.toLowerCase();
        if (curr.id) {
          part += '#' + curr.id;
          parts.unshift(part);
          break;
        } else if (curr.className && typeof curr.className === 'string') {
          var firstClass = curr.className.trim().split(/\s+/)[0];
          if (firstClass) part += '.' + firstClass;
        }
        parts.unshift(part);
        curr = curr.parentElement;
      }
      return parts.join(' > ');
    } catch (e) {
      return target.tagName ? target.tagName.toLowerCase() : '';
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

    // 1. Try navigator.sendBeacon
    var beaconSent = false;
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([jsonString], { type: 'text/plain;charset=UTF-8' });
        beaconSent = navigator.sendBeacon(config.endpoint, blob);
      } catch (e) {
        beaconSent = false;
      }
    }

    // 2. Fallback to fetch with keepalive
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

    try {
      window.dispatchEvent(new CustomEvent('traceflow:event', { detail: eventData }));
    } catch (e) {}

    // If running in an iframe (e.g. inside TraceFlow Heatmap preview), notify parent in real time
    if (window.self !== window.top) {
      try {
        window.parent.postMessage({ type: 'TRACEFLOW_EVENT_RECORDED', event: eventData }, '*');
      } catch (e) {}
    }

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

    var docWidth = Math.max(
      document.documentElement ? document.documentElement.scrollWidth : 0,
      document.body ? document.body.scrollWidth : 0,
      window.innerWidth || 1
    );
    var docHeight = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0,
      window.innerHeight || 1
    );

    var event = {
      sessionId: sessionId,
      eventType: 'page_view',
      url: currentUrl,
      path: (window.location.pathname || '/') + (window.location.search || ''),
      title: document.title || '',
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth || document.documentElement.clientWidth || 0,
      viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0,
      documentWidth: Math.round(docWidth),
      documentHeight: Math.round(docHeight),
      scrollX: Math.round(window.scrollX || window.pageXOffset || 0),
      scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
      deviceType: getDeviceType(),
      isSimulated: false,
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
   * Track a Click event with accurate document coordinates and privacy safeguards
   */
  function trackClick(e) {
    if (!e) return;

    var sessionId = getSessionId();

    // Document-relative coordinates (x, y)
    var pageX = typeof e.pageX === 'number' ? e.pageX : e.clientX + (window.scrollX || window.pageXOffset || 0);
    var pageY = typeof e.pageY === 'number' ? e.pageY : e.clientY + (window.scrollY || window.pageYOffset || 0);

    // Viewport dimensions
    var vpWidth = window.innerWidth || document.documentElement.clientWidth || 1;
    var vpHeight = window.innerHeight || document.documentElement.clientHeight || 1;

    // Full document dimensions
    var docWidth = Math.max(
      document.documentElement ? document.documentElement.scrollWidth : 0,
      document.body ? document.body.scrollWidth : 0,
      vpWidth
    );
    var docHeight = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0,
      vpHeight
    );

    // Document-relative percentage (true spatial position across entire scrollable page)
    var docXPercent = Math.min(100, Math.max(0, Number(((pageX / docWidth) * 100).toFixed(2))));
    var docYPercent = Math.min(100, Math.max(0, Number(((pageY / docHeight) * 100).toFixed(2))));

    // Viewport-relative percentage (position on visible screen at time of click)
    var clientXPercent = Math.min(100, Math.max(0, Number(((e.clientX / vpWidth) * 100).toFixed(2))));
    var clientYPercent = Math.min(100, Math.max(0, Number(((e.clientY / vpHeight) * 100).toFixed(2))));

    var target = e.target;
    var elementTag = target && target.tagName ? target.tagName.toUpperCase() : '';
    var elementId = target && target.id ? target.id : '';
    var elementText = getSafeElementText(target);
    var elementSection = getElementSection(target);
    var elementSelector = getElementSelector(target);

    var event = {
      sessionId: sessionId,
      eventType: 'click',
      url: window.location.href,
      path: (window.location.pathname || '/') + (window.location.search || ''),
      title: document.title || '',
      timestamp: new Date().toISOString(),
      x: Math.round(pageX),
      y: Math.round(pageY),
      xPercent: docXPercent,
      yPercent: docYPercent,
      clientXPercent: clientXPercent,
      clientYPercent: clientYPercent,
      viewportWidth: vpWidth,
      viewportHeight: vpHeight,
      documentWidth: Math.round(docWidth),
      documentHeight: Math.round(docHeight),
      scrollX: Math.round(window.scrollX || window.pageXOffset || 0),
      scrollY: Math.round(window.scrollY || window.pageYOffset || 0),
      elementTag: elementTag,
      elementId: elementId,
      elementText: elementText,
      elementSection: elementSection,
      elementSelector: elementSelector,
      deviceType: getDeviceType(),
      isSimulated: false,
      metadata: {
        button: e.button,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
      },
    };

    log('Click captured safely:', event);
    enqueueEvent(event);
  }

  /**
   * Initialize Tracking Listeners
   */
  function initTracker() {
    // 1. Initial Page View
    trackPageView();

    // 2. Global Click Capture (Capture phase)
    document.addEventListener('click', trackClick, true);

    // 3. SPA Route Change Listeners
    window.addEventListener('popstate', function () {
      trackPageView();
    });

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

    // 4. Ensure remaining events flush on tab close/unload
    window.addEventListener('beforeunload', function () {
      flushQueue();
    });

    window.addEventListener('pagehide', function () {
      flushQueue();
    });

    // 5. If embedded in iframe (e.g. inside TraceFlow Heatmap preview), report scroll position
    if (window.self !== window.top) {
      var lastReportedScroll = -1;
      function reportScroll() {
        var sY = window.scrollY || window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0;
        if (sY !== lastReportedScroll) {
          lastReportedScroll = sY;
          try {
            window.parent.postMessage({
              type: 'TRACEFLOW_SCROLL',
              scrollY: sY,
              docHeight: Math.max(
                document.documentElement ? document.documentElement.scrollHeight : 0,
                document.body ? document.body.scrollHeight : 0,
                window.innerHeight || 0
              ),
            }, '*');
          } catch (e) {}
        }
      }
      window.addEventListener('scroll', reportScroll, { passive: true });
      reportScroll();

      // Report current loaded page and dimensions to parent dashboard
      try {
        window.parent.postMessage({
          type: 'TRACEFLOW_IFRAME_LOADED',
          url: window.location.href,
          path: (window.location.pathname || '/') + (window.location.search || ''),
          docHeight: Math.max(
            document.documentElement ? document.documentElement.scrollHeight : 0,
            document.body ? document.body.scrollHeight : 0,
            window.innerHeight || 0
          ),
          docWidth: Math.max(
            document.documentElement ? document.documentElement.scrollWidth : 0,
            document.body ? document.body.scrollWidth : 0,
            window.innerWidth || 0
          ),
        }, '*');
      } catch (e) {}
    }

    log('TraceFlow initialized safely. Active Session:', getSessionId());
  }

  // Public API exposed to window.TraceFlow
  window.TraceFlow = {
    version: '2.0.0',
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracker);
  } else {
    initTracker();
  }
})(window, document);
