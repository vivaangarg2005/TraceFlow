import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import OverviewCards from './components/OverviewCards';
import SessionsView from './components/SessionsView';
import HeatmapView from './components/HeatmapView';
import UserJourneyModal from './components/UserJourneyModal';
import { getOverview, getSessions, getSessionEvents, trackEvents, resetClicks } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'heatmap'
  const [userMode, setUserMode] = useState('owner'); // 'owner' | 'tech'
  const [timeRange, setTimeRange] = useState('all'); // 'today' | '24h' | '7d' | '30d' | 'all'
  const [includeSimulated, setIncludeSimulated] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('lastSeen_desc');

  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Selected session for journey modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [loadingJourney, setLoadingJourney] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Fetch analytics metrics and sessions based on active filters
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        timeRange,
        includeSimulated: includeSimulated ? 'true' : 'false',
        sort: sortOrder,
        search: searchQuery,
      };

      const [overviewRes, sessionsRes] = await Promise.all([
        getOverview(params),
        getSessions({ ...params, page: 1, limit: 100 }),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (sessionsRes.success) setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      showToast('⚠️ Could not connect to API server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, includeSimulated, sortOrder, searchQuery, showToast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Global reset for recorded click coordinates
  const handleResetClicks = async () => {
    if (!window.confirm('Are you sure you want to reset all click data? This will clear all recorded click hotspots and heatmap overlays.')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await resetClicks({ allEvents: 'false' });
      showToast(`🗑️ Click data reset: ${res.deletedCount || 0} clicks cleared.`);
      await loadData();
    } catch (err) {
      showToast('❌ Failed to reset clicks: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

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

  // Simulate realistic test user sessions with isSimulated flag and accurate document dimensions
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
          title: 'Aura Store — Modern Minimalist Apparel & Essentials',
          timestamp: new Date(now.getTime() - 8000).toISOString(),
          viewportWidth: 1440,
          viewportHeight: 900,
          documentWidth: 1440,
          documentHeight: 2100,
          scrollX: 0,
          scrollY: 0,
          deviceType: 'desktop',
          isSimulated: true,
        },
        {
          sessionId: newSessionId,
          eventType: 'click',
          url: 'http://localhost:3000/index.html',
          path: '/index.html',
          x: 280,
          y: 290,
          xPercent: 19.44,
          yPercent: 13.81,
          viewportWidth: 1440,
          viewportHeight: 900,
          documentWidth: 1440,
          documentHeight: 2100,
          scrollX: 0,
          scrollY: 0,
          elementTag: 'A',
          elementId: 'hero-cta-shop-now',
          elementText: 'Explore Collection',
          elementSection: 'hero',
          elementSelector: 'section#hero-banner > div > a#hero-cta-shop-now',
          deviceType: 'desktop',
          isSimulated: true,
          timestamp: new Date(now.getTime() - 6500).toISOString(),
        },
        {
          sessionId: newSessionId,
          eventType: 'click',
          url: 'http://localhost:3000/index.html',
          path: '/index.html',
          x: 480,
          y: 720,
          xPercent: 33.33,
          yPercent: 34.29,
          viewportWidth: 1440,
          viewportHeight: 900,
          documentWidth: 1440,
          documentHeight: 2100,
          scrollX: 0,
          scrollY: 300,
          elementTag: 'BUTTON',
          elementId: 'btn-cart-runner',
          elementText: 'Add to Cart',
          elementSection: 'catalog',
          elementSelector: 'div.product-card > div.product-footer > button#btn-cart-runner',
          deviceType: 'desktop',
          isSimulated: true,
          timestamp: new Date(now.getTime() - 4800).toISOString(),
        },
        {
          sessionId: newSessionId,
          eventType: 'page_view',
          url: 'http://localhost:3000/product.html?id=runner',
          path: '/product.html',
          title: 'Aura Store — Monochrome Runner V2',
          timestamp: new Date(now.getTime() - 3200).toISOString(),
          viewportWidth: 1440,
          viewportHeight: 900,
          documentWidth: 1440,
          documentHeight: 1600,
          scrollX: 0,
          scrollY: 0,
          deviceType: 'desktop',
          isSimulated: true,
        },
        {
          sessionId: newSessionId,
          eventType: 'click',
          url: 'http://localhost:3000/product.html?id=runner',
          path: '/product.html',
          x: 620,
          y: 540,
          xPercent: 43.06,
          yPercent: 33.75,
          viewportWidth: 1440,
          viewportHeight: 900,
          documentWidth: 1440,
          documentHeight: 1600,
          scrollX: 0,
          scrollY: 0,
          elementTag: 'BUTTON',
          elementId: 'btn-add-to-cart',
          elementText: 'Add to Cart',
          elementSection: 'product-details',
          elementSelector: 'div.product-details > div.action-row > button#btn-add-to-cart',
          deviceType: 'desktop',
          isSimulated: true,
          timestamp: new Date(now.getTime() - 1800).toISOString(),
        },
        {
          sessionId: newSessionId,
          eventType: 'page_view',
          url: 'http://localhost:3000/checkout.html',
          path: '/checkout.html',
          title: 'Aura Store — Secure Checkout',
          timestamp: new Date(now.getTime() - 800).toISOString(),
          viewportWidth: 1440,
          viewportHeight: 900,
          documentWidth: 1440,
          documentHeight: 1200,
          scrollX: 0,
          scrollY: 0,
          deviceType: 'desktop',
          isSimulated: true,
        },
      ];

      await trackEvents(sampleEvents);
      showToast(`⚡ Generated demo visit "${newSessionId}" with 6 simulated funnel steps!`);
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
        userMode={userMode}
        setUserMode={setUserMode}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        includeSimulated={includeSimulated}
        setIncludeSimulated={setIncludeSimulated}
        onRefresh={loadData}
        loading={loading}
        onGenerateDemo={handleGenerateDemo}
        isGenerating={isGenerating}
        onResetClicks={handleResetClicks}
        isResetting={isResetting}
      />

      {/* Main Dashboard Body */}
      <main className="app-container">
        {/* KPI Metrics Strip */}
        <OverviewCards overview={overview} userMode={userMode} />

        {/* View Switcher: Sessions vs Heatmap */}
        {activeTab === 'sessions' ? (
          <SessionsView
            sessions={sessions}
            loading={loading}
            userMode={userMode}
            onSelectSession={handleSelectSession}
            onSimulate={handleGenerateDemo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        ) : (
          <HeatmapView
            userMode={userMode}
            timeRange={timeRange}
            includeSimulated={includeSimulated}
          />
        )}
      </main>

      {/* Modal: Chronological User Journey */}
      {selectedSession && (
        <UserJourneyModal
          sessionData={selectedSession}
          events={sessionEvents}
          loading={loadingJourney}
          userMode={userMode}
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
