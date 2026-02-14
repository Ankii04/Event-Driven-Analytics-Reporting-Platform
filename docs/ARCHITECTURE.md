# 🏗️ System Architecture

## Overview

The Event-Driven Analytics Platform is built using a microservices architecture with event streaming at its core. This document provides a detailed breakdown of the system design, data flow, and architectural decisions.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Dashboard   │  │  Mobile App  │  │  Admin Panel │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                        │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 4000)                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • GraphQL API (Apollo Server)                                 │ │
│  │  • JWT Authentication                                          │ │
│  │  • Rate Limiting (100 req/min)                                 │ │
│  │  • Request Validation                                          │ │
│  │  • CORS Handling                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────┬─────────────────────────┬───────────────────────────┘
                │                         │
        ┌───────┴──────┐         ┌────────┴────────┐
        │              │         │                 │
        ▼              ▼         ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Event      │ │    Query     │ │    Admin     │
│  Ingestion   │ │   Service    │ │   Service    │
│ (Port 3001)  │ │ (Port 3003)  │ │              │
└──────┬───────┘ └──────┬───────┘ └──────────────┘
       │                │
       │ Publish        │ Read
       ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APACHE KAFKA CLUSTER                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Topic: user-events (10 partitions)                            │ │
│  │  Topic: user-events-dlq (3 partitions)                         │ │
│  │  Retention: 7 days                                             │ │
│  │  Replication Factor: 3 (production)                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ Consume (Consumer Group)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ANALYTICS WORKER SERVICE (5 replicas)                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • Kafka Consumer (Group: analytics-worker-group)              │ │
│  │  • Idempotent Event Processing (Redis-based)                   │ │
│  │  • Retry Logic (3 attempts, exponential backoff)               │ │
│  │  • Dead Letter Queue Handling                                  │ │
│  │  • Parallel Database Writes                                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───┬────────┬────────┬────────┬────────────────────────────────────────┘
    │        │        │        │
    ▼        ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│PostgreSQL│ │ MongoDB │ │  Redis  │ │Elasticsearch │
│         │ │         │ │         │ │              │
│ Write   │ │ Read    │ │ Cache & │ │   Search &   │
│ Model   │ │ Model   │ │Counters │ │  Analytics   │
└─────────┘ └─────────┘ └─────────┘ └──────────────┘
```

---

## Data Flow

### 1. Event Ingestion Flow

```
Client → API Gateway → Event Ingestion Service → Kafka → 202 Accepted
```

**Steps:**
1. Client sends event via GraphQL mutation or REST API
2. API Gateway validates JWT token and rate limits
3. Event Ingestion Service validates event schema
4. Event published to Kafka topic `user-events` (partitioned by userId)
5. Returns 202 Accepted immediately (async processing)

**Latency:** <10ms (p99)

---

### 2. Event Processing Flow

```
Kafka → Analytics Worker → Check Idempotency → Process → Update Databases
```

**Steps:**
1. Worker consumes event from Kafka partition
2. Checks Redis for duplicate (key: `processed:{eventId}`)
3. If not processed:
   - Store raw event in PostgreSQL
   - Update aggregates in MongoDB
   - Increment counters in Redis
   - Index in Elasticsearch
4. Mark as processed in Redis (TTL: 24h)
5. Commit Kafka offset

**Retry Logic:**
- Attempt 1: Immediate
- Attempt 2: Wait 2s (exponential backoff)
- Attempt 3: Wait 4s
- After 3 failures → Send to DLQ

**Latency:** <100ms (p99)

---

### 3. Query Flow

```
Client → API Gateway → Query Service → Check Cache → Query DB → Return
```

**Steps:**
1. Client queries GraphQL API (e.g., `dailyMetrics`)
2. Query Service checks Redis cache
3. If cache hit: Return immediately
4. If cache miss:
   - Query MongoDB for aggregated data
   - Store result in Redis (TTL: 5 min)
   - Return to client

**Latency:** <100ms (p99)

---

## Database Design

### PostgreSQL (Write Model)

**Purpose:** Transactional event store, source of truth

**Schema:**
```sql
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    data JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_data_gin ON events USING GIN (data);
```

**Partitioning Strategy (for scale):**
- Partition by month (e.g., `events_2026_01`, `events_2026_02`)
- Automatically drop old partitions after 90 days

---

### MongoDB (Read Model)

**Purpose:** Aggregated metrics for fast dashboard queries

**Collections:**

1. **daily_metrics**
```javascript
{
  date: "2026-02-04",
  totalEvents: 150000,
  totalRevenue: 45000.50,
  totalUsers: 5000,
  eventsByType: {
    purchase: 10000,
    view: 100000,
    click: 40000
  }
}
```

2. **user_aggregates**
```javascript
{
  userId: "user_123",
  totalEvents: 500,
  totalRevenue: 1200.00,
  eventCounts: {
    purchase: 10,
    view: 400,
    click: 90
  },
  lastActivityAt: ISODate("2026-02-04T18:30:00Z")
}
```

**Indexes:**
- `{ date: -1 }` on daily_metrics
- `{ userId: 1 }` on user_aggregates
- `{ lastActivityAt: -1 }` on user_aggregates

---

### Redis (Caching & Counters)

**Purpose:** Real-time counters, caching, idempotency tracking

**Key Patterns:**

1. **Idempotency:**
   - `processed:{eventId}` → "1" (TTL: 24h)

2. **Active Users (HyperLogLog):**
   - `active_users:2026-02-04:18` → HyperLogLog structure

3. **Event Counters:**
   - `events:2026-02-04:total` → 150000
   - `events:2026-02-04:purchase` → 10000

4. **Query Cache:**
   - `daily_metrics:2026-02-01:2026-02-04` → JSON (TTL: 5 min)

---

### Elasticsearch (Search & Analytics)

**Purpose:** Full-text search, complex aggregations

**Index Mapping:**
```json
{
  "mappings": {
    "properties": {
      "eventId": { "type": "keyword" },
      "eventType": { "type": "keyword" },
      "userId": { "type": "keyword" },
      "timestamp": { "type": "date" },
      "data": {
        "properties": {
          "productId": { "type": "keyword" },
          "amount": { "type": "float" }
        }
      }
    }
  }
}
```

**Use Cases:**
- Search events by user, product, date range
- Aggregations (top products, revenue by category)
- Anomaly detection

---

## Scaling Strategies

### Horizontal Scaling

1. **Kafka Partitions:**
   - Increase partitions from 10 → 20
   - Each partition handled by separate worker

2. **Worker Replicas:**
   - Scale from 5 → 10 replicas
   - Kubernetes HPA based on CPU/memory

3. **Database Read Replicas:**
   - PostgreSQL: 1 primary + 2 read replicas
   - MongoDB: Replica set with 3 nodes

### Vertical Scaling

- Increase worker memory: 1GB → 2GB
- Upgrade database instances (more CPU/RAM)

### Caching Strategy

- **L1 Cache:** In-memory (Node.js process)
- **L2 Cache:** Redis (distributed)
- **Cache Invalidation:** TTL-based (5 min for queries)

---

## Fault Tolerance

### Idempotency

**Problem:** Kafka may deliver same message twice

**Solution:** Redis-based deduplication
```javascript
const eventId = event.eventId;
const exists = await redis.exists(`processed:${eventId}`);
if (exists) return; // Skip

