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
    // Click coordinates (required if eventType is 'click')
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
    // Normalized percentage coordinates (0-100%) for responsive heatmap rendering
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
    // Viewport dimensions at the time of interaction
    viewportWidth: {
      type: Number,
      default: null,
    },
    viewportHeight: {
      type: Number,
      default: null,
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
    // Additional flexible metadata (referrer, user-agent, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false,
  }
);

/**
 * Compound Indexes for high performance analytics queries
 */
// 1. Session journey query: fetch all events for a given session sorted chronologically
EventSchema.index({ sessionId: 1, timestamp: 1 });

// 2. Heatmap query: fetch all click events for a specific URL
EventSchema.index({ url: 1, eventType: 1 });

// 3. Page pathname heatmap query: fetch all click events for a specific path
EventSchema.index({ path: 1, eventType: 1 });

// 4. Session aggregation: fetch sessions sorted by most recent activity
EventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
