import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getTrackedPages, getPageClicks } from '../services/api';

export default function HeatmapView({ userMode, timeRange, includeSimulated }) {
  const [pages, setPages] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [clicks, setClicks] = useState([]);
  const [clickSummary, setClickSummary] = useState(null);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [error, setError] = useState(null);

  // Visualization & Viewport Settings
  const [renderMode, setRenderMode] = useState('dots'); // 'dots' | 'grid' | 'pins'
  const [showOverlay, setShowOverlay] = useState(true);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [selectedElementHighlight, setSelectedElementHighlight] = useState(null);
  const [hoveredClick, setHoveredClick] = useState(null);
  const [iframeError, setIframeError] = useState(false);

  const iframeRef = useRef(null);

  // Load distinct tracked pages
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

  // Load clicks for the selected page URL
  useEffect(() => {
    if (!selectedUrl) {
      setClicks([]);
      setClickSummary(null);
      return;
    }

    async function loadClicks() {
      try {
        setLoadingClicks(true);
        setError(null);
        setIframeError(false);
        const res = await getPageClicks({
          url: selectedUrl,
          timeRange,
          includeSimulated,
        });
        setClicks(res.data || []);
        setClickSummary({
          totalClicks: res.totalClicks || 0,
          uniqueSessions: res.uniqueSessions || 0,
          sectionBreakdown: res.sectionBreakdown || {},
          rapidClicksCount: res.rapidClicksCount || 0,
        });
      } catch (err) {
        setError('Failed to fetch click coordinates: ' + err.message);
      } finally {
        setLoadingClicks(false);
      }
    }
    loadClicks();
  }, [selectedUrl, timeRange, includeSimulated]);

  // Extract normalized page path for iframe URL
  const selectedPath = useMemo(() => {
    if (!selectedUrl) return '/index.html';
    try {
      const parsed = new URL(selectedUrl);
      return parsed.pathname || '/index.html';
    } catch {
      return selectedUrl.startsWith('/') ? selectedUrl : '/index.html';
    }
  }, [selectedUrl]);

  // Local demo store URL corresponding to selected path
  const iframeSrc = useMemo(() => {
    return `http://localhost:3000${selectedPath}`;
  }, [selectedPath]);

  // Viewport container width based on device mode
  const deviceContainerWidth = useMemo(() => {
    if (previewDevice === 'mobile') return '390px';
    if (previewDevice === 'tablet') return '768px';
    return '100%';
  }, [previewDevice]);

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
    if (renderMode !== 'grid' || clicks.length === 0) return [];
    const matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
    let maxCellCount = 1;

    clicks.forEach((c) => {
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
        const percentOfTotal = clicks.length > 0 ? ((count / clicks.length) * 100).toFixed(1) : 0;
        cells.push({ row: r, col: c, count, intensity, percentOfTotal });
      }
    }
    return cells;
  }, [clicks, renderMode]);

  // Generate Evidence-Based Plain-English Insights (Strict 5-Part Format)
  const plainEnglishInsights = useMemo(() => {
    if (clicks.length === 0) return [];
    const insights = [];
    const total = clicks.length;
    const uniqueVisits = clickSummary?.uniqueSessions || 1;

    // Insight 1: Top Clicked Element
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

    // Insight 2: Section Concentration
    const sections = clickSummary?.sectionBreakdown || {};
    const heroClicks = sections['hero'] || 0;
    const catalogClicks = sections['catalog'] || 0;
    const checkoutClicks = sections['checkout'] || 0;

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

    // Insight 3: Potential User Frustration / Repeated Clicks
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
      {/* Configuration & Page Selector Bar */}
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
              {pages.map((p) => (
                <option key={p.url} value={p.url}>
                  {p.path || p.url} ({p.totalClicks || 0} clicks • {p.totalViews || 0} views)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Heatmap Visual Mode Switcher */}
        <div className="render-mode-group">
          <label className="selector-label">Heatmap Overlay Mode:</label>
          <div className="mode-btn-group">
            <button
              className={`mode-btn ${renderMode === 'dots' ? 'active' : ''}`}
              onClick={() => setRenderMode('dots')}
            >
              🔴 Radial Glow
            </button>
            <button
              className={`mode-btn ${renderMode === 'grid' ? 'active' : ''}`}
              onClick={() => setRenderMode('grid')}
            >
              ▦ 10×10 Grid
            </button>
            <button
              className={`mode-btn ${renderMode === 'pins' ? 'active' : ''}`}
              onClick={() => setRenderMode('pins')}
            >
              📍 Precision Pins
            </button>
          </div>
        </div>

        {/* Device Viewport Simulation */}
        <div className="device-viewport-group">
          <label className="selector-label">Display Viewport:</label>
          <div className="mode-btn-group">
            <button
              className={`mode-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('desktop')}
            >
              💻 Desktop
            </button>
            <button
              className={`mode-btn ${previewDevice === 'tablet' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('tablet')}
            >
              📟 Tablet
            </button>
            <button
              className={`mode-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewDevice('mobile')}
            >
              📱 Mobile
            </button>
          </div>
        </div>

        {/* Overlay Toggle */}
        <div className="overlay-toggle-group">
          <label className="selector-label">Overlay Control:</label>
          <button
            className={`btn btn-sm ${showOverlay ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? '👁️ Heatmap: Visible' : '👁️‍🗨️ Heatmap: Hidden'}
          </button>
        </div>
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
        
        {/* Intensity Legend */}
        <div className="heatmap-legend">
          <span className="legend-label">Intensity Scale:</span>
          <div className="legend-bar">
            <span className="legend-gradient"></span>
          </div>
          <div className="legend-stops">
            <span>Low</span>
            <span>Moderate</span>
            <span>Hotspot</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Stage & Sidebar Grid */}
      <div className="heatmap-stage-grid">
        {/* Left Column: Live Webpage Preview with Heatmap Overlay */}
        <div className="glass-card heatmap-canvas-card">
          <div className="canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="live-indicator-dot"></span>
              <span className="mono" style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                LIVE PREVIEW: <strong>{iframeSrc}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {selectedElementHighlight && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setSelectedElementHighlight(null)}
                >
                  Clear Highlight Filter ✕
                </button>
              )}
              <span className="badge badge-click">{clicks.length} CLICKS RECORDED</span>
            </div>
          </div>

          {/* Device Centered Wrapper */}
          <div className="device-center-wrapper">
            <div
              className="heatmap-preview-container"
              style={{ width: deviceContainerWidth }}
            >
              {/* Actual Live Webpage Preview (Iframe) */}
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                title="Live Tracked Webpage Preview"
                className="live-store-iframe"
                onError={() => setIframeError(true)}
              />

              {/* Synchronized Heatmap Overlay Layer */}
              {showOverlay && (
                <div className="heatmap-overlay-layer">
                  {/* Density Grid Mode */}
                  {renderMode === 'grid' && (
                    <div className="density-grid-matrix">
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
                    clicks.map((c, i) => {
                      const isHighlighted =
                        !selectedElementHighlight ||
                        `${c.elementTag}:${c.elementId}:${c.elementText}` === selectedElementHighlight;

                      if (!isHighlighted) return null;

                      // Use document percentage if available, fallback to clientX/Y
                      const left = c.xPercent !== null && c.xPercent !== undefined ? `${c.xPercent}%` : `${c.x}px`;
                      const top = c.yPercent !== null && c.yPercent !== undefined ? `${c.yPercent}%` : `${c.y}px`;

                      return (
                        <div
                          key={c._id || i}
                          className="heatmap-glow-dot"
                          style={{
                            left,
                            top,
                            width: '36px',
                            height: '36px',
                            opacity: 0.85,
                          }}
                          onMouseEnter={() => setHoveredClick(c)}
                          onMouseLeave={() => setHoveredClick(null)}
                        />
                      );
                    })}

                  {/* Precision Pins Mode */}
                  {renderMode === 'pins' &&
                    clicks.map((c, i) => {
                      const isHighlighted =
                        !selectedElementHighlight ||
                        `${c.elementTag}:${c.elementId}:${c.elementText}` === selectedElementHighlight;

                      if (!isHighlighted) return null;

                      const left = c.xPercent !== null && c.xPercent !== undefined ? `${c.xPercent}%` : `${c.x}px`;
                      const top = c.yPercent !== null && c.yPercent !== undefined ? `${c.yPercent}%` : `${c.y}px`;

                      return (
                        <div
                          key={c._id || i}
                          className="heatmap-pin"
                          style={{ left, top }}
                          onMouseEnter={() => setHoveredClick(c)}
                          onMouseLeave={() => setHoveredClick(null)}
                        >
                          <div className="pin-marker"></div>
                          <span className="pin-tag">&lt;{c.elementTag}&gt;</span>
                        </div>
                      );
                    })}

                  {/* Hover Tooltip */}
                  {hoveredClick && (
                    <div
                      className="heatmap-hover-tooltip glass-card mono"
                      style={{
                        left:
                          hoveredClick.xPercent !== null
                            ? `calc(${hoveredClick.xPercent}% + 12px)`
                            : `${hoveredClick.x + 12}px`,
                        top:
                          hoveredClick.yPercent !== null
                            ? `calc(${hoveredClick.yPercent}% + 12px)`
                            : `${hoveredClick.y + 12}px`,
                      }}
                    >
                      <div className="tooltip-title">
                        📍 Click @ ({hoveredClick.x}px, {hoveredClick.y}px)
                      </div>
                      <div className="tooltip-row">
                        Target: <strong>&lt;{hoveredClick.elementTag}&gt;</strong> in {hoveredClick.elementSection}
                      </div>
                      {hoveredClick.elementText && (
                        <div className="tooltip-row">
                          Text: "{hoveredClick.elementText}"
                        </div>
                      )}
                      <div className="tooltip-row" style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                        Session: {hoveredClick.sessionId} ({hoveredClick.deviceType || 'desktop'})
                      </div>
                    </div>
                  )}

                  {/* Loading / Empty States */}
                  {loadingClicks && (
                    <div className="canvas-overlay-message">
                      <div className="spin-icon" style={{ fontSize: '2rem' }}>🔄</div>
                      <p>Aligning click coordinates with live webpage...</p>
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
                        Open This Page & Click Buttons ↗
                      </a>
                    </div>
                  )}
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
