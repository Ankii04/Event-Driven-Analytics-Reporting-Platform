# 📦 Project Structure

Complete file tree of the Event-Driven Analytics Platform.

```
project/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                    # GitHub Actions CI/CD pipeline
│
├── docs/
│   ├── ARCHITECTURE.md                  # System architecture & design decisions
│   ├── QUICKSTART.md                    # Quick start guide
│   └── RESUME_BULLETS.md                # Resume bullet points & interview prep
│
├── infrastructure/
│   ├── postgres/
│   │   └── init.sql                     # PostgreSQL schema & indexes
│   ├── mongodb/
│   │   └── init.js                      # MongoDB collections & indexes
│   ├── kafka/
│   │   └── topics.json                  # Kafka topic configurations
│   └── elasticsearch/
│       └── mappings.json                # Elasticsearch index mappings
│
├── k8s/
│   ├── namespace.yaml                   # Kubernetes namespace
│   ├── configmap.yaml                   # Environment variables
│   ├── secrets.yaml                     # Sensitive data
│   ├── api-gateway-deployment.yaml      # API Gateway deployment
│   └── analytics-worker-deployment.yaml # Analytics Worker deployment
│
├── scripts/
│   ├── init-databases.js                # Database initialization script
│   └── seed-data.js                     # Sample data generator
│
├── services/
│   │
│   ├── api-gateway/                     # GraphQL API Gateway (Port 4000)
│   │   ├── src/
│   │   │   ├── main.ts                  # Entry point
│   │   │   ├── app.module.ts            # Root module
│   │   │   ├── common/
│   │   │   │   └── logger.ts            # Structured logging
│   │   │   ├── redis/
│   │   │   │   └── redis.module.ts      # Redis connection
│   │   │   ├── health/
│   │   │   │   ├── health.module.ts
│   │   │   │   └── health.controller.ts # Health checks
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts      # JWT authentication
│   │   │   │   ├── auth.resolver.ts     # GraphQL auth mutations
│   │   │   │   └── jwt.strategy.ts      # Passport JWT strategy
│   │   │   ├── events/
│   │   │   │   ├── events.module.ts
│   │   │   │   ├── events.service.ts    # Event publishing
│   │   │   │   └── events.resolver.ts   # GraphQL event mutations
│   │   │   └── analytics/
│   │   │       ├── analytics.module.ts
│   │   │       ├── analytics.service.ts # Analytics queries
│   │   │       └── analytics.resolver.ts# GraphQL analytics queries
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── Dockerfile
│   │
│   ├── event-ingestion/                 # Event Producer (Port 3001)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── kafka/
│   │   │   │   └── kafka.module.ts      # Kafka producer
│   │   │   └── events/
│   │   │       ├── events.module.ts
│   │   │       ├── events.service.ts    # Event validation & publishing
│   │   │       ├── events.controller.ts # REST API
│   │   │       └── dto/
│   │   │           └── create-event.dto.ts # Event validation schema
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── Dockerfile
│   │
│   ├── analytics-worker/                # Kafka Consumer & Processor
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── database/
│   │   │   │   └── database.module.ts   # All DB connections
│   │   │   ├── kafka/
│   │   │   │   ├── kafka.module.ts
│   │   │   │   └── event.consumer.ts    # Kafka consumer with DLQ
│   │   │   └── processor/
│   │   │       ├── processor.module.ts
│   │   │       ├── event.processor.ts   # Idempotency & retry logic
│   │   │       └── repositories/
│   │   │           ├── postgres.repository.ts    # Raw event storage
│   │   │           ├── mongo.repository.ts       # Aggregations
│   │   │           ├── redis.repository.ts       # Counters
│   │   │           └── elasticsearch.repository.ts # Indexing
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── Dockerfile
│   │
│   └── query-service/                   # Read API (Port 3003)
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── database/
│       │   │   └── database.module.ts   # MongoDB, Redis, Elasticsearch
│       │   └── analytics/
│       │       ├── analytics.module.ts
│       │       ├── analytics.service.ts # Query logic with caching
│       │       └── analytics.controller.ts # REST endpoints
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       └── Dockerfile
│
├── .env.example                         # Environment variables template
├── .gitignore                           # Git ignore rules
├── CONTRIBUTING.md                      # Contribution guidelines
├── LICENSE                              # MIT License
├── README.md                            # Main documentation
├── docker-compose.yml                   # Local development setup
└── package.json                         # Root package.json with scripts
```

