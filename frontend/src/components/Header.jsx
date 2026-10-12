import React from 'react';

export default function Header({
  activeTab,
  setActiveTab,
  userMode,
  setUserMode,
  timeRange,
  setTimeRange,
  includeSimulated,
  setIncludeSimulated,
  onRefresh,
  loading,
  onGenerateDemo,
  isGenerating,
}) {
  return (
    <header className="header-glass">
      <div className="header-inner">
        {/* Left Cluster: Brand Identity + Navigation Tabs */}
        <div className="header-brand-group">
          {/* Brand Identity */}
          <div className="header-brand">
            <div className="brand-icon-box">
              <span className="brand-icon-glyph">✦</span>
            </div>
            <div className="brand-text-block">
              <div className="brand-title">
                TraceFlow <span className="brand-badge">ANALYTICS</span>
              </div>
              <div className="brand-subtitle">
                <span className="live-indicator-dot"></span>
                <span className="brand-subtitle-text">E-Commerce Interaction Intelligence</span>
              </div>
            </div>
          </div>

          {/* Primary View Navigation Tabs */}
          <nav className="header-nav" aria-label="Primary Analytics Navigation">
            <button
              className={`nav-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
              id="tab-visitor-journeys"
              title="Inspect chronological user sessions and shopper intent"
            >
              <span className="tab-icon">👥</span>
              <span className="tab-label">Visitor Journeys</span>
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('heatmap')}
              id="tab-click-heatmaps"
              title="Inspect spatial click density and page hotspots"
            >
              <span className="tab-icon">🔥</span>
              <span className="tab-label">Click Heatmaps</span>
            </button>
          </nav>
        </div>

        {/* Right Cluster: Contextual Filters & Global Actions */}
        <div className="header-tools-group">
          {/* Global Controls: Time Range & Experience Mode */}
          <div className="header-controls">
            {/* Time Range Filter */}
            <div className="control-pill-select" title="Filter analytics by date range">
              <span className="control-icon">📅</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="header-select"
                id="select-timerange"
                aria-label="Filter analytics date range"
              >
                <option value="today">Today</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* User Mode: Store Owner vs Technical */}
            <div className="mode-toggle-pill" role="group" aria-label="Audience Perspective Mode">
              <button
                className={`mode-pill-btn ${userMode === 'owner' ? 'active' : ''}`}
                onClick={() => setUserMode('owner')}
                title="Simplified plain-English business metrics and shopper intent"
                id="toggle-owner-mode"
              >
                👔 <span className="mode-label-text">Store Owner</span>
              </button>
              <button
                className={`mode-pill-btn ${userMode === 'tech' ? 'active' : ''}`}
                onClick={() => setUserMode('tech')}
                title="Advanced developer mode: raw session IDs, coordinates, DOM selectors, JSON"
                id="toggle-tech-mode"
              >
                🛠️ <span className="mode-label-text">Technical</span>
              </button>
            </div>

            {/* Include Simulated Data Checkbox */}
            <label className="sim-toggle-label" title="Toggle inclusion of synthetic/demo simulation sessions">
              <input
                type="checkbox"
                checked={includeSimulated}
                onChange={(e) => setIncludeSimulated(e.target.checked)}
                className="sim-checkbox"
                id="checkbox-demo-data"
              />
              <span className="sim-label-text">Include Demo Data</span>
            </label>
          </div>

          {/* Header Action Buttons */}
          <div className="header-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh analytics data"
              id="btn-refresh"
            >
              <span className={loading ? 'spin-icon' : ''}>🔄</span>
              <span className="btn-label-text">{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onGenerateDemo}
              disabled={isGenerating}
              title="Inject simulated shopper journey for testing"
              id="btn-simulate-shopper"
            >
              <span>{isGenerating ? '⏳ Simulating...' : '⚡ Simulate Shopper'}</span>
            </button>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              title="Open test Aura Storefront in a new tab"
              id="btn-open-demo-store"
            >
              <span>🛍️ Demo Store ↗</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