// Process event...
await redis.setEx(`processed:${eventId}`, 86400, '1');
```

### Retry Logic

**Problem:** Transient failures (network, DB timeout)

**Solution:** Exponential backoff
- Attempt 1: Immediate
- Attempt 2: 2s delay
- Attempt 3: 4s delay
- After 3 failures → DLQ

### Dead Letter Queue

**Problem:** Poison messages (invalid data, permanent failures)

**Solution:** Separate DLQ topic
- Failed events sent to `user-events-dlq`
- Manual investigation and replay

### Circuit Breaker

**Problem:** Cascading failures (DB down)

**Solution:** Circuit breaker pattern
- After 5 consecutive failures → Open circuit
- Stop processing for 30s
- Retry after cooldown

---

## Trade-offs & Decisions

### CQRS (Command Query Responsibility Segregation)

**Decision:** Separate write and read models

**Pros:**
- Optimized for different access patterns
- Scalable (scale reads independently)
- Flexible schema evolution

**Cons:**
- Eventual consistency (acceptable for analytics)
- Increased complexity

### Kafka vs RabbitMQ

**Decision:** Kafka

**Reasoning:**
- Higher throughput (100K+ events/sec)
- Event replay capability
- Better for event sourcing

### PostgreSQL vs MySQL

**Decision:** PostgreSQL

**Reasoning:**
- Better JSONB support
- Advanced indexing (GIN, BRIN)
- Partitioning support

---

## Security

1. **Authentication:** JWT tokens (24h expiration)
2. **Authorization:** Role-based access control (RBAC)
3. **Rate Limiting:** 100 requests/min per user
4. **Input Validation:** JSON Schema validation
5. **Network Isolation:** Docker networks, Kubernetes network policies

---

## Observability

1. **Logging:** Structured JSON logs (Winston)
2. **Metrics:** Prometheus-compatible endpoints
3. **Tracing:** Correlation IDs for request tracking
4. **Health Checks:** Liveness and readiness probes

---

## Future Enhancements

1. **Stream Processing:** Add Kafka Streams for real-time aggregations
2. **Machine Learning:** Integrate ML models for predictions
3. **Multi-Region:** Deploy across multiple AWS regions
4. **Data Lake:** Archive events to S3 for long-term storage
5. **GraphQL Subscriptions:** Real-time dashboard updates