---

## File Count Summary

| Category | Count | Description |
|----------|-------|-------------|
| **Microservices** | 4 | API Gateway, Event Ingestion, Analytics Worker, Query Service |
| **TypeScript Files** | 35+ | Source code files |
| **Configuration Files** | 15+ | Docker, K8s, package.json, tsconfig.json |
| **Documentation** | 5 | README, ARCHITECTURE, QUICKSTART, RESUME_BULLETS, CONTRIBUTING |
| **Infrastructure** | 4 | PostgreSQL, MongoDB, Kafka, Elasticsearch configs |
| **Scripts** | 2 | Database init, data seeding |
| **CI/CD** | 1 | GitHub Actions workflow |
| **Kubernetes Manifests** | 5 | Deployments, services, configs |

**Total Files:** ~70+

---

## Key Files to Review

### For Understanding System Design
1. `docs/ARCHITECTURE.md` - Complete architecture explanation
2. `README.md` - Project overview
3. `docker-compose.yml` - Infrastructure setup

### For Code Quality
1. `services/analytics-worker/src/processor/event.processor.ts` - Idempotency & retry logic
2. `services/analytics-worker/src/kafka/event.consumer.ts` - Kafka consumer with DLQ
3. `services/api-gateway/src/analytics/analytics.service.ts` - Caching strategy

### For Deployment
1. `k8s/api-gateway-deployment.yaml` - Kubernetes deployment example
2. `.github/workflows/ci-cd.yml` - CI/CD pipeline
3. `scripts/init-databases.js` - Database initialization

### For Resume/Interviews
1. `docs/RESUME_BULLETS.md` - Ready-to-use bullet points
2. `docs/ARCHITECTURE.md` - System design talking points

---

## Lines of Code

| Service | TypeScript | Config | Total |
|---------|-----------|--------|-------|
| API Gateway | ~800 | ~100 | ~900 |
| Event Ingestion | ~300 | ~100 | ~400 |
| Analytics Worker | ~600 | ~100 | ~700 |
| Query Service | ~400 | ~100 | ~500 |
| Infrastructure | - | ~500 | ~500 |
| Documentation | - | ~2000 | ~2000 |
| **Total** | **~2100** | **~2900** | **~5000** |

---

## Technology Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** NestJS 10+
- **Language:** TypeScript 5+

### Event Streaming
- **Message Broker:** Apache Kafka 7.5
- **Zookeeper:** 7.5

### Databases
- **Relational:** PostgreSQL 16
- **Document:** MongoDB 7.0
- **Cache:** Redis 7
- **Search:** Elasticsearch 8.11

### API
- **GraphQL:** Apollo Server 4
- **REST:** Express (via NestJS)

### DevOps
- **Containerization:** Docker
- **Orchestration:** Kubernetes
- **CI/CD:** GitHub Actions

### Observability
- **Logging:** Winston
- **Metrics:** Prometheus-compatible
- **Tracing:** Correlation IDs

---

## Development Workflow

```
1. Code → 2. Lint → 3. Test → 4. Build → 5. Docker → 6. K8s → 7. Deploy
```

### Local Development
```bash
docker-compose up -d  # Start infrastructure
npm run dev:*         # Start services in dev mode
npm run seed:events   # Generate test data
```

### Production Deployment
```bash
npm run build:all     # Build all services
docker-compose up --build  # Test locally
kubectl apply -f k8s/ # Deploy to K8s
```

---

## Next Steps

1. **Run the project:** Follow `docs/QUICKSTART.md`
2. **Understand the architecture:** Read `docs/ARCHITECTURE.md`
3. **Prepare for interviews:** Review `docs/RESUME_BULLETS.md`
4. **Customize:** Add your own features and improvements

---

**This project demonstrates production-grade backend engineering skills suitable for Senior SDE roles at FAANG companies.**
