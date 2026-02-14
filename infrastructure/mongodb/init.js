// ==================== DATABASE INITIALIZATION ====================
db = db.getSiblingDB('analytics_db');

// ==================== COLLECTIONS ====================

// 1. Daily Metrics Collection
db.createCollection('daily_metrics');
db.daily_metrics.createIndex({ date: 1 }, { unique: true });
db.daily_metrics.createIndex({ date: -1 });

// Sample document structure
db.daily_metrics.insertOne({
    date: '2026-02-04',
    totalEvents: 0,
    totalRevenue: 0,
    totalUsers: 0,
    eventsByType: {},
    createdAt: new Date(),
    updatedAt: new Date()
});

// 2. Hourly Metrics Collection
db.createCollection('hourly_metrics');
db.hourly_metrics.createIndex({ timestamp: 1 }, { unique: true });
db.hourly_metrics.createIndex({ timestamp: -1 });
db.hourly_metrics.createIndex({ date: 1, hour: 1 });

// Sample document structure
db.hourly_metrics.insertOne({
    timestamp: '2026-02-04T18:00:00Z',
    date: '2026-02-04',
    hour: 18,
    activeUsers: 0,
    eventCount: 0,
    revenue: 0,
    createdAt: new Date(),
    updatedAt: new Date()
});

// 3. User Aggregates Collection
db.createCollection('user_aggregates');
db.user_aggregates.createIndex({ userId: 1 }, { unique: true });
db.user_aggregates.createIndex({ lastActivityAt: -1 });
db.user_aggregates.createIndex({ totalRevenue: -1 });

// Sample document structure
db.user_aggregates.insertOne({
    userId: 'user_123',
    totalEvents: 0,
    totalRevenue: 0,
    eventCounts: {},
    firstSeenAt: new Date(),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
});

// 4. Product Analytics Collection
db.createCollection('product_analytics');
db.product_analytics.createIndex({ productId: 1, date: 1 }, { unique: true });
db.product_analytics.createIndex({ date: -1 });
db.product_analytics.createIndex({ views: -1 });
db.product_analytics.createIndex({ purchases: -1 });

// Sample document structure
db.product_analytics.insertOne({
    productId: 'prod_456',
    date: '2026-02-04',
    views: 0,
    addToCarts: 0,
    purchases: 0,
    revenue: 0,
    conversionRate: 0,
    createdAt: new Date(),
    updatedAt: new Date()
});

// 5. Event Type Metrics Collection
db.createCollection('event_type_metrics');
db.event_type_metrics.createIndex({ eventType: 1, date: 1 }, { unique: true });
db.event_type_metrics.createIndex({ date: -1 });
db.event_type_metrics.createIndex({ count: -1 });

// Sample document structure
db.event_type_metrics.insertOne({
    eventType: 'purchase',
    date: '2026-02-04',
    count: 0,
    uniqueUsers: 0,
    createdAt: new Date(),
    updatedAt: new Date()
});

// ==================== INDEXES FOR PERFORMANCE ====================

// Compound indexes for common queries
db.daily_metrics.createIndex({ date: -1, totalRevenue: -1 });
db.hourly_metrics.createIndex({ date: -1, hour: -1 });
db.user_aggregates.createIndex({ lastActivityAt: -1, totalRevenue: -1 });

// ==================== CAPPED COLLECTIONS (Optional) ====================
// For real-time streaming data with automatic cleanup
db.createCollection('recent_events', {
    capped: true,
    size: 100000000, // 100MB
    max: 100000 // Max 100K documents
});

print('MongoDB initialization completed successfully!');
