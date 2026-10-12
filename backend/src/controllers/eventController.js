const Event = require('../models/Event');

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

    // Support both single event object and array of events (batching)
    const eventsArray = Array.isArray(payload) ? payload : [payload];

    if (eventsArray.length === 0) {
      return res.status(400).json({ success: false, message: 'Event list cannot be empty' });
    }

    // Process and sanitize each event
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
        elementTag,
        elementText,
        elementId,
        title,
        metadata,
      } = evt;

      // Calculate percentage coordinates if viewport dimensions are provided
      let xPercent = evt.xPercent;
      let yPercent = evt.yPercent;

      if (
        eventType === 'click' &&
        typeof x === 'number' &&
        typeof y === 'number' &&
        viewportWidth > 0 &&
        viewportHeight > 0
      ) {
        if (xPercent === undefined || xPercent === null) {
          xPercent = Math.min(100, Math.max(0, Number(((x / viewportWidth) * 100).toFixed(2))));
        }
        if (yPercent === undefined || yPercent === null) {
          yPercent = Math.min(100, Math.max(0, Number(((y / viewportHeight) * 100).toFixed(2))));
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
        viewportWidth: viewportWidth || null,
        viewportHeight: viewportHeight || null,
        elementTag: elementTag || '',
        elementText: elementText ? String(elementText).slice(0, 120) : '',
        elementId: elementId || '',
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

    // High performance bulk insertion
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
 * @desc    Fetch list of sessions with event counts and timing metrics
 * @route   GET /api/sessions
 * @access  Public (for dashboard)
 */
exports.getSessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // MongoDB Aggregation Pipeline for fast, memory-efficient grouping
    const pipeline = [
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
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          urlsVisited: { $addToSet: '$url' },
          pathsVisited: { $addToSet: '$path' },
          lastEvent: { $last: '$eventType' },
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
      { $sort: { lastSeen: -1 } }, // most recently active sessions first
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          sessions: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const result = await Event.aggregate(pipeline);
    const totalSessions = result[0]?.metadata[0]?.total || 0;
    const sessions = result[0]?.sessions || [];

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

    // Query using the compound index { sessionId: 1, timestamp: 1 }
    const events = await Event.find({ sessionId }).sort({ timestamp: 1 });

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No events found for session: ${sessionId}`,
      });
    }

    // Compute session summary metadata
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const durationSeconds = ((lastEvent.timestamp - firstEvent.timestamp) / 1000).toFixed(1);

    const pageViews = events.filter((e) => e.eventType === 'page_view').length;
    const clicks = events.filter((e) => e.eventType === 'click').length;

    return res.status(200).json({
      success: true,
      sessionId,
      summary: {
        totalEvents: events.length,
        pageViews,
        clicks,
        startTime: firstEvent.timestamp,
        endTime: lastEvent.timestamp,
        durationSeconds: Number(durationSeconds),
      },
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch click data for a specific page URL (for Heatmap visualization)
 * @route   GET /api/analytics/clicks
 * @access  Public (for dashboard)
 */
exports.getPageClicks = async (req, res, next) => {
  try {
    const { url, path } = req.query;

    if (!url && !path) {
      return res.status(400).json({
        success: false,
        message: 'Either "url" or "path" query parameter is required (e.g. /api/analytics/clicks?url=...)',
      });
    }

    // Match either full URL or normalized pathname
    const filter = { eventType: 'click' };
    if (url) {
      filter.$or = [{ url: url }, { path: url }];
    } else if (path) {
      filter.path = path;
    }

    const clicks = await Event.find(filter)
      .select('x y xPercent yPercent viewportWidth viewportHeight elementTag elementText elementId timestamp sessionId url path')
      .sort({ timestamp: -1 });

    // Distinct sessions that contributed clicks
    const uniqueSessionIds = new Set(clicks.map((c) => c.sessionId));

    return res.status(200).json({
      success: true,
      query: { url: url || null, path: path || null },
      totalClicks: clicks.length,
      uniqueSessions: uniqueSessionIds.size,
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
    // Aggregate distinct pages with both page_view and click counts
    const pages = await Event.aggregate([
      {
        $group: {
          _id: '$url',
          path: { $first: '$path' },
          totalViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] },
          },
          totalClicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] },
          },
          lastInteraction: { $max: '$timestamp' },
        },
      },
      {
        $project: {
          url: '$_id',
          _id: 0,
          path: 1,
          totalViews: 1,
          totalClicks: 1,
          totalInteractions: { $add: ['$totalViews', '$totalClicks'] },
          lastInteraction: 1,
        },
      },
      { $sort: { totalClicks: -1, totalViews: -1 } },
    ]);

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
 * @desc    Fetch high-level overview metrics (total sessions, total events, etc.)
 * @route   GET /api/analytics/overview
 * @access  Public (for dashboard metrics cards)
 */
exports.getOverview = async (req, res, next) => {
  try {
    const totalEvents = await Event.countDocuments();
    const totalPageViews = await Event.countDocuments({ eventType: 'page_view' });
    const totalClicks = await Event.countDocuments({ eventType: 'click' });
    
    // Distinct sessions count
    const distinctSessions = await Event.distinct('sessionId');
    const totalSessions = distinctSessions.length;

    // Top clicked elements
    const topElements = await Event.aggregate([
      { $match: { eventType: 'click', elementTag: { $ne: '' } } },
      {
        $group: {
          _id: { tag: '$elementTag', text: '$elementText' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          element: {
            $concat: ['<', '$_id.tag', '> "', '$_id.text', '"'],
          },
          count: 1,
          _id: 0,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalSessions,
        totalEvents,
        totalPageViews,
        totalClicks,
        avgEventsPerSession: totalSessions ? Number((totalEvents / totalSessions).toFixed(1)) : 0,
        topElements,
      },
    });
  } catch (error) {
    next(error);
  }
};
