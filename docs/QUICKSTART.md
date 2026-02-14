# 🚀 Quick Start Guide

Get the Event-Driven Analytics Platform running locally in **5 minutes**.

---

## Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))
- **8GB RAM** minimum

---

## Step 1: Clone & Setup

```bash
# Navigate to project directory
cd c:\Users\HP\coding\project

# Copy environment variables
copy .env.example .env

# Install root dependencies
npm install
```

---

## Step 2: Start Infrastructure

```bash
# Start all infrastructure services (Kafka, PostgreSQL, MongoDB, Redis, Elasticsearch)
docker-compose up -d

# Wait for services to be healthy (~30 seconds)
docker-compose ps
```

**Expected output:**
```
NAME                STATUS
kafka               Up (healthy)
postgres            Up (healthy)
mongodb             Up (healthy)
redis               Up (healthy)
elasticsearch       Up (healthy)
zookeeper           Up (healthy)
```

---

## Step 3: Initialize Databases

```bash
# Create Kafka topics and initialize database schemas
npm run db:init
```

**Expected output:**
```
🚀 Initializing databases...

📊 Initializing Kafka topics...
✅ Kafka topics created

🐘 Initializing PostgreSQL...
✅ PostgreSQL initialized

🍃 Initializing MongoDB...
✅ MongoDB initialized

🔴 Initializing Redis...
✅ Redis initialized

🔍 Initializing Elasticsearch...
✅ Elasticsearch initialized

✅ All databases initialized successfully!
```

---

## Step 4: Install Service Dependencies

```bash
# Install dependencies for all microservices
npm run install:all
```

This will install dependencies for:
- API Gateway
- Event Ingestion
- Analytics Worker
- Query Service

---

## Step 5: Start Services

Open **4 separate terminals** and run:

### Terminal 1: API Gateway
```bash
npm run dev:gateway
```
**Expected:** `🚀 API Gateway running on http://localhost:4000/graphql`

### Terminal 2: Event Ingestion
```bash
npm run dev:ingestion
```
**Expected:** `🚀 Event Ingestion Service running on http://localhost:3001`

### Terminal 3: Analytics Worker
```bash
npm run dev:worker
```
**Expected:** `🚀 Analytics Worker Service started`

### Terminal 4: Query Service
```bash
npm run dev:query
```
**Expected:** `🚀 Query Service running on http://localhost:3003`

---

## Step 6: Seed Sample Data

In a **5th terminal**:

```bash
# Generate 1000 sample events
npm run seed:events
```

**Expected output:**
```
🌱 Seeding 1000 events to http://localhost:3001...

  ✅ Sent 100/1000 events
  ✅ Sent 200/1000 events
  ...
  ✅ Sent 1000/1000 events

📊 Seeding complete!
  ✅ Success: 1000
  ❌ Errors: 0
```

---

## Step 7: Test the System

### GraphQL Playground

Open **http://localhost:4000/graphql** in your browser.

#### Query 1: Get Active Users
```graphql
query {
  activeUsers(timeRange: "1h")
}
```

#### Query 2: Get Daily Metrics
```graphql
query {
  dailyMetrics(
    startDate: "2026-02-01"
    endDate: "2026-02-04"
  )
}
```

#### Mutation: Track Event
```graphql
mutation {
  trackEvent(
    eventType: "purchase"
    userId: "user_123"
    data: "{\"productId\":\"prod_456\",\"amount\":99.99}"
  )
}
```

### REST API

#### Send Event
```bash
curl -X POST http://localhost:3001/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "purchase",
    "userId": "user_123",
    "data": {
      "productId": "prod_456",
      "amount": 99.99,
      "currency": "USD"
    }
  }'
```

#### Query Analytics
```bash
curl "http://localhost:3003/analytics/daily?startDate=2026-02-01&endDate=2026-02-04"
```

---

## Step 8: Monitor Logs

### View All Logs
```bash
docker-compose logs -f
```

### View Specific Service
```bash
# Kafka logs
docker-compose logs -f kafka

# PostgreSQL logs
docker-compose logs -f postgres

# MongoDB logs
docker-compose logs -f mongodb
```

---

## Verify Everything Works

### Check Kafka Topics
```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

**Expected:**
```
user-events
user-events-dlq
```

### Check PostgreSQL
```bash
docker exec -it postgres psql -U analytics -d analytics_db -c "SELECT COUNT(*) FROM events;"
```

### Check MongoDB
```bash
docker exec -it mongodb mongosh -u analytics -p analytics123 --authenticationDatabase admin analytics_db --eval "db.daily_metrics.countDocuments()"
```

### Check Redis
```bash
docker exec -it redis redis-cli -a analytics123 PING
```

### Check Elasticsearch
```bash
curl http://localhost:9200/_cat/indices?v
```

---

## Troubleshooting

### Services Not Starting

**Problem:** Port already in use

**Solution:**
```bash
# Check what's using the port
netstat -ano | findstr :4000

# Kill the process or change port in .env
```

### Kafka Connection Errors

**Problem:** `KafkaJSConnectionError`

**Solution:**
```bash
# Restart Kafka
docker-compose restart kafka

# Wait 30 seconds for Kafka to be ready
```

### Database Connection Errors

**Problem:** `ECONNREFUSED`

**Solution:**
```bash
# Check if containers are running
docker-compose ps

# Restart all services
docker-compose restart
```

### Out of Memory

**Problem:** Docker out of memory

**Solution:**
1. Open Docker Desktop
2. Settings → Resources
3. Increase Memory to 8GB
4. Apply & Restart

---

## Stop Everything

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

## Next Steps

1. **Explore the Code:**
   - Read `docs/ARCHITECTURE.md` for system design
   - Check `services/*/src/` for implementation details

2. **Run Tests:**
   ```bash
   npm test
   ```

3. **Build for Production:**
   ```bash
   npm run build:all
   docker-compose -f docker-compose.yml up --build
   ```

4. **Deploy to Kubernetes:**
   ```bash
   kubectl apply -f k8s/
   ```

---

## Useful Commands

```bash
# View all running containers
docker ps

# View logs for specific service
docker-compose logs -f api-gateway

# Restart a service
docker-compose restart analytics-worker

# Execute command in container
docker exec -it postgres psql -U analytics

# Check Kafka consumer groups
docker exec -it kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list

# Check Kafka lag
docker exec -it kafka kafka-consumer-groups --bootstrap-server localhost:9092 --group analytics-worker-group --describe
```

---

## Support

- **Documentation:** `docs/` folder
- **Issues:** Create GitHub issue
- **Architecture Questions:** See `docs/ARCHITECTURE.md`

---

**🎉 You're all set! The platform is now processing events in real-time.**
