const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['page_view', 'click'],
        message: '{VALUE} is not a supported event type',
      },
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Page URL is required'],
      trim: true,
      index: true,
    },
    path: {
      type: String,
      trim: true,
      default: function () {
        try {
          const parsed = new URL(this.url);
          return parsed.pathname;
        } catch {
          return this.url;
        }
      },
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Document-relative click coordinates (required if eventType is 'click')
    x: {
      type: Number,
      required: function () {
        return this.eventType === 'click';
      },
      default: null,
    },
    y: {
      type: Number,
      required: function () {
        return this.eventType === 'click';
      },
      default: null,
    },
    // Document-relative percentage coordinates (0-100% of full page height/width)
    xPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    yPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Viewport-relative percentage coordinates (0-100% of visible viewport at moment of click)
    clientXPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    clientYPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    // Viewport & document dimensions at the time of interaction
    viewportWidth: {
      type: Number,
      default: null,
    },
    viewportHeight: {
      type: Number,
      default: null,
    },
    documentWidth: {
      type: Number,
      default: null,
    },
    documentHeight: {
      type: Number,
      default: null,
    },
    scrollX: {
      type: Number,
      default: 0,
    },
    scrollY: {
      type: Number,
      default: 0,
    },
    // Contextual DOM element details for click events
    elementTag: {
      type: String,
      trim: true,
      default: '',
    },
    elementText: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    elementId: {
      type: String,
      trim: true,
      default: '',
    },
    elementSelector: {
      type: String,
      trim: true,
      default: '',
    },
    elementSection: {
      type: String,
      trim: true,
      default: 'main', // header, hero, catalog, product-details, checkout, footer, etc.
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile'],
      default: 'desktop',
      index: true,
    },
    // Distinguishes simulated test activity from genuine customer interactions
    isSimulated: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Additional flexible metadata (referrer, user-agent, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Compound Indexes for high performance analytics queries
 */
// 1. Session journey query: fetch all events for a given session sorted chronologically
EventSchema.index({ sessionId: 1, timestamp: 1 });

// 2. Heatmap query: fetch all click events for a specific URL with device/date filtering
EventSchema.index({ url: 1, eventType: 1, timestamp: -1 });

// 3. Page pathname heatmap query: fetch all click events for a specific path
EventSchema.index({ path: 1, eventType: 1, timestamp: -1 });

// 4. Time-range and simulation filtering index
EventSchema.index({ timestamp: -1, isSimulated: 1 });

module.exports = mongoose.model('Event', EventSchema);
