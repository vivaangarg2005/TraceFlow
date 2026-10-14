import React, { useState, useMemo } from 'react';

export default function SessionsView({
  sessions,
  loading,
  userMode,
  onSelectSession,
  onSimulate,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
}) {
  const [filterType, setFilterType] = useState('all'); // all, multi-page, high-activity, bounces
  const [copiedId, setCopiedId] = useState(null);

  // Time format helper - Clean HH:MM:SS AM/PM
  function formatTime(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  // Date format helper - Clean Month Day, Year
  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function copySessionId(e, id) {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filter sessions based on search and intent pills
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        s.sessionId.toLowerCase().includes(q) ||
        (s.entryPage && s.entryPage.toLowerCase().includes(q)) ||
        (s.exitPage && s.exitPage.toLowerCase().includes(q)) ||
        (s.pathsVisited && s.pathsVisited.some((p) => p.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (filterType === 'multi-page') {
        return (s.uniquePagesCount || 1) > 1;
      }
      if (filterType === 'high-activity') {
        return s.totalEvents >= 4;
      }
      if (filterType === 'bounces') {
        return s.totalEvents === 1 && s.pageViews === 1;
      }
      return true;
    });
  }, [sessions, searchQuery, filterType]);

  return (
    <div className="sessions-view-container animate-fade-in">
      {/* Control Bar: Search, Category Filters, Sort */}
      <div className="sessions-control-bar glass-card">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={
              userMode === 'owner'
                ? "Search by entry page (e.g. /product.html) or visitor path..."
                : "Search by session ID or path..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-pill-group">
          <button
            className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Visits ({sessions.length})
          </button>
          <button
            className={`filter-pill ${filterType === 'multi-page' ? 'active' : ''}`}
            onClick={() => setFilterType('multi-page')}
          >
            Multi-Page Journeys
          </button>
          <button
            className={`filter-pill ${filterType === 'high-activity' ? 'active' : ''}`}
            onClick={() => setFilterType('high-activity')}
          >
            Engaged (≥4 actions)
          </button>
          <button
            className={`filter-pill ${filterType === 'bounces' ? 'active' : ''}`}
            onClick={() => setFilterType('bounces')}
          >
            Single-Page Bounces
          </button>
        </div>

        {/* Sort Selector */}
        <div className="sort-select-wrapper">
          <span className="sort-label">Sort:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="lastSeen_desc">Most Recent Activity</option>
            <option value="events_desc">Highest Actions</option>
            <option value="duration_desc">Longest Duration</option>
            <option value="firstSeen_asc">Earliest First Seen</option>
          </select>
        </div>
      </div>

      {/* Sessions Table Card */}
      <div className="glass-card table-card">
        {loading && sessions.length === 0 ? (
          <div className="empty-state">
            <div className="spin-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              🔄
            </div>
            <h3>Loading Customer Activity Records...</h3>
            <p>Querying MongoDB aggregation engine...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕵️</div>
            <h3>No Visitor Sessions Match Filter</h3>
            <p>
              {searchQuery
                ? `No sessions found matching "${searchQuery}". Try clearing search or selecting a wider date range.`
                : 'No interactions have been recorded for the selected time range.'}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a
                href={
                  import.meta.env.VITE_DEMO_URL ||
                  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                    ? '/demo/index.html'
                    : 'http://localhost:3000')
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
              >
                🛍️ Visit Store to Generate Events
              </a>
              <button onClick={onSimulate} className="btn btn-secondary btn-sm">
                ⚡ Simulate Test Activity
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>{userMode === 'owner' ? 'Visitor & Intent' : 'Session Identifier'}</th>
                  <th>Entry & Exit Pages</th>
                  <th>Total Actions</th>
                  <th>Active Duration</th>
                  <th>Pages Visited</th>
                  <th>Last Recorded Activity</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr
                    key={s.sessionId}
                    className="session-row"
                    onClick={() => onSelectSession(s)}
                  >
                    {/* Visitor / Session ID cell */}
                    <td>
                      <div className="session-id-cell">
                        {userMode === 'owner' ? (
                          <>
                            <div className="visitor-primary-title">
                              <strong>{s.visitorLabel || 'Customer Visit'}</strong>
                              {s.isSimulated && (
                                <span className="sim-badge" title="Generated by test simulation">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <div className="visitor-intent-subtext">
                              <span className="intent-dot"></span>
                              {s.shopperSummary || 'Browsed items'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span className="session-id-text mono">{s.sessionId}</span>
                              <button
                                className="copy-btn"
                                onClick={(e) => copySessionId(e, s.sessionId)}
                                title="Copy full Session ID"
                              >
                                {copiedId === s.sessionId ? '✓' : '📋'}
                              </button>
                            </div>
                            <div className="device-tag mono">
                              {s.deviceType || 'desktop'} {s.isSimulated ? '• SIMULATED' : '• LIVE'}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Entry & Exit Pages */}
                    <td>
                      <div className="entry-exit-cell">
                        <div className="page-flow-item" title={`Landed on: ${s.entryPage}`}>
                          <span className="flow-label">In:</span>
                          <span className="flow-path mono">{s.entryPage || '/'}</span>
                        </div>
                        {s.exitPage && s.exitPage !== s.entryPage && (
                          <div className="page-flow-item" title={`Last active on: ${s.exitPage}`}>
                            <span className="flow-label" style={{ color: '#f59e0b' }}>Out:</span>
                            <span className="flow-path mono">{s.exitPage}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Actions & Breakdown */}
                    <td>
                      <div className="events-cell">
                        <div className="total-events-number">
                          <strong>{s.totalEvents}</strong> actions
                        </div>
                        <div className="events-breakdown-subtext">
                          <span className="badge badge-pageview" title="Page Views">
                            👁️ {s.pageViews}
                          </span>
                          <span className="badge badge-click" title="Clicks">
                            🎯 {s.clicks}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Active Duration */}
                    <td>
                      <div className="duration-cell">
                        <span className="duration-text mono">
                          {s.durationSeconds !== undefined ? `${s.durationSeconds}s` : '0s'}
                        </span>
                        {s.durationSeconds === 0 && (
                          <span className="bounce-tag">Bounce</span>
                        )}
                      </div>
                    </td>

                    {/* Pages Visited Chips */}
                    <td>
                      <div className="pages-visited-tags">
                        {s.pathsVisited && s.pathsVisited.length > 0 ? (
                          s.pathsVisited.slice(0, 3).map((path, idx) => (
                            <span key={idx} className="path-chip" title={path}>
                              {path.length > 18 ? path.slice(0, 18) + '…' : path}
                            </span>
                          ))
                        ) : (
                          <span className="path-chip">/</span>
                        )}
                        {s.pathsVisited && s.pathsVisited.length > 3 && (
                          <span className="path-chip-more">+{s.pathsVisited.length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Last active time */}
                    <td>
                      <div className="time-cell">
                        <div className="time-primary mono">{formatTime(s.lastSeen)}</div>
                        <div className="time-secondary">{formatDate(s.lastSeen)}</div>
                      </div>
                    </td>

                    {/* Action button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm inspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSession(s);
                        }}
                      >
                        <span>Inspect Journey</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
