import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import OverviewCards from './components/OverviewCards';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';
import UserJourneyModal from './components/UserJourneyModal';
import { getOverview, getSessions, getSessionEvents, trackEvents } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'heatmap'
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Selected session for journey modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [loadingJourney, setLoadingJourney] = useState(false);

  // Show toast notification
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Fetch all primary analytics data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, sessionsRes] = await Promise.all([
        getOverview(),
        getSessions(1, 100),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      showToast('⚠️ Could not connect to API server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    // Auto-refresh interval every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Inspect session journey
  const handleSelectSession = async (session) => {
    try {
      setSelectedSession(session);
      setLoadingJourney(true);
      const res = await getSessionEvents(session.sessionId);
      if (res.success) {
        setSessionEvents(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load session events:', err);
      showToast('⚠️ Failed to load user journey: ' + err.message);
    } finally {
      setLoadingJourney(false);
    }
  };

  // Simulate realistic test user sessions
  const handleGenerateDemo = async () => {
    try {
      setIsGenerating(true);
      const newSessionId = 'tf_sim_' + Math.random().toString(36).substring(2, 9);
      const now = new Date();

      const sampleEvents = [
        {
          sessionId: newSessionId,
          eventType: 'page_view',
          url: 'http://localhost:3000/index.html',
          path: '/index.html',
          title: 'Aura Store | Premium Minimalist Essentials',
          timestamp: new Date(now.getTime() - 4000).toISOString(),
          viewportWidth: 1440,
          viewportHeight: 900,
        },
        {
          sessionId: newSessionId,
          eventType: 'click',
          url: 'http://localhost:3000/index.html',
          path: '/index.html',
          x: 280,
          y: 290,
          xPercent: 19.4,
          yPercent: 32.2,
          viewportWidth: 1440,
          viewportHeight: 900,
          elementTag: 'A',
          elementId: 'hero-cta-shop-now',
          elementText: 'Explore Collection',
          timestamp: new Date(now.getTime() - 3200).toISOString(),
        },
        {
          sessionId: newSessionId,
          eventType: 'click',
          url: 'http://localhost:3000/index.html',
          path: '/index.html',
          x: 480,
          y: 640,
          xPercent: 33.3,
          yPercent: 71.1,
          viewportWidth: 1440,
          viewportHeight: 900,
          elementTag: 'BUTTON',
          elementId: 'btn-cart-runner',
          elementText: 'Add to Cart',
          timestamp: new Date(now.getTime() - 2100).toISOString(),
        },
        {
          sessionId: newSessionId,
          eventType: 'page_view',
          url: 'http://localhost:3000/product.html',
          path: '/product.html',
          title: 'Aura Store | Monochrome Runner V2 Details',
          timestamp: new Date(now.getTime() - 1500).toISOString(),
          viewportWidth: 1440,
          viewportHeight: 900,
        },
        {
          sessionId: newSessionId,
          eventType: 'click',
          url: 'http://localhost:3000/product.html',
          path: '/product.html',
          x: 720,
          y: 540,
          xPercent: 50.0,
          yPercent: 60.0,
          viewportWidth: 1440,
          viewportHeight: 900,
          elementTag: 'BUTTON',
          elementId: 'btn-add-to-cart',
          elementText: 'Add to Cart',
          timestamp: new Date(now.getTime() - 500).toISOString(),
        },
      ];

      await trackEvents(sampleEvents);
      showToast(`⚡ Generated sample session "${newSessionId}" with 5 events!`);
      await loadData();
    } catch (err) {
      console.error('Simulation error:', err);
      showToast('⚠️ Simulation error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-root">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={loadData}
        loading={loading}
        onGenerateDemo={handleGenerateDemo}
        isGenerating={isGenerating}
      />

      {/* Main Dashboard Body */}
      <main className="app-container">
        {/* KPI Metrics Strip */}
        <OverviewCards overview={overview} />

        {/* View Switcher: Sessions vs Heatmap */}
        {activeTab === 'sessions' ? (
          <SessionsView
            sessions={sessions}
            loading={loading}
            onSelectSession={handleSelectSession}
            onSimulate={handleGenerateDemo}
          />
        ) : (
          <HeatmapView />
        )}
      </main>

      {/* Modal: Chronological User Journey */}
      {selectedSession && (
        <UserJourneyModal
          sessionData={selectedSession}
          events={sessionEvents}
          loading={loadingJourney}
          onClose={() => {
            setSelectedSession(null);
            setSessionEvents([]);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
