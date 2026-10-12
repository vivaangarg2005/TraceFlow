import React, { useState, useMemo } from 'react';

export default function SessionsView({
  sessions,
  loading,
  onSelectSession,
  onSimulate,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, multi-page, high-activity

  // Format relative time helper
  function formatTime(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Filter sessions based on search query and filter pills
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.pathsVisited && s.pathsVisited.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      if (filterType === 'multi-page') {
        return (s.uniquePagesCount || 1) > 1;
      }
      if (filterType === 'high-activity') {
        return s.totalEvents >= 4;
      }
      return true;
    });
  }, [sessions, searchQuery, filterType]);

  return (
    <div className="sessions-view-container animate-fade-in">
      {/* Control bar: search, filters, count */}
      <div className="sessions-control-bar glass-card">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by Session ID or visited path (e.g. /product.html)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-pill-group">
          <button
            className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Sessions ({sessions.length})
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
            High Activity (≥4 events)
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="glass-card table-card">
        {loading && sessions.length === 0 ? (
          <div className="empty-state">
            <div className="spin-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              🔄
            </div>
            <h3>Loading active user sessions...</h3>
            <p>Querying MongoDB session aggregation pipeline...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕵️</div>
            <h3>No Sessions Found</h3>
            <p>
              {searchQuery
                ? `No sessions match "${searchQuery}". Try clearing the search query.`
                : 'No analytics events have been tracked yet. You can visit the demo store or simulate sessions.'}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="btn btn-primary">
                🛍️ Open Demo Store
              </a>
              <button onClick={onSimulate} className="btn btn-secondary">
                ⚡ Simulate Test Activity
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Session Identifier</th>
                  <th>Activity Breakdown</th>
                  <th>Total Events</th>
                  <th>Duration</th>
                  <th>Pages Visited</th>
                  <th>Last Interaction</th>
                  <th style={{ textAlign: 'right' }}>User Journey</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr
                    key={s.sessionId}
                    className="session-row"
                    onClick={() => onSelectSession(s)}
                  >
                    {/* Session ID */}
                    <td>
                      <div className="session-id-cell">
                        <span className="session-id-text mono">{s.sessionId}</span>
                      </div>
                    </td>

                    {/* Breakdown */}
                    <td>
                      <div className="breakdown-pills">
                        <span className="badge badge-pageview" title="Page Views">
                          👁️ {s.pageViews}
                        </span>
                        <span className="badge badge-click" title="Clicks">
                          🎯 {s.clicks}
                        </span>
                      </div>
                    </td>

                    {/* Total Events */}
                    <td>
                      <div className="total-events-pill">
                        <strong>{s.totalEvents}</strong> <span style={{ opacity: 0.7 }}>events</span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td>
                      <span className="duration-text mono">
                        {s.durationSeconds !== undefined ? `${s.durationSeconds}s` : '0s'}
                      </span>
                    </td>

                    {/* Pages Visited */}
                    <td>
                      <div className="pages-visited-tags">
                        {s.pathsVisited && s.pathsVisited.length > 0 ? (
                          s.pathsVisited.slice(0, 3).map((path, idx) => (
                            <span key={idx} className="path-chip" title={path}>
                              {path.length > 20 ? path.slice(0, 20) + '…' : path}
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
                        <span className="time-primary">{formatTime(s.lastSeen)}</span>
                        <span className="time-secondary">{formatDate(s.lastSeen)}</span>
                      </div>
                    </td>

                    {/* Inspect button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm inspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSession(s);
                        }}
                      >
                        <span>Replay Journey</span>
                        <span style={{ fontSize: '0.85rem' }}>→</span>
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
