# 🚀 SIMPLE SETUP GUIDE

Follow these steps **exactly** to run the project:

---

## ✅ **Step 1: Start Infrastructure (Databases)**

```powershell
# Start only the databases (Kafka, PostgreSQL, MongoDB, Redis, Elasticsearch)
docker-compose -f docker-compose.infra.yml up -d
```

**Wait 30-60 seconds** for all services to be healthy.

Check status:
```powershell
docker-compose -f docker-compose.infra.yml ps
```

You should see all services as **"Up (healthy)"**.

---

## ✅ **Step 2: Install Dependencies**

Run this PowerShell script:

```powershell
.\install-all.ps1
```

This will install dependencies for all 4 services. **Takes 5-10 minutes**.

---

## ✅ **Step 3: Initialize Databases**

```powershell
npm run db:init
```

This creates Kafka topics and database schemas.

---

## ✅ **Step 4: Start Services**

Open **4 separate PowerShell terminals** and run:

### Terminal 1: API Gateway
```powershell
cd services\api-gateway
npm run start:dev
```
**Expected:** `🚀 API Gateway running on http://localhost:4000/graphql`

### Terminal 2: Event Ingestion
```powershell
cd services\event-ingestion
npm run start:dev
```
**Expected:** `🚀 Event Ingestion Service running on http://localhost:3001`

### Terminal 3: Analytics Worker
```powershell
cd services\analytics-worker
npm run start:dev
```
**Expected:** `🚀 Analytics Worker Service started`

### Terminal 4: Query Service
```powershell
cd services\query-service
npm run start:dev
```
**Expected:** `🚀 Query Service running on http://localhost:3003`

---

## ✅ **Step 5: Seed Test Data**

In a **5th terminal**:

```powershell
npm run seed:events
```

This generates 1000 sample events.

---

## ✅ **Step 6: Test the System**

### GraphQL Playground

Open **http://localhost:4000/graphql** in your browser.

Try this query:
```graphql
query {
  activeUsers(timeRange: "1h")
}
```

### REST API

```powershell
curl -X POST http://localhost:3001/events `
  -H "Content-Type: application/json" `
  -d '{\"eventType\":\"purchase\",\"userId\":\"user_123\",\"data\":{\"productId\":\"prod_456\",\"amount\":99.99}}'
```

---

## 🛑 **To Stop Everything**

```powershell
# Stop infrastructure
docker-compose -f docker-compose.infra.yml down

# Stop services (Ctrl+C in each terminal)
```

---

## ❓ **Troubleshooting**

### "Port already in use"
```powershell
# Find what's using the port
netstat -ano | findstr :4000

# Kill the process or change port in .env
```

### "Cannot connect to Docker"
- Make sure Docker Desktop is running
- Restart Docker Desktop

### "Kafka connection error"
```powershell
# Restart Kafka
docker-compose -f docker-compose.infra.yml restart kafka

# Wait 30 seconds
```

---

## 📝 **Summary**

1. ✅ `.env` file created (no changes needed)
2. ✅ Start infrastructure: `docker-compose -f docker-compose.infra.yml up -d`
3. ✅ Install dependencies: `.\install-all.ps1`
4. ✅ Initialize databases: `npm run db:init`
5. ✅ Start services in 4 terminals
6. ✅ Seed data: `npm run seed:events`
7. ✅ Test: http://localhost:4000/graphql

---

**That's it! No external databases or API keys needed.**
