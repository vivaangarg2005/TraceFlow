import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getTrackedPages, getPageClicks } from '../services/api';

export default function HeatmapView() {
  const [pages, setPages] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingClicks, setLoadingClicks] = useState(false);
  const [error, setError] = useState(null);

  // Visualization options
  const [renderMode, setRenderMode] = useState('dots'); // 'dots' | 'grid' | 'pins'
  const [pointRadius, setPointRadius] = useState(24);
  const [opacity, setOpacity] = useState(0.85);
  const [backdropMode, setBackdropMode] = useState('wireframe'); // 'wireframe' | 'canvas' | 'iframe'
  const [hoveredClick, setHoveredClick] = useState(null);

  const canvasContainerRef = useRef(null);

  // Load distinct pages
  useEffect(() => {
    async function loadPages() {
      try {
        setLoadingPages(true);
        const res = await getTrackedPages();
        if (res.data && res.data.length > 0) {
          setPages(res.data);
          // Default to the first page with clicks or first page
          const firstWithClicks = res.data.find((p) => p.totalClicks > 0) || res.data[0];
          setSelectedUrl(firstWithClicks.url);
        } else {
          setPages([]);
        }
      } catch (err) {
        setError('Failed to fetch tracked pages list: ' + err.message);
      } finally {
        setLoadingPages(false);
      }
    }
    loadPages();
  }, []);

  // Load clicks when selected page changes
  useEffect(() => {
    if (!selectedUrl) return;

    async function loadClicks() {
      try {
        setLoadingClicks(true);
        const res = await getPageClicks(selectedUrl);
        setClicks(res.data || []);
      } catch (err) {
        setError('Failed to fetch click coordinates: ' + err.message);
      } finally {
        setLoadingClicks(false);
      }
    }
    loadClicks();
  }, [selectedUrl]);

  // Aggregate Top Clicked Elements for this page
  const topElements = useMemo(() => {
    const counts = {};
    clicks.forEach((c) => {
      const key = `${c.elementTag || 'ELEMENT'}:${c.elementId || ''}:${c.elementText || ''}`;
      if (!counts[key]) {
        counts[key] = {
          tag: c.elementTag || 'ELEMENT',
          id: c.elementId || '',
          text: c.elementText || '(No text)',
          count: 0,
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [clicks]);

  // Generate 10x10 grid matrix distribution
  const gridCells = useMemo(() => {
    if (renderMode !== 'grid' || clicks.length === 0) return [];
    const matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
    let maxCellCount = 1;

    clicks.forEach((c) => {
      let xPct = c.xPercent;
      let yPct = c.yPercent;

      // Fallback if xPercent is not stored
      if (xPct === null || xPct === undefined) {
        xPct = Math.min(99, Math.max(0, (c.x / 1440) * 100));
      }
      if (yPct === null || yPct === undefined) {
        yPct = Math.min(99, Math.max(0, (c.y / 900) * 100));
      }

      const col = Math.min(9, Math.floor(xPct / 10));
      const row = Math.min(9, Math.floor(yPct / 10));
      matrix[row][col]++;
      if (matrix[row][col] > maxCellCount) maxCellCount = matrix[row][col];
    });

    const cells = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const count = matrix[r][c];
        const intensity = count > 0 ? (count / maxCellCount).toFixed(2) : 0;
        cells.push({ row: r, col: c, count, intensity });
      }
    }
    return cells;
  }, [clicks, renderMode]);

  return (
    <div className="heatmap-view-container animate-fade-in">
      {/* Top Configuration & Page Selector Bar */}
      <div className="heatmap-control-bar glass-card">
        {/* Page Selector */}
        <div className="page-selector-group">
          <label className="selector-label">Tracked Page URL:</label>
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

        {/* Display Mode Switcher */}
        <div className="render-mode-group">
          <label className="selector-label">Visual Heatmap Mode:</label>
          <div className="mode-btn-group">
            <button
              className={`mode-btn ${renderMode === 'dots' ? 'active' : ''}`}
              onClick={() => setRenderMode('dots')}
            >
              🔴 Glow Heatmap
            </button>
            <button
              className={`mode-btn ${renderMode === 'grid' ? 'active' : ''}`}
              onClick={() => setRenderMode('grid')}
            >
              ▦ Density Grid
            </button>
            <button
              className={`mode-btn ${renderMode === 'pins' ? 'active' : ''}`}
              onClick={() => setRenderMode('pins')}
            >
              📍 Precision Pins
            </button>
          </div>
        </div>

        {/* Backdrop Switcher */}
        <div className="backdrop-mode-group">
          <label className="selector-label">Canvas Background:</label>
          <div className="mode-btn-group">
            <button
              className={`mode-btn ${backdropMode === 'wireframe' ? 'active' : ''}`}
              onClick={() => setBackdropMode('wireframe')}
            >
              📐 Store Wireframe
            </button>
            <button
              className={`mode-btn ${backdropMode === 'canvas' ? 'active' : ''}`}
              onClick={() => setBackdropMode('canvas')}
            >
              ⬛ Studio Canvas
            </button>
          </div>
        </div>
      </div>

      {/* Heatmap Metrics Strip */}
      <div className="heatmap-stats-strip glass-card">
        <div className="h-stat">
          <span className="h-stat-label">Total Page Clicks:</span>
          <span className="h-stat-val" style={{ color: '#fbbf24' }}>
            {clicks.length}
          </span>
        </div>
        <div className="h-stat">
          <span className="h-stat-label">Contributing Sessions:</span>
          <span className="h-stat-val" style={{ color: '#a5b4fc' }}>
            {new Set(clicks.map((c) => c.sessionId)).size}
          </span>
        </div>
        <div className="h-stat">
          <span className="h-stat-label">Active Point Blur:</span>
          <input
            type="range"
            min="12"
            max="48"
            value={pointRadius}
            onChange={(e) => setPointRadius(Number(e.target.value))}
            className="slider-input"
          />
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {pointRadius}px
          </span>
        </div>
        <div className="h-stat">
          <span className="h-stat-label">Intensity Opacity:</span>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="slider-input"
          />
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Main Heatmap Stage & Elements Panel */}
      <div className="heatmap-stage-grid">
        {/* Heatmap Canvas Box */}
        <div className="glass-card heatmap-canvas-card">
          <div className="canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="canvas-dot"></span>
              <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                VIEWPORT OVERLAY: {selectedUrl || 'No page selected'}
              </span>
            </div>
            <span className="badge badge-click">{clicks.length} CLICKS RENDERED</span>
          </div>

          <div
            ref={canvasContainerRef}
            className={`heatmap-canvas-container ${backdropMode === 'wireframe' ? 'wireframe-bg' : 'dark-canvas-bg'}`}
          >
            {/* Wireframe Mock Layout for Store Preview */}
            {backdropMode === 'wireframe' && (
              <div className="wireframe-mock-layout">
                <div className="wf-header">
                  <div className="wf-brand">Aura Store</div>
                  <div className="wf-nav-items">Home • Products • Checkout</div>
                  <div className="wf-cart">Cart (0)</div>
                </div>
                <div className="wf-hero">
                  <div className="wf-badge">Collection 2026</div>
                  <div className="wf-title">Minimalist Essentials</div>
                  <div className="wf-buttons">
                    <span className="wf-btn">Explore Collection</span>
                    <span className="wf-btn">Quick Add</span>
                  </div>
                </div>
                <div className="wf-grid">
                  <div className="wf-card">Runner V2</div>
                  <div className="wf-card">Cotton Tee</div>
                  <div className="wf-card">Waterproof Bag</div>
                </div>
              </div>
            )}

            {/* Density Grid Mode Rendering */}
            {renderMode === 'grid' && (
              <div className="heatmap-density-grid">
                {gridCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className="grid-cell"
                    style={{
                      backgroundColor:
                        cell.count > 0
                          ? `rgba(239, 68, 68, ${Math.min(0.9, cell.intensity * 0.85 + 0.15)})`
                          : 'transparent',
                    }}
                    title={`Cell (${cell.col}, ${cell.row}): ${cell.count} clicks`}
                  >
                    {cell.count > 0 && <span className="cell-count-text">{cell.count}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Glow Dots & Precision Pins Rendering */}
            {renderMode !== 'grid' &&
              clicks.map((c, i) => {
                // Determine responsive coordinate positioning
                const left = c.xPercent !== null && c.xPercent !== undefined ? `${c.xPercent}%` : `${c.x}px`;
                const top = c.yPercent !== null && c.yPercent !== undefined ? `${c.yPercent}%` : `${c.y}px`;

                if (renderMode === 'pins') {
                  return (
                    <div
                      key={c._id || i}
                      className="heatmap-pin"
                      style={{
                        left,
                        top,
                        opacity,
                      }}
                      onMouseEnter={() => setHoveredClick(c)}
                      onMouseLeave={() => setHoveredClick(null)}
                    >
                      <div className="pin-marker"></div>
                      <span className="pin-tag">{c.elementTag || 'CLICK'}</span>
                    </div>
                  );
                }

                // Render Glow Dots Mode
                return (
                  <div
                    key={c._id || i}
                    className="heatmap-glow-dot"
                    style={{
                      left,
                      top,
                      width: `${pointRadius * 2}px`,
                      height: `${pointRadius * 2}px`,
                      opacity,
                    }}
                    onMouseEnter={() => setHoveredClick(c)}
                    onMouseLeave={() => setHoveredClick(null)}
                  />
                );
              })}

            {/* Interactive Tooltip on Point Hover */}
            {hoveredClick && (
              <div
                className="heatmap-hover-tooltip glass-card mono"
                style={{
                  left:
                    hoveredClick.xPercent !== null
                      ? `calc(${hoveredClick.xPercent}% + 15px)`
                      : `${hoveredClick.x + 15}px`,
                  top:
                    hoveredClick.yPercent !== null
                      ? `calc(${hoveredClick.yPercent}% + 15px)`
                      : `${hoveredClick.y + 15}px`,
                }}
              >
                <div className="tooltip-title">
                  📍 Click @ ({hoveredClick.x}px, {hoveredClick.y}px)
                </div>
                <div className="tooltip-row">
                  Target: <strong>&lt;{hoveredClick.elementTag || 'ELEMENT'}&gt;</strong>{' '}
                  {hoveredClick.elementId ? `#${hoveredClick.elementId}` : ''}
                </div>
                {hoveredClick.elementText && (
                  <div className="tooltip-row">
                    Text: "<em>{hoveredClick.elementText}</em>"
                  </div>
                )}
                <div className="tooltip-row" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Session: {hoveredClick.sessionId}
                </div>
              </div>
            )}

            {/* Loading / Empty States */}
            {loadingClicks && (
              <div className="canvas-overlay-message">
                <div className="spin-icon" style={{ fontSize: '2rem' }}>🔄</div>
                <p>Fetching click positions for selected page...</p>
              </div>
            )}

            {!loadingClicks && clicks.length === 0 && (
              <div className="canvas-overlay-message">
                <div style={{ fontSize: '2.5rem' }}>🎯</div>
                <h3>No Click Data For This URL</h3>
                <p>Click on elements on the demo store to generate click coordinates.</p>
                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                >
                  Visit Store & Click Elements
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Top Clicked Elements Breakdown Sidebar */}
        <div className="glass-card top-elements-card">
          <h3 className="sidebar-title">🔥 Top Clicked Elements</h3>
          <p className="sidebar-subtext">Most interacted DOM targets on this page</p>

          {topElements.length === 0 ? (
            <div className="empty-subtext">No elements recorded yet.</div>
          ) : (
            <div className="elements-list">
              {topElements.map((item, idx) => {
                const pct = clicks.length > 0 ? Math.round((item.count / clicks.length) * 100) : 0;
                return (
                  <div key={idx} className="element-rank-item">
                    <div className="element-rank-header">
                      <div className="rank-badge">#{idx + 1}</div>
                      <div className="element-info">
                        <span className="element-tag-pill mono">
                          &lt;{item.tag}&gt; {item.id ? `#${item.id}` : ''}
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
                  </div>
                );
              })}
            </div>
          )}

          <div className="heatmap-info-box">
            <h4>💡 How It Works</h4>
            <p>
              The client tracking script registers every user click with both absolute page coordinates (x, y) and normalized viewport percentages (xPercent, yPercent). This guarantees heatmaps scale responsively across all screen sizes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
