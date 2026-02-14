-- ==================== EVENTS TABLE (Write Model) ====================
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_data_gin ON events USING GIN (data);

-- Composite index for common queries
CREATE INDEX idx_events_user_timestamp ON events(user_id, timestamp DESC);
CREATE INDEX idx_events_type_timestamp ON events(event_type, timestamp DESC);

-- ==================== PARTITIONING (Optional for scale) ====================
-- Partition by month for better query performance
-- Uncomment when data volume exceeds 10M rows

-- CREATE TABLE events_2026_01 PARTITION OF events
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE events_2026_02 PARTITION OF events
--     FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ==================== STATISTICS ====================
-- Update table statistics for query planner
ANALYZE events;

-- ==================== COMMENTS ====================
COMMENT ON TABLE events IS 'Raw event store (write model) - source of truth for all user events';
COMMENT ON COLUMN events.event_id IS 'Unique identifier for idempotency (UUID)';
COMMENT ON COLUMN events.data IS 'Event payload as JSONB for flexible schema';
COMMENT ON COLUMN events.metadata IS 'Additional context (IP, user agent, etc.)';
