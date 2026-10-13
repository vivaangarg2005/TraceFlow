import React, { useState } from 'react';

export default function UserJourneyModal({ sessionData, events, loading, onClose, userMode }) {
  const [selectedRawEvent, setSelectedRawEvent] = useState(null);
  const [modalMode, setModalMode] = useState(userMode || 'owner'); // 'owner' | 'tech'

  if (!sessionData) return null;

  function formatTime(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: true,
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

  // Generate plain-English story description of an event
  function getStoryText(evt) {
    if (evt.eventType === 'page_view') {
      const path = evt.path || evt.url;
      if (path.includes('checkout')) return 'Navigated to Secure Checkout Page';
      if (path.includes('product')) return 'Viewed Product Details Page';
      return `Landed on Storefront (${evt.title || path})`;
    }

    if (evt.eventType === 'click') {
      const tag = evt.elementTag || 'element';
      const text = evt.elementText ? `"${evt.elementText}"` : '';
      const id = evt.elementId ? `#${evt.elementId}` : '';

      if (id.includes('cart') || text.toLowerCase().includes('cart')) {
        return `Added item to cart: clicked ${text || 'Add to Cart'}`;
      }
      if (id.includes('checkout') || text.toLowerCase().includes('order')) {
        return `Initiated checkout: clicked ${text || 'Complete Order'}`;
      }
      if (text.toLowerCase().includes('explore') || text.toLowerCase().includes('shop')) {
        return `Engaged with hero call-to-action: clicked ${text}`;
      }
      if (id.includes('size')) {
        return `Selected product sizing option ${text}`;
      }
      return `Clicked ${tag.toLowerCase()} ${text} in ${evt.elementSection || 'main'} section`;
    }

    return 'User action recorded';
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">
              <span className="live-indicator-dot"></span>
              {sessionData.isSimulated ? 'DEMO SIMULATION AUDIT' : 'GENUINE VISITOR JOURNEY'}
            </div>
            <h2 className="modal-title">
              {modalMode === 'owner' ? (
                <>
                  Customer Journey: <strong>{sessionData.visitorLabel || 'Visitor'}</strong>
                </>
              ) : (
                <>
                  Session <span className="mono" style={{ color: '#a5b4fc', fontSize: '1.1rem' }}>{sessionData.sessionId}</span>
                </>
              )}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Modal Local Mode Switcher */}
            <div className="mode-toggle-pill">
              <button
                className={`mode-pill-btn ${modalMode === 'owner' ? 'active' : ''}`}
                onClick={() => setModalMode('owner')}
              >
                Story View
              </button>
              <button
                className={`mode-pill-btn ${modalMode === 'tech' ? 'active' : ''}`}
                onClick={() => setModalMode('tech')}
              >
                Technical View
              </button>
            </div>

            <button className="modal-close-btn" onClick={onClose} title="Close Inspection Modal">
              ✕
            </button>
          </div>
        </div>

        {/* Milestone Summary Strip */}
        <div className="journey-summary-strip">
          <div className="summary-metric">
            <div className="summary-label">Total Actions</div>
            <div className="summary-val">{events.length}</div>
          </div>
          <div className="summary-metric">
            <div className="summary-label">Active Time</div>
            <div className="summary-val">{sessionData.durationSeconds || 0}s</div>
          </div>
          <div className="summary-metric">
            <div className="summary-label">Pages Explored</div>
            <div className="summary-val" style={{ color: '#38bdf8' }}>
              {new Set(events.map((e) => e.path || e.url)).size}
            </div>
          </div>
          <div className="summary-metric">
            <div className="summary-label">Cart Engagement</div>
            <div className="summary-val" style={{ color: events.some((e) => e.elementId?.includes('cart') || e.elementText?.toLowerCase().includes('cart')) ? '#34d399' : '#94a3b8' }}>
              {events.some((e) => e.elementId?.includes('cart') || e.elementText?.toLowerCase().includes('cart')) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="summary-metric">
            <div className="summary-label">Device Type</div>
            <div className="summary-val" style={{ textTransform: 'capitalize' }}>
              {sessionData.deviceType || 'Desktop'}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Timeline Body */}
        <div className="modal-body">
          {loading ? (
            <div className="timeline-loading">
              <div className="spin-icon" style={{ fontSize: '2rem' }}>🔄</div>
              <p>Replaying recorded event stream...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <p>No events found for this session.</p>
            </div>
          ) : (
            <div className="timeline-container">
              {events.map((evt, index) => {
                const prevEvt = index > 0 ? events[index - 1] : null;
                const isPageView = evt.eventType === 'page_view';
                const delta = getDeltaSeconds(evt, prevEvt);

                return (
                  <div key={evt._id || index} className="timeline-item">
                    {/* Left Icon and Connector Line */}
                    <div className="timeline-left">
                      <div className={`timeline-badge ${isPageView ? 'badge-view' : 'badge-click'}`}>
                        {isPageView ? '👁️' : '🎯'}
                      </div>
                      {index < events.length - 1 && <div className="timeline-connector"></div>}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="timeline-content-card">
                      <div className="timeline-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="step-tag">STEP #{index + 1}</span>
                          <span className={`badge ${isPageView ? 'badge-pageview' : 'badge-click'}`}>
                            {evt.eventType.toUpperCase()}
                          </span>
                          <span className="step-delta mono">{delta}</span>
                        </div>
                        <span className="step-timestamp mono">{formatTime(evt.timestamp)}</span>
                      </div>

                      {/* Store Owner Story Description */}
                      <div className="timeline-story-title">
                        {getStoryText(evt)}
                      </div>

                      {/* Page and Path */}
                      <div className="detail-row" style={{ marginTop: '0.4rem' }}>
                        <span className="detail-label">Page:</span>
                        <span className="detail-url mono" title={evt.url}>
                          {evt.path || evt.url}
                        </span>
                      </div>

                      {/* Technical Details (When in Technical Mode or Expanded) */}
                      {modalMode === 'tech' && (
                        <div className="click-details-panel animate-fade-in" style={{ marginTop: '0.6rem' }}>
                          {!isPageView ? (
                            <>
                              <div className="click-coords-grid">
                                <div className="coord-box">
                                  <span className="coord-label">DOCUMENT COORD (X, Y)</span>
                                  <span className="coord-val mono">
                                    X: {evt.x}px • Y: {evt.y}px
                                  </span>
                                </div>
                                <div className="coord-box">
                                  <span className="coord-label">PAGE % (RESPONSIVE)</span>
                                  <span className="coord-val mono">
                                    {evt.xPercent}% W • {evt.yPercent}% H
                                  </span>
                                </div>
                                <div className="coord-box">
                                  <span className="coord-label">ELEMENT LANDMARK</span>
                                  <span className="coord-val mono">
                                    &lt;{evt.elementTag}&gt; in {evt.elementSection || 'main'}
                                  </span>
                                </div>
                              </div>

                              {evt.elementSelector && (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                                  Selector: <code className="mono" style={{ color: '#c7d2fe' }}>{evt.elementSelector}</code>
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              Viewport: {evt.viewportWidth}×{evt.viewportHeight}px • Document: {evt.documentWidth}×{evt.documentHeight}px
                            </div>
                          )}

                          {/* Raw Payload Collapsible */}
                          <div className="payload-toggle-row">
                            <button
                              className="btn-link"
                              onClick={() =>
                                setSelectedRawEvent(selectedRawEvent === evt._id ? null : evt._id)
                              }
                            >
                              {selectedRawEvent === evt._id ? '▲ Hide Raw JSON' : '▼ Inspect Raw JSON'}
                            </button>
                            {selectedRawEvent === evt._id && (
                              <pre className="raw-payload-box mono">
                                {JSON.stringify(evt, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            ℹ️ <em>Chronological record of user interactions. Does not record raw mouse movements or video replay.</em>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
