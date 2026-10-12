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
        {/* Brand identity */}
        <div className="header-brand">
          <div className="brand-icon-box">
            <span className="brand-icon-glyph">✦</span>
          </div>
          <div>
            <div className="brand-title">
              TraceFlow <span className="brand-badge">ANALYTICS</span>
            </div>
            <div className="brand-subtitle">
              <span className="live-indicator-dot"></span>
              E-Commerce Interaction Intelligence
            </div>
          </div>
        </div>

        {/* Primary View Navigation */}
        <nav className="header-nav">
          <button
            className={`nav-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <span className="tab-icon">👥</span>
            <span>Visitor Journeys</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <span className="tab-icon">🔥</span>
            <span>Click Heatmaps</span>
          </button>
        </nav>

        {/* Global Controls: Time Range & Experience Mode */}
        <div className="header-controls">
          {/* Time Range Filter */}
          <div className="control-pill-select" title="Filter analytics by date range">
            <span className="control-icon">📅</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="header-select"
            >
              <option value="today">Today</option>
              <option value="24h">Past 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* User Mode: Store Owner vs Technical */}
          <div className="mode-toggle-pill">
            <button
              className={`mode-pill-btn ${userMode === 'owner' ? 'active' : ''}`}
              onClick={() => setUserMode('owner')}
              title="Simplified plain-English business metrics and shopper intent"
            >
              👔 Store Owner
            </button>
            <button
              className={`mode-pill-btn ${userMode === 'tech' ? 'active' : ''}`}
              onClick={() => setUserMode('tech')}
              title="Advanced developer mode: raw session IDs, coordinates, DOM selectors, JSON"
            >
              🛠️ Technical
            </button>
          </div>

          {/* Include Simulated Data Checkbox */}
          <label className="sim-toggle-label" title="Toggle inclusion of synthetic/demo simulation sessions">
            <input
              type="checkbox"
              checked={includeSimulated}
              onChange={(e) => setIncludeSimulated(e.target.checked)}
              className="sim-checkbox"
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
          >
            <span className={loading ? 'spin-icon' : ''}>🔄</span>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onGenerateDemo}
            disabled={isGenerating}
            title="Inject simulated shopper journey for testing"
          >
            <span>{isGenerating ? '⏳ Simulating...' : '⚡ Simulate Shopper'}</span>
          </button>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            title="Open test Aura Storefront"
          >
            <span>🛍️ Demo Store ↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
