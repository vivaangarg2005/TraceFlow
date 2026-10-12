import React from 'react';

export default function OverviewCards({ overview, userMode }) {
  if (!overview) return null;

  const {
    totalSessions = 0,
    totalEvents = 0,
    totalPageViews = 0,
    totalClicks = 0,
    avgEventsPerSession = 0,
    avgDurationSeconds = 0,
    bounceSessionsCount = 0,
    bounceRate = 0,
    deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 },
    simulatedEventsCount = 0,
    genuineEventsCount = 0,
  } = overview;

  const clickPercent = totalEvents > 0 ? ((totalClicks / totalEvents) * 100).toFixed(1) : 0;
  const viewPercent = totalEvents > 0 ? ((totalPageViews / totalEvents) * 100).toFixed(1) : 0;

  const cards = [
    {
      title: userMode === 'owner' ? 'Total Store Visits' : 'Unique Sessions',
      value: totalSessions.toLocaleString(),
      subtext: `${bounceSessionsCount} left after 1 page (${bounceRate}% bounce rate)`,
      icon: '👥',
      accentColor: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.12)',
      tooltip: 'Total distinct browsing visits recorded in the selected time period.',
    },
    {
      title: userMode === 'owner' ? 'Recorded Actions' : 'Total Ingested Events',
      value: totalEvents.toLocaleString(),
      subtext: `${totalPageViews} pageviews • ${totalClicks} clicks`,
      icon: '⚡',
      accentColor: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.12)',
      tooltip: 'Every user click and page load logged by the client tracking script.',
    },
    {
      title: userMode === 'owner' ? 'Average Visit Depth' : 'Events / Session',
      value: avgEventsPerSession,
      subtext: 'Actions performed per customer visit',
      icon: '📈',
      accentColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      tooltip: 'Measures how deeply customers explore your storefront on average.',
    },
    {
      title: userMode === 'owner' ? 'Average Active Time' : 'Mean Session Duration',
      value: `${avgDurationSeconds}s`,
      subtext: 'Time between first and last recorded action',
      icon: '⏱️',
      accentColor: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.12)',
      tooltip: 'Calculated from the time difference between the first and last event in a session.',
    },
    {
      title: userMode === 'owner' ? 'Interaction Density' : 'Click vs View Ratio',
      value: `${clickPercent}%`,
      subtext: `${totalClicks} clicks out of ${totalEvents} total actions`,
      icon: '🎯',
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      tooltip: 'Percentage of total actions that were clicks rather than passive page loads.',
    },
  ];

  return (
    <div className="overview-container animate-fade-in">
      <div className="overview-grid">
        {cards.map((c, idx) => (
          <div key={idx} className="glass-card stat-card" title={c.tooltip}>
            <div className="stat-card-header">
              <span className="stat-title">{c.title}</span>
              <div
                className="stat-icon-wrapper"
                style={{ background: c.bgGlow, color: c.accentColor }}
              >
                <span>{c.icon}</span>
              </div>
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-subtext">{c.subtext}</div>
          </div>
        ))}
      </div>

      {/* Trust & Sample Audit Banner */}
      <div className="overview-meta-bar">
        <div className="meta-item">
          <span className="meta-label">Data Integrity Audit:</span>
          <span className="meta-value">
            {genuineEventsCount} genuine events ({simulatedEventsCount} demo simulations)
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Device Distribution:</span>
          <span className="meta-value">
            💻 {deviceBreakdown.desktop} desktop • 📱 {deviceBreakdown.mobile} mobile • 📟 {deviceBreakdown.tablet} tablet
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-hint">
            💡 <em>Facts recorded directly by tracker. No fabricated conversion rates or bounce assumptions.</em>
          </span>
        </div>
      </div>
    </div>
  );
}
