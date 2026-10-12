import React from 'react';

export default function Header({
  activeTab,
  setActiveTab,
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
              CausalFunnel Session & Interaction Engine
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="header-nav">
          <button
            className={`nav-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <span className="tab-icon">👥</span>
            <span>Sessions View</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <span className="tab-icon">🔥</span>
            <span>Heatmap View</span>
          </button>
        </nav>

        {/* Action Controls */}
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
            title="Simulate realistic e-commerce user activity"
          >
            <span>{isGenerating ? '⏳ Generating...' : '⚡ Simulate Activity'}</span>
          </button>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            title="Open test e-commerce store with tracking script embedded"
          >
            <span>🛍️ Demo Store ↗</span>
          </a>
        </div>
      </div>
    </header>
  );
}
