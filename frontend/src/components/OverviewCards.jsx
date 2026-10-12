import React from 'react';

export default function OverviewCards({ overview }) {
  if (!overview) return null;

  const {
    totalSessions = 0,
    totalEvents = 0,
    totalPageViews = 0,
    totalClicks = 0,
    avgEventsPerSession = 0,
  } = overview;

  const clickRate = totalEvents > 0 ? ((totalClicks / totalEvents) * 100).toFixed(1) : 0;
  const viewRate = totalEvents > 0 ? ((totalPageViews / totalEvents) * 100).toFixed(1) : 0;

  const cards = [
    {
      title: 'Total Sessions',
      value: totalSessions.toLocaleString(),
      subtext: 'Unique user sessions recorded',
      icon: '👥',
      accentColor: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.12)',
    },
    {
      title: 'Total Events',
      value: totalEvents.toLocaleString(),
      subtext: 'Ingested interaction datapoints',
      icon: '⚡',
      accentColor: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.12)',
    },
    {
      title: 'Page Views',
      value: totalPageViews.toLocaleString(),
      subtext: `${viewRate}% of all interactions`,
      icon: '👁️',
      accentColor: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.12)',
    },
    {
      title: 'User Clicks',
      value: totalClicks.toLocaleString(),
      subtext: `${clickRate}% interaction density`,
      icon: '🎯',
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
    },
    {
      title: 'Avg Events / Session',
      value: avgEventsPerSession,
      subtext: 'Interaction depth per user',
      icon: '📈',
      accentColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  return (
    <div className="overview-grid animate-fade-in">
      {cards.map((c, idx) => (
        <div key={idx} className="glass-card stat-card">
          <div className="stat-card-header">
            <span className="stat-title">{c.title}</span>
            <div
              className="stat-icon-wrapper"
              style={{ background: c.bgGlow, color: c.accentColor }}
            >
              <span>{c.icon}</span>
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fff' }}>
            {c.value}
          </div>
          <div className="stat-subtext">{c.subtext}</div>
        </div>
      ))}
    </div>
  );
}
