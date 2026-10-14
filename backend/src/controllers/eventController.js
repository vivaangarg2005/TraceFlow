const Event = require('../models/Event');

/**
 * Helper to construct Date range filter from query parameters
 */
function buildDateFilter(query) {
  const { startDate, endDate, timeRange } = query;
  const now = new Date();
  let filter = {};

  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  } else if (timeRange) {
    filter.timestamp = {};
    switch (timeRange) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filter.timestamp.$gte = startOfToday;
        break;
      case '24h':
        filter.timestamp.$gte = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        filter.timestamp.$gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        filter.timestamp.$gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        delete filter.timestamp;
        break;
    }
  }

  return filter;
}

/**
 * Sanitize incoming element text for strict privacy
 */
function sanitizeText(rawText) {
  if (!rawText) return '';
  let str = String(rawText).trim().slice(0, 120);
  // Redact accidental emails or card numbers
  str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email Redacted]');
  str = str.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[Card Number Redacted]');
  return str;
}

/**
 * @desc    Ingest one or multiple analytics events
 * @route   POST /api/events
 * @access  Public (called by tracking script)
 */
exports.trackEvents = async (req, res, next) => {
  try {
    const payload = req.body;

    if (!payload) {
      return res.status(400).json({ success: false, message: 'Payload is required' });
    }

    const eventsArray = Array.isArray(payload) ? payload : [payload];

    if (eventsArray.length === 0) {
      return res.status(400).json({ success: false, message: 'Event list cannot be empty' });
    }

    const sanitizedEvents = eventsArray.map((evt) => {
      const {
        sessionId,
        eventType,
        url,
        timestamp,
        x,
        y,
        viewportWidth,
        viewportHeight,
        documentWidth,
        documentHeight,
        scrollX,
        scrollY,
        elementTag,
        elementText,
        elementId,
        elementSelector,
        elementSection,
        deviceType,
        isSimulated,
        title,
        metadata,
      } = evt;

      // Calculate percentages if not explicitly provided
      let xPercent = evt.xPercent;
      let yPercent = evt.yPercent;
      let clientXPercent = evt.clientXPercent;
      let clientYPercent = evt.clientYPercent;

      const docW = documentWidth || viewportWidth || 1;
      const docH = documentHeight || viewportHeight || 1;
      const vpW = viewportWidth || 1;
      const vpH = viewportHeight || 1;

      if (eventType === 'click' && typeof x === 'number' && typeof y === 'number') {
        if (xPercent === undefined || xPercent === null) {
          xPercent = Math.min(100, Math.max(0, Number(((x / docW) * 100).toFixed(2))));
        }
        if (yPercent === undefined || yPercent === null) {
          yPercent = Math.min(100, Math.max(0, Number(((y / docH) * 100).toFixed(2))));
        }
        if (clientXPercent === undefined || clientXPercent === null) {
          const clientX = x - (scrollX || 0);
          clientXPercent = Math.min(100, Math.max(0, Number(((clientX / vpW) * 100).toFixed(2))));
        }
        if (clientYPercent === undefined || clientYPercent === null) {
          const clientY = y - (scrollY || 0);
          clientYPercent = Math.min(100, Math.max(0, Number(((clientY / vpH) * 100).toFixed(2))));
        }
      }

      return {
        sessionId,
        eventType,
        url,
        title: title || '',
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        x: eventType === 'click' ? x : null,
        y: eventType === 'click' ? y : null,
        xPercent: eventType === 'click' ? xPercent : null,
        yPercent: eventType === 'click' ? yPercent : null,
        clientXPercent: eventType === 'click' ? clientXPercent : null,
        clientYPercent: eventType === 'click' ? clientYPercent : null,
        viewportWidth: viewportWidth || null,
        viewportHeight: viewportHeight || null,
        documentWidth: documentWidth || null,
        documentHeight: documentHeight || null,
        scrollX: scrollX || 0,
        scrollY: scrollY || 0,
        elementTag: elementTag || '',
        elementText: sanitizeText(elementText),
        elementId: elementId || '',
        elementSelector: elementSelector || '',
        elementSection: elementSection || 'main',
        deviceType: ['mobile', 'tablet', 'desktop'].includes(deviceType) ? deviceType : 'desktop',
        isSimulated: Boolean(isSimulated),
        metadata: metadata || {},
      };
    });

    // Validate essential fields before insert
    for (const evt of sanitizedEvents) {
      if (!evt.sessionId) {
        return res.status(400).json({ success: false, message: 'sessionId is required for all events' });
      }
      if (!evt.eventType || !['page_view', 'click'].includes(evt.eventType)) {
        return res.status(400).json({
          success: false,
          message: 'eventType must be either "page_view" or "click"',
        });
      }
      if (!evt.url) {
        return res.status(400).json({ success: false, message: 'url is required for all events' });
      }
      if (evt.eventType === 'click' && (evt.x === null || evt.x === undefined || evt.y === null || evt.y === undefined)) {
        return res.status(400).json({
          success: false,
          message: 'x and y coordinates are required for click events',
        });
      }
    }

    const createdEvents = await Event.insertMany(sanitizedEvents);

    return res.status(201).json({
      success: true,
      message: `Successfully tracked ${createdEvents.length} event(s)`,
      count: createdEvents.length,
      data: createdEvents.length === 1 ? createdEvents[0] : createdEvents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch list of sessions with human-readable summaries, entry pages, and filters
 * @route   GET /api/sessions
 * @access  Public (for dashboard)
 */
exports.getSessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const { includeSimulated, search, sort } = req.query;

    // Date range filter
    const matchFilter = buildDateFilter(req.query);

    // Optional filter to exclude simulated activity
    if (includeSimulated === 'false') {
      matchFilter.isSimulated = false;
    }

    // Aggregation pipeline: sort first to guarantee $first gets entry page
    const pipeline = [
      { $match: matchFilter },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          firstSeen: { $first: '$timestamp' },
          lastSeen: { $last: '$timestamp' },
          entryPage: { $first: '$path' },
          exitPage: { $last: '$path' },
          deviceType: { $first: '$deviceType' },
          isSimulated: { $max: '$isSimulated' },
          urlsVisited: { $addToSet: '$url' },
          pathsVisited: { $addToSet: '$path' },
          firstTitle: { $first: '$title' },
        },
      },
      {
        $project: {
          sessionId: '$_id',
          _id: 0,
          totalEvents: 1,
          pageViews: 1,
          clicks: 1,
          firstSeen: 1,
          lastSeen: 1,
          entryPage: { $ifNull: ['$entryPage', '/'] },
          exitPage: { $ifNull: ['$exitPage', '/'] },
          deviceType: { $ifNull: ['$deviceType', 'desktop'] },
          isSimulated: { $ifNull: ['$isSimulated', false] },
          durationSeconds: {
            $round: [
              {
                $divide: [{ $subtract: ['$lastSeen', '$firstSeen'] }, 1000],
              },
              1,
            ],
          },
          uniquePagesCount: { $size: '$urlsVisited' },
          pagesVisited: '$urlsVisited',
          pathsVisited: '$pathsVisited',
        },
      },
    ];

    // Optional text search filter on session, entryPage, or visited paths
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      pipeline.push({
        $match: {
          $or: [
            { sessionId: regex },
            { entryPage: regex },
            { exitPage: regex },
            { pathsVisited: regex },
          ],
        },
      });
    }

    // Sort order
    let sortStage = { lastSeen: -1 };
    if (sort === 'events_desc') sortStage = { totalEvents: -1 };
    if (sort === 'duration_desc') sortStage = { durationSeconds: -1 };
    if (sort === 'firstSeen_asc') sortStage = { firstSeen: 1 };
    pipeline.push({ $sort: sortStage });

    // Pagination facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        sessions: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const result = await Event.aggregate(pipeline);
    const totalSessions = result[0]?.metadata[0]?.total || 0;
    const rawSessions = result[0]?.sessions || [];

    // Augment each session with human-readable intent/journey summary
    const sessions = rawSessions.map((s, idx) => {
      let shopperSummary = 'Visitor';
      if (s.totalEvents >= 5 && s.uniquePagesCount > 1) {
        shopperSummary = 'Engaged Shopper';
      } else if (s.totalEvents === 1 && s.pageViews === 1) {
        shopperSummary = 'Single-Page Bounce';
      } else if (s.clicks >= 3) {
        shopperSummary = 'Active Product Browser';
      }

      return {
        ...s,
        visitorLabel: `Visitor #${totalSessions - skip - idx}`,
        shopperSummary,
      };
    });

    return res.status(200).json({
      success: true,
      total: totalSessions,
      page,
      limit,
      totalPages: Math.ceil(totalSessions / limit) || 1,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch all events for a specific session in chronological order (User Journey)
 * @route   GET /api/sessions/:sessionId/events
 * @access  Public (for dashboard)
 */
exports.getSessionEvents = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const events = await Event.find({ sessionId }).sort({ timestamp: 1 });

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No events found for session: ${sessionId}`,
      });
    }

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const durationSeconds = ((lastEvent.timestamp - firstEvent.timestamp) / 1000).toFixed(1);

    const pageViews = events.filter((e) => e.eventType === 'page_view').length;
    const clicks = events.filter((e) => e.eventType === 'click').length;

    // Detect milestones
    const visitedPages = [...new Set(events.map((e) => e.path || e.url))];
    const hasCartInteraction = events.some(
      (e) =>
        e.eventType === 'click' &&
        (e.elementId?.includes('cart') || e.elementText?.toLowerCase().includes('cart'))
    );
    const hasCheckoutInteraction = events.some(
      (e) =>
        e.path?.includes('checkout') ||
        e.elementId?.includes('checkout') ||
        e.elementText?.toLowerCase().includes('order')
    );

    return res.status(200).json({
      success: true,
      sessionId,
      isSimulated: events.some((e) => e.isSimulated),
      summary: {
        totalEvents: events.length,
        pageViews,
        clicks,
        startTime: firstEvent.timestamp,
        endTime: lastEvent.timestamp,
        durationSeconds: Number(durationSeconds),
        entryPage: firstEvent.path || firstEvent.url,
        exitPage: lastEvent.path || lastEvent.url,
        pagesCount: visitedPages.length,
        deviceType: firstEvent.deviceType || 'desktop',
        hasCartInteraction,
        hasCheckoutInteraction,
      },
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch click data for a specific page URL with heat statistics and section breakdown
 * @route   GET /api/analytics/clicks
 * @access  Public (for dashboard)
 */
exports.getPageClicks = async (req, res, next) => {
  try {
    const { url, path, deviceType, includeSimulated } = req.query;

    if (!url && !path) {
      return res.status(400).json({
        success: false,
        message: 'Either "url" or "path" query parameter is required (e.g. /api/analytics/clicks?url=...)',
      });
    }

    // Match either full URL or normalized pathname
    const filter = { eventType: 'click', ...buildDateFilter(req.query) };

    if (includeSimulated === 'false') {
      filter.isSimulated = false;
    }
    if (deviceType && ['desktop', 'tablet', 'mobile'].includes(deviceType)) {
      filter.deviceType = deviceType;
    }

    // Determine target relative path & clean full URL
    let targetRelative = path || '';

    if (url) {
      try {
        const parsed = new URL(url.startsWith('http') ? url : `http://example.local${url.startsWith('/') ? url : '/' + url}`);
        targetRelative = (parsed.pathname || '/index.html') + (parsed.search || '');
      } catch {
        targetRelative = url.startsWith('/') ? url : '/' + url;
      }
    } else if (path) {
      if (path === '/' || path === '') targetRelative = '/index.html';
    }

    if (!targetRelative || targetRelative === '/' || targetRelative === '') {
      targetRelative = '/index.html';
    }

    // Support both /index.html and /demo/index.html transparently
    let cleanPath = targetRelative;
    if (cleanPath.startsWith('/demo/')) {
      cleanPath = cleanPath.replace(/^\/demo/, '');
    }
    const demoPath = `/demo${cleanPath}`;

    const orConditions = [];

    if (cleanPath.includes('?')) {
      // For URLs with query strings (e.g. /product.html?id=watch), match strictly against this query
      const queryPart = cleanPath.split('?')[1];
      const escapedQuery = queryPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push(
        { path: cleanPath },
        { path: demoPath },
        { url: { $regex: escapedQuery, $options: 'i' } },
        { path: { $regex: escapedQuery, $options: 'i' } }
      );
    } else if (cleanPath === '/index.html') {
      // Home page: '/' vs '/index.html' vs '/demo/' vs '/demo/index.html' (and exclude query strings if any)
      orConditions.push({
        $and: [
          {
            $or: [
              { path: '/' },
              { path: '/index.html' },
              { path: '/demo/' },
              { path: '/demo/index.html' },
              { url: { $regex: '(/index\\.html|/demo/?|/demo/index\\.html|/)$', $options: 'i' } },
            ],
          },
          { url: { $not: { $regex: '\\?id=', $options: 'i' } } },
          { path: { $not: { $regex: '\\?id=', $options: 'i' } } },
        ],
      });
    } else {
      // For pages WITHOUT query parameters (e.g. /product.html catalog view or /checkout.html):
      // Must NOT pull in events that belong to a product query (?id=...)!
      const escapedPath = cleanPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push({
        $and: [
          {
            $or: [
              { path: cleanPath },
              { path: demoPath },
              { url: { $regex: escapedPath, $options: 'i' } },
            ],
          },
          { url: { $not: { $regex: '\\?id=', $options: 'i' } } },
          { path: { $not: { $regex: '\\?id=', $options: 'i' } } },
        ],
      });
    }

    filter.$or = orConditions;

    const clicks = await Event.find(filter)
      .select(
        'x y xPercent yPercent clientXPercent clientYPercent viewportWidth viewportHeight documentWidth documentHeight scrollX scrollY elementTag elementText elementId elementSection elementSelector deviceType isSimulated timestamp sessionId url path'
      )
      .sort({ timestamp: -1 });

    const uniqueSessionIds = new Set(clicks.map((c) => c.sessionId));

    // Section breakdown
    const sectionCounts = {};
    clicks.forEach((c) => {
      const sec = c.elementSection || 'main';
      sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
    });

    // Detect potential user frustration: rapid clicks on the exact same element (<2.5s apart)
    let rapidClicksCount = 0;
    const sortedByTime = [...clicks].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    for (let i = 1; i < sortedByTime.length; i++) {
      const prev = sortedByTime[i - 1];
      const curr = sortedByTime[i];
      if (
        prev.sessionId === curr.sessionId &&
        prev.elementTag === curr.elementTag &&
        prev.elementText === curr.elementText &&
        prev.elementText !== '' &&
        new Date(curr.timestamp) - new Date(prev.timestamp) < 2500
      ) {
        rapidClicksCount++;
      }
    }

    return res.status(200).json({
      success: true,
      query: { url: url || cleanPath, path: cleanPath, deviceType: deviceType || 'all' },
      totalClicks: clicks.length,
      uniqueSessions: uniqueSessionIds.size,
      sectionBreakdown: sectionCounts,
      rapidClicksCount,
      data: clicks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch distinct tracked page URLs for Heatmap page selector dropdown
 * @route   GET /api/analytics/pages
 * @access  Public (for dashboard)
 */
exports.getTrackedPages = async (req, res, next) => {
  try {
    const matchFilter = buildDateFilter(req.query);
    if (req.query.includeSimulated === 'false') {
      matchFilter.isSimulated = false;
    }

    const events = await Event.find(matchFilter).select('url path title eventType sessionId timestamp');

    // Group in memory by clean relative page identifier preserving distinct query params (?id=watch, etc.)
    const pageMap = new Map();

    events.forEach((evt) => {
      let pageKey = '/index.html';
      let title = evt.title || '';
      try {
        if (evt.url) {
          const parsed = new URL(evt.url.startsWith('http') ? evt.url : `http://example.local${evt.url.startsWith('/') ? evt.url : '/' + evt.url}`);
          let pName = parsed.pathname || '/index.html';
          if (pName.startsWith('/demo/')) pName = pName.replace(/^\/demo/, '');
          if (pName === '/' || pName === '') pName = '/index.html';
          pageKey = pName + (parsed.search || '');
        } else if (evt.path) {
          let p = evt.path;
          if (p.startsWith('/demo/')) p = p.replace(/^\/demo/, '');
          if (p === '/' || p === '') p = '/index.html';
          pageKey = p;
        }
      } catch {
        pageKey = evt.path || '/index.html';
      }

      if (!pageMap.has(pageKey)) {
        pageMap.set(pageKey, {
          path: pageKey,
          url: pageKey,
          title: title,
          totalViews: 0,
          totalClicks: 0,
          uniqueSessions: new Set(),
          lastInteraction: evt.timestamp,
        });
      }

      const pEntry = pageMap.get(pageKey);
      if (title && (!pEntry.title || pEntry.title === pEntry.path)) pEntry.title = title;
      if (evt.eventType === 'page_view') pEntry.totalViews++;
      if (evt.eventType === 'click') pEntry.totalClicks++;
      pEntry.uniqueSessions.add(evt.sessionId);
      if (new Date(evt.timestamp) > new Date(pEntry.lastInteraction)) {
        pEntry.lastInteraction = evt.timestamp;
      }
    });

    const pages = Array.from(pageMap.values())
      .map((p) => ({
        path: p.path,
        url: p.url,
        title: p.title || p.path,
        totalViews: p.totalViews,
        totalClicks: p.totalClicks,
        totalInteractions: p.totalViews + p.totalClicks,
        uniqueSessionsCount: p.uniqueSessions.size,
        lastInteraction: p.lastInteraction,
      }))
      .sort((a, b) => b.totalClicks - a.totalClicks || b.totalViews - a.totalViews);

    return res.status(200).json({
      success: true,
      count: pages.length,
      data: pages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch high-level overview metrics with date filtering & genuine vs simulated stats
 * @route   GET /api/analytics/overview
 * @access  Public (for dashboard metrics cards)
 */
exports.getOverview = async (req, res, next) => {
  try {
    const matchFilter = buildDateFilter(req.query);
    const { includeSimulated } = req.query;

    if (includeSimulated === 'false') {
      matchFilter.isSimulated = false;
    }

    const totalEvents = await Event.countDocuments(matchFilter);
    const totalPageViews = await Event.countDocuments({ ...matchFilter, eventType: 'page_view' });
    const totalClicks = await Event.countDocuments({ ...matchFilter, eventType: 'click' });

    // Distinct sessions matching the filter
    const distinctSessions = await Event.distinct('sessionId', matchFilter);
    const totalSessions = distinctSessions.length;

    // Device breakdown
    const deviceStats = await Event.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
    ]);
    const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
    deviceStats.forEach((d) => {
      if (d._id && deviceBreakdown[d._id] !== undefined) {
        deviceBreakdown[d._id] = d.count;
      }
    });

    // Simulated vs genuine counts within the selected date scope
    const dateOnlyFilter = buildDateFilter(req.query);
    const simulatedEvents = await Event.countDocuments({ ...dateOnlyFilter, isSimulated: true });
    const genuineEvents = await Event.countDocuments({ ...dateOnlyFilter, isSimulated: false });

    // Top clicked elements
    const topElements = await Event.aggregate([
      { $match: { ...matchFilter, eventType: 'click', elementTag: { $ne: '' } } },
      {
        $group: {
          _id: { tag: '$elementTag', text: '$elementText', section: '$elementSection' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          element: {
            $concat: ['<', '$_id.tag', '> "', '$_id.text', '"'],
          },
          tag: '$_id.tag',
          text: '$_id.text',
          section: '$_id.section',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Average session duration across matching sessions
    const durationAggregation = await Event.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$sessionId',
          first: { $min: '$timestamp' },
          last: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          durationSeconds: {
            $divide: [{ $subtract: ['$last', '$first'] }, 1000],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$durationSeconds' },
          singlePageBounces: {
            $sum: { $cond: [{ $eq: ['$durationSeconds', 0] }, 1, 0] },
          },
        },
      },
    ]);

    const avgDuration = durationAggregation[0]?.avgDuration || 0;
    const singlePageBounces = durationAggregation[0]?.singlePageBounces || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalEvents,
        totalPageViews,
        totalClicks,
        avgEventsPerSession: totalSessions ? Number((totalEvents / totalSessions).toFixed(1)) : 0,
        avgDurationSeconds: Number(avgDuration.toFixed(1)),
        bounceSessionsCount: singlePageBounces,
        bounceRate: totalSessions ? Number(((singlePageBounces / totalSessions) * 100).toFixed(1)) : 0,
        deviceBreakdown,
        simulatedEventsCount: simulatedEvents,
        genuineEventsCount: genuineEvents,
        topElements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Reset / Clear click events (or all events)
 */
exports.resetClicks = async (req, res, next) => {
  try {
    const { url, allEvents } = req.query;
    let filter = {};
    if (allEvents === 'true') {
      filter = {};
    } else {
      filter = { eventType: 'click' };
      if (url && url !== 'all') {
        filter.url = url;
      }
    }

    const result = await Event.deleteMany(filter);
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} ${allEvents === 'true' ? 'events' : 'click events'}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
