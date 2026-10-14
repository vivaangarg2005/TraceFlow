import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getTrackedPages, getPageClicks, resetClicks } from '../services/api';

export default function HeatmapView({ userMode, timeRange, includeSimulated }) {
  const [pages, setPages] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [clicks, setClicks] = useState([]);
  const [clickSummary, setClickSummary] = useState(null);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [error, setError] = useState(null);

  // Visualization & Viewport Settings
  const [renderMode, setRenderMode] = useState('thermal'); // 'thermal' | 'dots' | 'pins' | 'grid'
  const [showOverlay, setShowOverlay] = useState(true);
  const [interactionMode, setInteractionMode] = useState('interactive'); // 'interactive' | 'inspect'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'all' | 'desktop' | 'tablet' | 'mobile'
  const [heatmapRadius, setHeatmapRadius] = useState(32);
  const [heatmapOpacity, setHeatmapOpacity] = useState(85);

  // Scroll and dimensions synchronization
  const [iframeScrollY, setIframeScrollY] = useState(0);
  const [iframeDimensions, setIframeDimensions] = useState({ width: 1000, height: 680, docHeight: 1800 });

  // Element filtering & Inspection
  const [selectedElementHighlight, setSelectedElementHighlight] = useState(null);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const [liveSync, setLiveSync] = useState(true);
  const [newClickPulse, setNewClickPulse] = useState(false);
  const prevClicksCountRef = useRef(0);

  const [stageExpanded, setStageExpanded] = useState(false);

  const iframeRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Pre-generate thermal palette (0..255) for 60fps canvas colorization
  const thermalPalette = useMemo(() => {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1;
    pCanvas.height = 256;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createLinearGradient(0, 0, 0, 256);
    // Cold to Scorching Thermal Spectrum:
    grad.addColorStop(0.0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.12, 'rgba(56, 189, 248, 0.45)'); // Sky Blue
    grad.addColorStop(0.28, 'rgba(6, 182, 212, 0.7)');   // Cyan / Teal
    grad.addColorStop(0.48, 'rgba(34, 197, 94, 0.85)');  // Emerald Green
    grad.addColorStop(0.68, 'rgba(234, 179, 8, 0.95)');  // Golden Amber
    grad.addColorStop(0.85, 'rgba(249, 115, 22, 1.0)');  // Warm Orange
    grad.addColorStop(1.0, 'rgba(225, 29, 72, 1.0)');    // Intense Crimson Red
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 1, 256);
    return pCtx.getImageData(0, 0, 1, 256).data;
  }, []);

  // 2. Synchronize live events, scrolling, and navigation from demo store iframe
  useEffect(() => {
    function handleMessage(e) {
      if (!e.data) return;
      if (e.data.type === 'TRACEFLOW_SCROLL') {
        setIframeScrollY(e.data.scrollY || 0);
        if (e.data.docHeight) {
          setIframeDimensions((prev) => ({ ...prev, docHeight: e.data.docHeight }));
        }
      } else if (e.data.type === 'TRACEFLOW_IFRAME_LOADED') {
        if (e.data.scrollY !== undefined) setIframeScrollY(e.data.scrollY);
        if (e.data.docHeight) {
          setIframeDimensions((prev) => ({
            ...prev,
            docHeight: e.data.docHeight,
            docWidth: e.data.docWidth || prev.width,
          }));
        }
        // Auto-synchronize page dropdown if iframe navigated
        if ((e.data.path || e.data.url) && pages.length > 0) {
          const incomingPath = e.data.path;
          const incomingUrl = e.data.url;
          const matchingPage = pages.find((p) => {
            if (p.url === incomingUrl) return true;
            if (p.path === incomingPath) return true;
            try {
              if (incomingUrl && p.url) {
                const u1 = new URL(incomingUrl);
                const u2 = new URL(p.url);
                return (u1.pathname + u1.search) === (u2.pathname + u2.search);
              }
            } catch {}
            return false;
          });
          if (matchingPage && matchingPage.url !== selectedUrl) {
            setSelectedUrl(matchingPage.url);
          }
        }
      } else if (e.data.type === 'TRACEFLOW_EVENT_RECORDED' && e.data.event?.eventType === 'click') {
        setClicks((prev) => [e.data.event, ...prev]);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pages, selectedUrl]);

  // 3. Load distinct tracked pages
  useEffect(() => {
    async function loadPages() {
      try {
        setLoadingPages(true);
        setError(null);
        const res = await getTrackedPages({ timeRange, includeSimulated });
        if (res.data && res.data.length > 0) {
          setPages(res.data);
          // Default to the first page with clicks or first page
          const firstWithClicks = res.data.find((p) => p.totalClicks > 0) || res.data[0];
          setSelectedUrl(firstWithClicks.url);
        } else {
          setPages([]);
          setSelectedUrl('');
        }
      } catch (err) {
        setError('Failed to fetch tracked pages list: ' + err.message);
      } finally {
        setLoadingPages(false);
      }
    }
    loadPages();
  }, [timeRange, includeSimulated]);

  // 4. Load clicks for the selected page URL & device mode (supports silent background sync)
  const fetchClicks = useCallback(async (isBackground = false) => {
    if (!selectedUrl) {
      setClicks([]);
      setClickSummary(null);
      return;
    }

    try {
      if (!isBackground) {
        setLoadingClicks(true);
        setError(null);
        setIframeError(false);
      }
      const res = await getPageClicks({
        url: selectedUrl,
        timeRange,
        includeSimulated,
        deviceType: previewDevice !== 'all' ? previewDevice : undefined,
      });

      const count = res.totalClicks || 0;
      if (isBackground && prevClicksCountRef.current > 0 && count > prevClicksCountRef.current) {
        setNewClickPulse(true);
        setTimeout(() => setNewClickPulse(false), 2600);
      }
      prevClicksCountRef.current = count;

      setClicks(res.data || []);
      setClickSummary({
        totalClicks: res.totalClicks || 0,
        uniqueSessions: res.uniqueSessions || 0,
        sectionBreakdown: res.sectionBreakdown || {},
        rapidClicksCount: res.rapidClicksCount || 0,
      });
    } catch (err) {
      if (!isBackground) {
        setError('Failed to fetch click coordinates: ' + err.message);
      }
    } finally {
      if (!isBackground) {
        setLoadingClicks(false);
      }
    }
  }, [selectedUrl, timeRange, includeSimulated, previewDevice]);

  useEffect(() => {
    fetchClicks(false);
  }, [fetchClicks]);

  // Reset all recorded clicks
  const [resettingClicks, setResettingClicks] = useState(false);
  const handleResetClicks = async () => {
    if (!window.confirm('Are you sure you want to reset all click data? This will clear all click hotspots.')) {
      return;
    }
    try {
      setResettingClicks(true);
      await resetClicks({ allEvents: 'false' });
      setClicks([]);
      setClickSummary(null);
      setSelectedElementHighlight(null);
      await fetchClicks(false);
    } catch (err) {
      alert('Failed to reset clicks: ' + err.message);
    } finally {
      setResettingClicks(false);
    }
  };

  // Live real-time background polling (every 2.5s) when liveSync is active
  useEffect(() => {
    if (!liveSync || !selectedUrl) return;
    const timer = setInterval(() => {
      fetchClicks(true);
    }, 2500);
    return () => clearInterval(timer);
  }, [liveSync, selectedUrl, fetchClicks]);

  // Periodically refresh page metrics & dropdown list in background (every 6s)
  useEffect(() => {
    if (!liveSync) return;
    const timer = setInterval(async () => {
      try {
        const res = await getTrackedPages({ timeRange, includeSimulated });
        if (res.data && res.data.length > 0) {
          setPages(res.data);
        }
      } catch {}
    }, 6000);
    return () => clearInterval(timer);
  }, [liveSync, timeRange, includeSimulated]);

  // Extract normalized page path for iframe URL (preserving query params like ?id=watch)
  const selectedPath = useMemo(() => {
    if (!selectedUrl) return '/index.html';
    try {
      const parsed = new URL(selectedUrl);
      return (parsed.pathname || '/index.html') + (parsed.search || '');
    } catch {
      return selectedUrl.startsWith('/') ? selectedUrl : '/index.html';
    }
  }, [selectedUrl]);

  // Target demo store URL corresponding to selected path (supports VITE_DEMO_URL in production)
  const iframeSrc = useMemo(() => {
    const demoBase = import.meta.env.VITE_DEMO_URL || 'http://localhost:3000';
    return `${demoBase.replace(/\/$/, '')}${selectedPath}`;
  }, [selectedPath]);

  // Target native viewports (what the user sees on real devices)
  const DEVICE_VIEWPORTS = {
    desktop: { width: 1280, height: 820, label: 'Desktop' },
    tablet: { width: 768, height: 960, label: 'Tablet' },
    mobile: { width: 390, height: 844, label: 'Mobile' },
    all: { width: 1280, height: 820, label: 'All Devices' },
  };

  const currentDevice = DEVICE_VIEWPORTS[previewDevice] || DEVICE_VIEWPORTS.desktop;
  const baseWidth = currentDevice.width;
  const baseHeight = currentDevice.height;

  // Track container clientWidth with zero feedback loop (container size is strictly 100% / aspect-ratio driven by CSS)
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setContainerWidth((prev) => (Math.abs(prev - w) > 2 ? w : prev));
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [stageExpanded, previewDevice]);

  // Proportional scale factor: base resolution (1280px) scales down to exact container width
  const scaleFactor = useMemo(() => {
    return containerWidth > 0 ? Number((containerWidth / baseWidth).toFixed(5)) : 0.625;
  }, [containerWidth, baseWidth]);

  // Filtered click dataset (respects element highlight isolation)
  const activeClicks = useMemo(() => {
    if (!selectedElementHighlight) return clicks;
    return clicks.filter(
      (c) => `${c.elementTag}:${c.elementId}:${c.elementText}` === selectedElementHighlight
    );
  }, [clicks, selectedElementHighlight]);

  // Precise coordinate normalizer in base device resolution (1280px desktop, 768px tablet, 390px mobile)
  const getNormalizedCoords = useCallback((c) => {
    const recDocW = c.documentWidth || c.viewportWidth || (c.deviceType === 'mobile' ? 390 : c.deviceType === 'tablet' ? 768 : 1280);
    const docH = iframeDimensions.docHeight || baseHeight || 1800;

    let x;
    // For desktop (baseWidth = 1280):
    // In demo store, .container has max-width: 1200px; margin: 0 auto;
    // Desktop recordings preserve offset within the 1200px centered container
    if (baseWidth >= 1100 && recDocW >= 1100) {
      const recLeftGutter = (recDocW > 1200) ? (recDocW - 1200) / 2 : 0;
      const targetLeftGutter = (baseWidth - 1200) / 2; // exactly 40px for 1280
      const xInsideContent = Math.max(0, c.x - recLeftGutter);
      const contentRatio = Math.min(1, xInsideContent / 1200);
      x = targetLeftGutter + (contentRatio * 1200);
    } else if (c.xPercent !== null && c.xPercent !== undefined) {
      x = (c.xPercent / 100) * baseWidth;
    } else if (c.x !== undefined && c.x !== null) {
      x = (c.x / recDocW) * baseWidth;
    } else {
      x = baseWidth / 2;
    }

    x = Math.max(0, Math.min(baseWidth, x));

    let docY;
    if (c.yPercent !== null && c.yPercent !== undefined) {
      docY = (c.yPercent / 100) * docH;
    } else if (c.y !== undefined && c.y !== null) {
      const recDocH = c.documentHeight || docH;
      docY = recDocH > 0 ? (c.y / recDocH) * docH : c.y;
    } else {
      docY = 200;
    }

    return { x, docY };
  }, [baseWidth, baseHeight, iframeDimensions.docHeight]);

  // 5. High-Performance Canvas Thermal Heatmap Renderer
  useEffect(() => {
    if (renderMode !== 'thermal' || !canvasRef.current || !showOverlay) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas internal buffer matches target base device resolution (1280px / 768px / 390px)
    if (canvas.width !== baseWidth || canvas.height !== baseHeight) {
      canvas.width = baseWidth;
      canvas.height = baseHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, baseWidth, baseHeight);

    if (activeClicks.length === 0) return;

    // Create offscreen alpha accumulator canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = baseWidth;
    offscreen.height = baseHeight;
    const offCtx = offscreen.getContext('2d');

    const radius = Math.max(14, heatmapRadius);

    // Render radial alpha splats
    activeClicks.forEach((c) => {
      const { x, docY } = getNormalizedCoords(c);
      const y = docY - iframeScrollY;

      // Skip offscreen points
      if (y < -radius || y > baseHeight + radius || x < -radius || x > baseWidth + radius) {
        return;
      }

      const grad = offCtx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(x, y, radius, 0, Math.PI * 2);
      offCtx.fill();
    });

    // Colorize alpha channel via 256-color thermal spectrum palette
    try {
      const imgData = offCtx.getImageData(0, 0, baseWidth, baseHeight);
      const data = imgData.data;
      const alphaMultiplier = heatmapOpacity / 100;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          const paletteIdx = alpha * 4;
          data[i] = thermalPalette[paletteIdx];
          data[i + 1] = thermalPalette[paletteIdx + 1];
          data[i + 2] = thermalPalette[paletteIdx + 2];
          data[i + 3] = Math.min(255, Math.floor(thermalPalette[paletteIdx + 3] * alphaMultiplier));
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (err) {
      console.error('Heatmap render error:', err);
    }
  }, [
    activeClicks,
    renderMode,
    showOverlay,
    iframeScrollY,
    heatmapRadius,
    heatmapOpacity,
    baseWidth,
    baseHeight,
    thermalPalette,
    getNormalizedCoords,
  ]);

  // Aggregate and Rank Top Clicked Elements
  const topElements = useMemo(() => {
    const counts = {};
    clicks.forEach((c) => {
      const key = `${c.elementTag || 'ELEMENT'}:${c.elementId || ''}:${c.elementText || ''}`;
      if (!counts[key]) {
        counts[key] = {
          tag: c.elementTag || 'ELEMENT',
          id: c.elementId || '',
          text: c.elementText || '(No text label)',
          section: c.elementSection || 'main',
          count: 0,
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [clicks]);

  // Generate 10x10 density grid matrix
  const gridCells = useMemo(() => {
    if (renderMode !== 'grid' || activeClicks.length === 0) return [];
    const matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
    let maxCellCount = 1;

    activeClicks.forEach((c) => {
      let xPct = c.xPercent !== null && c.xPercent !== undefined ? c.xPercent : 50;
      let yPct = c.yPercent !== null && c.yPercent !== undefined ? c.yPercent : 50;

      const col = Math.min(9, Math.max(0, Math.floor(xPct / 10)));
      const row = Math.min(9, Math.max(0, Math.floor(yPct / 10)));
      matrix[row][col]++;
      if (matrix[row][col] > maxCellCount) maxCellCount = matrix[row][col];
    });

    const cells = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const count = matrix[r][c];
        const intensity = count > 0 ? (count / maxCellCount).toFixed(2) : 0;
        const percentOfTotal = activeClicks.length > 0 ? ((count / activeClicks.length) * 100).toFixed(1) : 0;
        cells.push({ row: r, col: c, count, intensity, percentOfTotal });
      }
    }
    return cells;
  }, [activeClicks, renderMode]);

  // Inspect Hover Proximity Tracker for Canvas Mode
  const handleMouseMoveInspect = (e) => {
    if (interactionMode !== 'inspect' || activeClicks.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const factor = scaleFactor || 1;
    const mouseX = (e.clientX - rect.left) / factor;
    const mouseY = (e.clientY - rect.top) / factor;

    let closest = null;
    let minDistance = 50; // 50px proximity threshold in base space

    activeClicks.forEach((c) => {
      const { x, docY } = getNormalizedCoords(c);
      const y = docY - iframeScrollY;
      const dist = Math.hypot(mouseX - x, mouseY - y);

      if (dist < minDistance) {
        minDistance = dist;
        closest = {
          ...c,
          screenX: Math.round(x * factor),
          screenY: Math.round(y * factor),
        };
      }
    });

    setHoveredClick(closest);
  };

  // Plain-English Store Owner Insights
  const plainEnglishInsights = useMemo(() => {
    if (clicks.length === 0) return [];
    const insights = [];
    const total = clicks.length;
    const uniqueVisits = clickSummary?.uniqueSessions || 1;

    if (topElements.length > 0) {
      const top = topElements[0];
      const topPct = ((top.count / total) * 100).toFixed(1);
      insights.push({
        title: `Primary Focus: <${top.tag}> "${top.text}"`,
        observation: `The element <${top.tag}> "${top.text}" accounted for ${top.count} out of ${total} total clicks (${topPct}% of all page interactions).`,
        measurement: `${top.count} clicks recorded across ${uniqueVisits} unique session(s).`,
        whyItMatters: `This is the most interacted component on this page. High engagement suggests visitors readily find and interact with it, but clicks alone do not prove successful task completion.`,
        nextStep: `Verify whether clicking this element leads to the intended next step (e.g. cart drawer opening or product detail page view).`,
        limitation: `Sample size represents ${uniqueVisits} session(s). Multiple clicks by the same customer may inflate this count.`,
      });
    }

    const sections = clickSummary?.sectionBreakdown || {};
    const heroClicks = sections['hero'] || 0;
    if (heroClicks > 0 && total >= 3) {
      const heroPct = ((heroClicks / total) * 100).toFixed(1);
      insights.push({
        title: `Page Section Distribution: Hero Area`,
        observation: `${heroPct}% of clicks on this page were concentrated in the above-the-fold Hero section (${heroClicks} clicks).`,
        measurement: `${heroClicks} out of ${total} recorded clicks.`,
        whyItMatters: `High above-the-fold activity confirms the hero banner attracts immediate interest, but may indicate visitors do not scroll down to explore the full catalog.`,
        nextStep: `Test whether moving key product recommendations higher on the page improves catalog browsing.`,
        limitation: `Scroll depth is inferred from click coordinates; passive scrolling without clicking is not captured in this metric.`,
      });
    }

    if (clickSummary?.rapidClicksCount > 0) {
      insights.push({
        title: `Repeated Click Anomaly Detected`,
        observation: `Observed ${clickSummary.rapidClicksCount} rapid repeat click(s) on the same element within 2.5 seconds.`,
        measurement: `${clickSummary.rapidClicksCount} rapid click intervals detected in session data.`,
        whyItMatters: `Repeated clicks within a short window often indicate customer frustration—such as an unresponsive button, slow network response, or confusing interactive feedback.`,
        nextStep: `Audit the responsive feedback and loading state on frequently repeated buttons to ensure customers receive immediate visual confirmation.`,
        limitation: `Rapid clicking may also reflect intentional user choices (e.g. quantity increments in cart).`,
      });
    }

    return insights;
  }, [clicks, topElements, clickSummary]);

  return (
    <div className="heatmap-view-container animate-fade-in">
      {/* Primary Configuration Bar */}
      <div className="heatmap-control-bar glass-card">
        {/* Page Selector */}
        <div className="page-selector-group">
          <label className="selector-label">Analyzed Webpage:</label>
          <div className="select-wrapper">
            <select
              className="page-select mono"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              disabled={loadingPages}
            >
              {pages.length === 0 && <option value="">No pages tracked yet</option>}
              {pages.map((p) => {
                let label = p.path;
                if (p.path === '/index.html' || p.path === '/') {
                  label = '🏠 Home (/index.html)';
                } else if (p.path === '/product.html') {
                  label = '🛍️ Catalog / All Products (/product.html)';
                } else if (p.path === '/checkout.html') {
                  label = '💳 Checkout (/checkout.html)';
                } else if (p.path?.includes('id=watch')) {
                  label = '⌚ Product: Titanium Timepiece (/product.html?id=watch)';
                } else if (p.path?.includes('id=tee')) {
                  label = '👕 Product: Heavyweight Combed Tee (/product.html?id=tee)';
                } else if (p.path?.includes('id=runner') || p.path?.includes('id=sneaker')) {
                  label = '👟 Product: Monochrome Runner V2 (/product.html?id=runner)';
                } else if (p.path?.includes('id=pack')) {
                  label = '🎒 Product: Commuter Waterproof Pack (/product.html?id=pack)';
                } else if (p.title) {
                  label = `📦 ${p.title} (${p.path})`;
                }
                return (
                  <option key={p.path || p.url} value={p.url}>
                    {label} ({p.totalClicks || 0} clicks • {p.totalViews || 0} views)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Heatmap Visual Mode Switcher */}
        <div className="render-mode-group">
          <label className="selector-label">Visual Engine:</label>
          <div className="mode-btn-group">
            <button
              className={`mode-btn ${renderMode === 'thermal' ? 'active' : ''}`}
              onClick={() => setRenderMode('thermal')}
              title="State-of-the-art continuous thermal heat gradient (Hotjar/Clarity standard)"
            >
              🔥 Thermal Heatmap
            </button>
            <button
              className={`mode-btn ${renderMode === 'dots' ? 'active' : ''}`}
              onClick={() => setRenderMode('dots')}
              title="Individual radial hotspot glow rings"
            >
              🔴 Glow Hotspots
            </button>
            <button
              className={`mode-btn ${renderMode === 'pins' ? 'active' : ''}`}
              onClick={() => setRenderMode('pins')}
              title="Precision landmark pins with interactive tags"
            >
              📍 Precision Pins
            </button>
            <button
              className={`mode-btn ${renderMode === 'grid' ? 'active' : ''}`}
              onClick={() => setRenderMode('grid')}
              title="10×10 sector density percentage matrix"
            >
              ▦ 10×10 Grid
            </button>
          </div>
        </div>

        {/* Device Viewport Simulation */}
        <div className="device-viewport-group">
          <label className="selector-label">Device Mode & Viewport:</label>
          <div className="mode-btn-group">
            <button
              className={`mode-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('desktop')}
              title="Standard Desktop Viewport (1280 × 760px) — Pixel-locked desktop layout"
            >
              💻 Desktop (1280px)
            </button>
            <button
              className={`mode-btn ${previewDevice === 'tablet' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('tablet')}
              title="Tablet Portrait Viewport (768 × 860px) — Pixel-locked iPad/Tablet layout"
            >
              📟 Tablet (768px)
            </button>
            <button
              className={`mode-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('mobile')}
              title="Mobile Device Viewport (390 × 844px) — Pixel-locked iPhone layout"
            >
              📱 Mobile (390px)
            </button>
            <button
              className={`mode-btn ${previewDevice === 'all' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('all')}
              title="View all combined clicks across devices"
            >
              🌐 All
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Controls Bar: Precision Sliders & Interaction Modes */}
      <div className="heatmap-tuning-bar glass-card">
        {/* Interaction Mode Pill */}
        <div className="tuning-item">
          <span className="tuning-label">Store Interaction:</span>
          <div className="mode-toggle-pill">
            <button
              className={`mode-pill-btn ${interactionMode === 'interactive' ? 'active' : ''}`}
              onClick={() => {
                setInteractionMode('interactive');
                setHoveredClick(null);
              }}
              title="Freely click buttons, add to cart, and browse store while viewing heatmaps"
            >
              🖱️ Live Click Mode
            </button>
            <button
              className={`mode-pill-btn ${interactionMode === 'inspect' ? 'active' : ''}`}
              onClick={() => setInteractionMode('inspect')}
              title="Hover hotspots to inspect click targets, coordinates, and session details"
            >
              🔍 Inspect Hotspots
            </button>
          </div>
        </div>

        {/* Studio Expand Toggle */}
        <button
          className={`btn btn-sm ${stageExpanded ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStageExpanded(!stageExpanded)}
          title={stageExpanded ? 'Switch back to split view with insights panel' : 'Expand preview stage to full width for maximum precision'}
          style={{ fontSize: '0.76rem' }}
        >
          {stageExpanded ? '⮌ Split View' : '⛶ Expand Studio'}
        </button>

        {/* Radius Slider (For Thermal & Glow) */}
        {(renderMode === 'thermal' || renderMode === 'dots') && (
          <div className="tuning-item">
            <span className="tuning-label">Heat Radius:</span>
            <input
              type="range"
              min="16"
              max="54"
              value={heatmapRadius}
              onChange={(e) => setHeatmapRadius(Number(e.target.value))}
              className="tuning-slider"
            />
            <span className="tuning-val mono">{heatmapRadius}px</span>
          </div>
        )}

        {/* Opacity Slider */}
        <div className="tuning-item">
          <span className="tuning-label">Heat Opacity:</span>
          <input
            type="range"
            min="25"
            max="100"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
            className="tuning-slider"
          />
          <span className="tuning-val mono">{heatmapOpacity}%</span>
        </div>

        {/* Visibility Toggle */}
        <button
          className={`btn btn-sm ${showOverlay ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowOverlay(!showOverlay)}
          style={{ fontSize: '0.76rem' }}
        >
          {showOverlay ? '👁️ Heatmap Visible' : '👁️‍🗨️ Heatmap Hidden'}
        </button>

        {/* Live Auto-Sync Stream Toggle */}
        <button
          className={`btn btn-sm ${liveSync ? 'btn-live-stream active' : 'btn-secondary'}`}
          onClick={() => setLiveSync(!liveSync)}
          title={liveSync ? 'Live Auto-Sync is ON (updating every 2.5s). Click to pause.' : 'Live Auto-Sync is PAUSED. Click to resume real-time updates.'}
          style={{
            fontSize: '0.76rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderColor: liveSync ? 'rgba(16, 185, 129, 0.45)' : undefined,
            background: liveSync ? 'rgba(16, 185, 129, 0.12)' : undefined,
            color: liveSync ? '#34d399' : undefined,
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: liveSync ? '#10b981' : '#6b7280',
              boxShadow: liveSync ? '0 0 8px #10b981' : 'none',
              display: 'inline-block',
              animation: liveSync ? 'pulseGlow 1.6s infinite' : 'none',
            }}
          />
          {liveSync ? '🟢 Live Stream (2.5s)' : '⏸️ Live Paused'}
        </button>

        {newClickPulse && (
          <span className="badge badge-emerald animate-pulse" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
            ⚡ Live Click Received!
          </span>
        )}

        {/* Refresh Clicks */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchClicks(false)}
          title="Reload latest clicks immediately from backend"
          style={{ fontSize: '0.76rem' }}
        >
          🔄 Refresh
        </button>

        {/* Reset Clicks */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleResetClicks}
          disabled={resettingClicks}
          title="Reset and clear all click data from the database"
          style={{
            fontSize: '0.76rem',
            color: '#f87171',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          {resettingClicks ? '⏳ Resetting...' : '🗑️ Reset Clicks'}
        </button>

        {/* New Tab Store Link */}
        <a
          href={iframeSrc}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.76rem' }}
          title="Open demo store in new tab"
        >
          ↗ Open Tab
        </a>
      </div>

      {/* Metrics & Intensity Legend Bar */}
      <div className="heatmap-stats-strip glass-card">
        <div className="h-stat">
          <span className="h-stat-label">Total Clicks on Page:</span>
          <span className="h-stat-val" style={{ color: '#fbbf24' }}>
            {clicks.length}
          </span>
        </div>
        <div className="h-stat">
          <span className="h-stat-label">Unique Contributing Visits:</span>
          <span className="h-stat-val" style={{ color: '#a5b4fc' }}>
            {clickSummary?.uniqueSessions || 0}
          </span>
        </div>
        {selectedElementHighlight && (
          <div className="h-stat">
            <span className="h-stat-label">Filtered Clicks:</span>
            <span className="h-stat-val" style={{ color: '#38bdf8' }}>
              {activeClicks.length}
            </span>
          </div>
        )}

        {/* Intensity Legend */}
        <div className="heatmap-legend">
          <span className="legend-label">Thermal Scale:</span>
          <div className="legend-bar">
            <span className="legend-gradient"></span>
          </div>
          <div className="legend-stops">
            <span>Low (1-2)</span>
            <span>Moderate (5+)</span>
            <span>Hotspot (15+)</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Stage & Sidebar Grid */}
      <div className={`heatmap-stage-grid ${stageExpanded ? 'expanded' : ''}`}>
        {/* Left Column: Live Webpage Preview with Heatmap Overlay */}
        <div className="glass-card heatmap-canvas-card">
          <div className="canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="live-indicator-dot"></span>
              <span className="mono" style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                LIVE STORE: <strong>{iframeSrc}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-indigo mono" style={{ fontSize: '0.7rem' }}>
                {previewDevice === 'mobile' ? '390px Mobile' : previewDevice === 'tablet' ? '768px Tablet' : 'Desktop (1280px)'} • Scale: {Math.round(scaleFactor * 100)}% ({Math.round(containerWidth)}px)
              </span>
              {selectedElementHighlight && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setSelectedElementHighlight(null)}
                >
                  Clear Element Filter ✕
                </button>
              )}
              <span className="badge badge-click">{activeClicks.length} CLICKS SHOWN</span>
            </div>
          </div>

          {/* Device Viewport Stage (100% Proportional Scale Fit) */}
          <div className="device-center-wrapper">
            <div
              ref={containerRef}
              className={`heatmap-preview-container device-${previewDevice}`}
              onMouseMove={handleMouseMoveInspect}
              onMouseLeave={() => setHoveredClick(null)}
            >
              {/* Actual Live Webpage Preview (Iframe) */}
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                title="Live Tracked Webpage Preview"
                className="live-store-iframe"
                style={{
                  width: `${baseWidth}px`,
                  height: `${baseHeight}px`,
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: 'top left',
                  border: 'none',
                  borderRadius:
                    previewDevice === 'mobile' ? '32px' : previewDevice === 'tablet' ? '20px' : '12px',
                }}
                onError={() => setIframeError(true)}
              />

              {/* 1. Real HTML5 Canvas Thermal Heatmap Engine */}
              {showOverlay && renderMode === 'thermal' && (
                <canvas
                  ref={canvasRef}
                  width={baseWidth}
                  height={baseHeight}
                  className="thermal-heatmap-canvas"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}

              {/* 2. DOM-Based Modes: Glow Dots, Precision Pins, 10x10 Grid */}
              {showOverlay && renderMode !== 'thermal' && (
                <div
                  className={`heatmap-overlay-layer mode-${interactionMode}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${scaleFactor}) translateY(-${iframeScrollY}px)`,
                    transformOrigin: 'top left',
                    pointerEvents: interactionMode === 'inspect' ? 'auto' : 'none',
                    zIndex: 20,
                  }}
                >
                  {/* Density Grid Mode */}
                  {renderMode === 'grid' && (
                    <div className="density-grid-matrix" style={{ width: `${baseWidth}px`, height: `${baseHeight}px` }}>
                        {gridCells.map((cell, idx) => (
                          <div
                            key={idx}
                            className="matrix-cell"
                            style={{
                              backgroundColor:
                                cell.count > 0
                                  ? `rgba(239, 68, 68, ${Math.min(0.85, cell.intensity * 0.75 + 0.15)})`
                                  : 'transparent',
                            }}
                            title={`Grid Sector (${cell.col + 1}, ${cell.row + 1}): ${cell.count} clicks (${cell.percentOfTotal}% of total)`}
                          >
                            {cell.count > 0 && (
                              <span className="matrix-count-badge">
                                {cell.count} <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({cell.percentOfTotal}%)</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Radial Glow Dots Mode */}
                    {renderMode === 'dots' &&
                      activeClicks.map((c, i) => {
                        const { x, docY } = getNormalizedCoords(c);
                        return (
                          <div
                            key={c._id || i}
                            className="heatmap-glow-dot"
                            style={{
                              left: `${x}px`,
                              top: `${docY}px`,
                              width: `${heatmapRadius * 1.2}px`,
                              height: `${heatmapRadius * 1.2}px`,
                              opacity: heatmapOpacity / 100,
                            }}
                            onMouseEnter={() => setHoveredClick(c)}
                            onMouseLeave={() => setHoveredClick(null)}
                          />
                        );
                      })}

                    {/* Precision Landmark Pins Mode */}
                    {renderMode === 'pins' &&
                      activeClicks.map((c, i) => {
                        const { x, docY } = getNormalizedCoords(c);
                        return (
                          <div
                            key={c._id || i}
                            className="heatmap-pin"
                            style={{ left: `${x}px`, top: `${docY}px` }}
                            onMouseEnter={() => setHoveredClick(c)}
                            onMouseLeave={() => setHoveredClick(null)}
                          >
                            <div className="pin-marker"></div>
                            <span className="pin-tag">&lt;{c.elementTag}&gt;</span>
                          </div>
                        );
                      })}
                  </div>
                )}

              {/* Hover Tooltip (Active across all modes when Inspect Mode is selected) */}
              {hoveredClick && interactionMode === 'inspect' && (
                <div
                  className="heatmap-hover-tooltip glass-card mono animate-fade-in"
                  style={{
                    left: `${Math.min(
                      (containerRef.current?.clientWidth || 800) - 270,
                      Math.max(12, hoveredClick.screenX !== undefined ? hoveredClick.screenX + 16 : 100)
                    )}px`,
                    top: `${Math.min(
                      580,
                      Math.max(12, hoveredClick.screenY !== undefined ? hoveredClick.screenY + 16 : 100)
                    )}px`,
                  }}
                >
                  <div className="tooltip-title">
                    📍 Click @ ({hoveredClick.x}px, {hoveredClick.y}px)
                  </div>
                  <div className="tooltip-row">
                    Target: <strong>&lt;{hoveredClick.elementTag || 'ELEMENT'}&gt;</strong> in {hoveredClick.elementSection || 'main'}
                  </div>
                  {hoveredClick.elementText && (
                    <div className="tooltip-row" style={{ color: '#c7d2fe' }}>
                      Text: "{hoveredClick.elementText}"
                    </div>
                  )}
                  {hoveredClick.elementSelector && (
                    <div className="tooltip-row" style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                      Selector: <code>{hoveredClick.elementSelector}</code>
                    </div>
                  )}
                  <div className="tooltip-row" style={{ color: '#64748b', fontSize: '0.68rem', marginTop: '0.3rem' }}>
                    Session: {hoveredClick.sessionId?.slice(0, 16)}... • {hoveredClick.deviceType || 'desktop'}
                  </div>
                </div>
              )}

              {/* Loading & Empty States */}
              {loadingClicks && (
                <div className="canvas-overlay-message">
                  <div className="spin-icon" style={{ fontSize: '2rem' }}>🔄</div>
                  <p>Synthesizing interaction heatmap...</p>
                </div>
              )}

              {!loadingClicks && clicks.length === 0 && (
                <div className="canvas-overlay-message">
                  <div style={{ fontSize: '2.5rem' }}>🎯</div>
                  <h3>No Click Data Recorded for This Page</h3>
                  <p style={{ maxWidth: '420px', margin: '0.5rem auto' }}>
                    Visit <strong>{iframeSrc}</strong> in your browser to interact with buttons and generate live click hotspots.
                  </p>
                  <a
                    href={iframeSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem' }}
                  >
                    Open Page & Test Clicks ↗
                  </a>
                </div>
              )}
              </div>
            </div>
          </div>

        {/* Right Column: Top Elements & Plain-English Insights Panel */}
        <div className="heatmap-sidebar-column">
          {/* Top Clicked Elements Card */}
          <div className="glass-card sidebar-panel">
            <h3 className="panel-title">🔥 Top Interacted Elements</h3>
            <p className="panel-subtext">Click any element below to isolate its markers on the heatmap</p>

            {topElements.length === 0 ? (
              <div className="empty-subtext">No elements recorded yet.</div>
            ) : (
              <div className="elements-list">
                {topElements.map((item, idx) => {
                  const key = `${item.tag}:${item.id}:${item.text}`;
                  const isSelected = selectedElementHighlight === key;
                  const pct = clicks.length > 0 ? ((item.count / clicks.length) * 100).toFixed(1) : 0;

                  return (
                    <div
                      key={idx}
                      className={`element-rank-item ${isSelected ? 'selected-element' : ''}`}
                      onClick={() =>
                        setSelectedElementHighlight(isSelected ? null : key)
                      }
                      title="Click to isolate markers for this element on the preview"
                    >
                      <div className="element-rank-header">
                        <span className="rank-badge">#{idx + 1}</span>
                        <div className="element-info">
                          <span className="element-tag-pill mono">
                            &lt;{item.tag}&gt; in {item.section}
                          </span>
                          <div className="element-text-preview" title={item.text}>
                            "{item.text}"
                          </div>
                        </div>
                        <div className="rank-count mono">
                          <strong>{item.count}</strong> clicks
                        </div>
                      </div>

                      <div className="rank-bar-bg">
                        <div className="rank-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="element-calc-denominator">
                        {item.count} clicks / {clicks.length} total clicks on this page = {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="guidance-callout">
              <span style={{ fontWeight: 700 }}>⚠️ Analytics Principle:</span> High click counts do not automatically indicate positive performance; repeated clicks may represent confusion or delay. Conversely, low clicks may reflect poor visibility rather than lack of interest.
            </div>
          </div>

          {/* Plain-English Evidence-Based Insights Panel */}
          <div className="glass-card sidebar-panel">
            <h3 className="panel-title">💡 Store Owner Insights</h3>
            <p className="panel-subtext">Evidence-based observations calculated from actual visit records</p>

            {plainEnglishInsights.length === 0 ? (
              <div className="empty-subtext">
                Collect at least 3 customer clicks on this page to generate evidence-based observations.
              </div>
            ) : (
              <div className="insights-list">
                {plainEnglishInsights.map((insight, idx) => (
                  <div key={idx} className="insight-card">
                    <div className="insight-title">{insight.title}</div>
                    
                    <div className="insight-field">
                      <span className="insight-label">1. Observation:</span>
                      <p className="insight-text">{insight.observation}</p>
                    </div>

                    <div className="insight-field">
                      <span className="insight-label">2. Measurement:</span>
                      <p className="insight-text mono" style={{ color: '#a5b4fc', fontSize: '0.8rem' }}>
                        {insight.measurement}
                      </p>
                    </div>

                    <div className="insight-field">
                      <span className="insight-label">3. Why it matters:</span>
                      <p className="insight-text">{insight.whyItMatters}</p>
                    </div>

                    <div className="insight-field">
                      <span className="insight-label">4. Suggested next step:</span>
                      <p className="insight-text" style={{ color: '#34d399' }}>{insight.nextStep}</p>
                    </div>

                    <div className="insight-field">
                      <span className="insight-label">5. Limitation / Uncertainty:</span>
                      <p className="insight-text" style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                        {insight.limitation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
