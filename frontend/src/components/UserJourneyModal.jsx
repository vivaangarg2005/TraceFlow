import React, { useState } from 'react';

export default function UserJourneyModal({ sessionData, events, loading, onClose }) {
  const [selectedRawEvent, setSelectedRawEvent] = useState(null);

  if (!sessionData) return null;

  function formatTime(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }

  // Calculate delta time in seconds from previous event
  function getDeltaSeconds(currentEvt, prevEvt) {
    if (!prevEvt) return '0.00s';
    const current = new Date(currentEvt.timestamp).getTime();
    const prev = new Date(prevEvt.timestamp).getTime();
    const diff = Math.max(0, (current - prev) / 1000);
    return `+${diff.toFixed(2)}s`;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">
              <span className="live-indicator-dot"></span>
              USER JOURNEY AUDIT
            </div>
            <h2 className="modal-title">
              Session <span className="mono" style={{ color: '#a5b4fc' }}>{sessionData.sessionId}</span>
            </h2>
          </div>

          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            ✕
          </button>
        </div>

        {/* Journey Metadata Strip */}
        <div className="journey-summary-strip">
          <div className="summary-metric">
            <span className="summary-label">Total Events</span>
            <span className="summary-val">{events.length}</span>
          </div>
          <div className="summary-metric">
            <span className="summary-label">Duration</span>
            <span className="summary-val">{sessionData.durationSeconds || 0}s</span>
          </div>
          <div className="summary-metric">
            <span className="summary-label">Page Views</span>
            <span className="summary-val" style={{ color: '#38bdf8' }}>
              {events.filter((e) => e.eventType === 'page_view').length}
            </span>
          </div>
          <div className="summary-metric">
            <span className="summary-label">Interactions / Clicks</span>
            <span className="summary-val" style={{ color: '#fbbf24' }}>
              {events.filter((e) => e.eventType === 'click').length}
            </span>
          </div>
          <div className="summary-metric">
            <span className="summary-label">Started At</span>
            <span className="summary-val mono" style={{ fontSize: '0.85rem' }}>
              {events[0] ? formatTime(events[0].timestamp) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="modal-body">
          {loading ? (
            <div className="timeline-loading">
              <div className="spin-icon" style={{ fontSize: '2rem' }}>🔄</div>
              <p>Replaying session event stream...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <p>No events recorded for this session.</p>
            </div>
          ) : (
            <div className="timeline-container">
              {events.map((evt, index) => {
                const prevEvt = index > 0 ? events[index - 1] : null;
                const isPageView = evt.eventType === 'page_view';

                return (
                  <div key={evt._id || index} className="timeline-item">
                    {/* Step number and connection line */}
                    <div className="timeline-left">
                      <div className={`timeline-badge ${isPageView ? 'badge-view' : 'badge-click'}`}>
                        {isPageView ? '👁️' : '🎯'}
                      </div>
                      {index < events.length - 1 && <div className="timeline-connector"></div>}
                    </div>

                    {/* Step card content */}
                    <div className="timeline-content-card">
                      <div className="timeline-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className="step-tag">STEP #{index + 1}</span>
                          <span
                            className={`badge ${isPageView ? 'badge-pageview' : 'badge-click'}`}
                          >
                            {evt.eventType.toUpperCase()}
                          </span>
                          <span className="step-delta mono">
                            {getDeltaSeconds(evt, prevEvt)}
                          </span>
                        </div>
                        <span className="step-timestamp mono">
                          {formatTime(evt.timestamp)}
                        </span>
                      </div>

                      {/* Event details */}
                      <div className="timeline-item-details">
                        {/* URL info */}
                        <div className="detail-row">
                          <span className="detail-label">Page:</span>
                          <span className="detail-url mono" title={evt.url}>
                            {evt.path || evt.url}
                          </span>
                        </div>

                        {/* If Click event, display coordinates and target element */}
                        {!isPageView && (
                          <div className="click-details-panel">
                            <div className="click-coords-grid">
                              <div className="coord-box">
                                <span className="coord-label">COORDINATES</span>
                                <span className="coord-val mono">
                                  X: {evt.x}px • Y: {evt.y}px
                                </span>
                              </div>

                              <div className="coord-box">
                                <span className="coord-label">VIEWPORT RATIO</span>
                                <span className="coord-val mono">
                                  {evt.xPercent !== null ? `${evt.xPercent}%` : 'N/A'} X •{' '}
                                  {evt.yPercent !== null ? `${evt.yPercent}%` : 'N/A'} Y
                                </span>
                              </div>

                              <div className="coord-box">
                                <span className="coord-label">TARGET ELEMENT</span>
                                <span className="coord-val mono">
                                  {evt.elementTag ? `<${evt.elementTag}>` : 'Generic'}
                                  {evt.elementId ? ` #${evt.elementId}` : ''}
                                </span>
                              </div>
                            </div>

                            {evt.elementText && (
                              <div className="clicked-text-row">
                                <span className="text-label">Clicked Text:</span>
                                <span className="clicked-text-quote">"{evt.elementText}"</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* If Pageview, display title or resolution */}
                        {isPageView && evt.title && (
                          <div className="detail-row" style={{ marginTop: '0.4rem' }}>
                            <span className="detail-label">Page Title:</span>
                            <span style={{ color: '#cbd5e1' }}>{evt.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Toggle inspect raw payload */}
                      <div className="payload-toggle-row">
                        <button
                          className="btn-link"
                          onClick={() =>
                            setSelectedRawEvent(selectedRawEvent === evt._id ? null : evt._id)
                          }
                        >
                          {selectedRawEvent === evt._id ? '▲ Hide Raw Payload' : '▼ View Raw Payload'}
                        </button>

                        {selectedRawEvent === evt._id && (
                          <pre className="raw-payload-box mono">
                            {JSON.stringify(evt, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Chronological User Journey reconstructed from MongoDB events stream
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
