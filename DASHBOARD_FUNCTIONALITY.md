# Dashboard Functionality - Complete Implementation

## ✅ What's Working Now

### 1. **Trigger Spike Button**
- **What it does:** Generates and sends 1000 random events directly from the browser
- **How it works:**
  - Creates random events (purchase, click, view)
  - Sends them in batches of 50 using GraphQL `trackEvent` mutation
  - Shows real-time progress ("Sent 50 events...", "Sent 100 events...")
  - Dashboard auto-refreshes to show updated numbers
- **Technology:** Uses existing GraphQL `trackEvent` mutation (no server-side scripts needed)

### 2. **Reset Data Button**
- **What it does:** Clears all data from MongoDB, Redis, and Elasticsearch
- **How it works:**
  - Calls `/analytics/reset-data` REST endpoint in query-service
  - Clears all MongoDB collections (daily_metrics, event_type_metrics, user_aggregates)
  - Flushes all Redis cache
  - Deletes all documents from Elasticsearch index
  - Dashboard refreshes to show zeros
- **Technology:** Direct database operations through query-service

### 3. **Real-Time Dashboard Updates**
- **Auto-refresh:** Every 5 seconds
- **No caching:** All fetch requests use cache-busting headers
- **Live data:** Always shows current state from databases

## 🚀 How to Use

1. **Open Dashboard:**
   - Navigate to `http://localhost:3005`
   - Open browser DevTools (F12) to see console logs

2. **Trigger Spike:**
   - Click "Trigger Spike" button
   - Watch button update: "Sent 50 events... Sent 100 events..."
   - Dashboard numbers will climb in real-time
   - Revenue increases, event count grows, charts update

3. **Reset Data:**
   - Click "Reset Data" button
   - Confirm the warning dialog
   - All counters drop to 0
   - Charts reset to empty state

## 📊 What Updates in Real-Time

- **Total Revenue** (₹)
- **Total Events** count
- **Active Users** count
- **Revenue Architecture** line chart
- **Event Distribution** doughnut chart
- **Kafka Live Stream** activity feed (scroll down to see)

## 🔧 Technical Implementation

### Frontend (`dashboard/main.js`)
```javascript
// Trigger Spike - Generates 1000 events
- Creates random events with realistic data
- Sends in batches of 50 to avoid overwhelming server
- Uses GraphQL trackEvent mutation

// Reset Data - Clears all databases
- Calls REST endpoint: POST /analytics/reset-data
- Waits for confirmation
- Refreshes dashboard to show empty state
```

### Backend
```typescript
// Query Service (Port 3003)
- POST /analytics/reset-data
  → Clears MongoDB, Redis, Elasticsearch
  → Returns {success: boolean, message: string}

// API Gateway (Port 4000)
- GraphQL Mutation: trackEvent
  → Validates and publishes event to Kafka
  → Returns boolean success
```

## ✨ Features

1. **No Manual Commands:** Everything works from the UI
2. **Visual Feedback:** Button states show progress
3. **Error Handling:** Alerts show if something fails
4. **Console Logging:** Detailed logs in DevTools for debugging
5. **Real-Time Updates:** 5-second polling keeps dashboard fresh

## 🎯 Demo Flow

**Perfect demo sequence:**
1. Click "Reset Data" → Everything goes to 0
2. Click "Trigger Spike" → Watch numbers climb
3. Wait 5-10 seconds → See charts update smoothly
4. Scroll down → See live Kafka events in the feed
5. Repeat as needed for impressive demo!

## 🐛 Troubleshooting

If buttons don't work:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check DevTools Console for errors
3. Verify services are running: `docker ps`
4. Check if endpoints respond:
   - `http://localhost:3003/analytics/reset-data`
   - `http://localhost:4000/graphql`

## 📝 Testing Commands

Test reset endpoint:
```powershell
$body = @{} | ConvertTo-Json
(Invoke-WebRequest -Uri http://localhost:3003/analytics/reset-data -Method POST -ContentType "application/json" -Body $body -UseBasicParsing).Content
```

Expected output:
```json
{"success":true,"message":"All data cleared successfully"}
```

## 🎓 Key Learnings

1. **Frontend event generation** is simpler than running backend scripts from Docker
2. **Direct database operations** in query-service provide clean reset functionality  
3. **Cache-busting headers** ensure real-time data display
4. **Batch processing** prevents overwhelming the server with 1000 simultaneous requests

---

**Status:** ✅ Fully working and tested
**Last Updated:** 2026-02-14
