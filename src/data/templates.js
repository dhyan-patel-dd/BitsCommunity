export const templates = [
  // ─────────────────────────────────────────
  // bits.md templates (1–5)
  // ─────────────────────────────────────────
  {
    id: 'bitsmd-k8s-microservices',
    title: 'Kubernetes Microservices bits.md',
    description: 'Comprehensive bits.md for a K8s-based microservices platform. Covers service dependencies, SLOs, known flaky areas, and Bits investigation hints to supercharge incident response.',
    contentType: 'bits.md',
    monitorTypes: ['Infrastructure', 'APM', 'Metric'],
    useCases: ['Incident Response', 'On-call Setup', 'Performance Monitoring'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 312,
    usageCount: 1840,
    createdAt: '2024-11-15',
    tags: ['kubernetes', 'microservices', 'k8s', 'slo', 'service-mesh', 'istio'],
    featured: false,
    trending: true,
    content: `# bits.md — Kubernetes Microservices Platform

## Service Overview
This service is the core API gateway for our microservices platform running on Kubernetes (EKS).
It routes ~4,000 RPS in production and is the entry point for all customer-facing traffic.

**Team:** Platform Engineering
**On-call rotation:** platform-oncall@company.com
**PagerDuty service:** platform-api-gateway
**Slack channel:** #platform-incidents

## Architecture
\`\`\`
Internet → ALB → api-gateway (3 replicas, HPA: 3–20)
                    ├── auth-service (2 replicas)
                    ├── user-service (3 replicas)
                    ├── order-service (5 replicas, stateful)
                    │     └── postgres-primary (RDS)
                    │     └── redis-cache (ElastiCache)
                    └── notification-service (2 replicas)
                          └── SQS queue → Lambda worker
\`\`\`

## SLOs
| SLO | Target | Window | Monitor |
|-----|--------|--------|---------|
| Availability | 99.9% | 30d rolling | monitor-12345 |
| P99 Latency < 500ms | 99.5% | 7d rolling | monitor-12346 |
| Error rate < 0.1% | 99.8% | 1h rolling | monitor-12347 |

## Known Flaky Areas
- **auth-service**: Occasionally spikes in P99 latency (>800ms) during token refresh storms.
  Usually self-resolves in <5 min. Check \`auth_token_refresh_duration_p99\` metric first.
- **order-service**: Connection pool exhaustion during flash sales.
  Check \`db.pool.waiting_count\` — if > 20, restart the pod with highest \`db.pool.checkout_timeout_count\`.
- **notification-service**: SQS DLQ builds up if Lambda concurrency limit is hit.
  Check Lambda CloudWatch logs for throttling before escalating.

## Bits Investigation Hints
When Bits is investigating an incident on this service, provide the following context:

- **Deployment cadence**: 2–4 deploys per day via ArgoCD. Always check for recent deploys first.
- **Primary error signals**:
  - \`http.server.errors\` (APM) — main error rate signal
  - \`kubernetes.containers.restarts\` — pod instability
  - \`aws.rds.database_connections\` — DB saturation
- **Correlated services**: auth-service and order-service are most commonly involved in cascading failures
- **Business impact mapping**:
  - Error rate > 1% → checkout flow impacted (revenue impact ~$2k/min)
  - Error rate > 5% → full site degradation, wake PagerDuty

## Runbooks
- Service degradation: [runbook-service-degradation](https://wiki.internal/runbooks/api-gateway-degradation)
- DB failover: [runbook-db-failover](https://wiki.internal/runbooks/db-failover)
- Memory leak: [runbook-memory-leak](https://wiki.internal/runbooks/memory-leak)

## Useful Datadog Queries
\`\`\`
# Error rate (APM)
sum:trace.express.request.errors{service:api-gateway} / sum:trace.express.request.hits{service:api-gateway}

# P99 latency
p99:trace.express.request.duration{service:api-gateway}

# Pod restart rate
sum:kubernetes.containers.restarts{kube_namespace:platform,kube_deployment:api-gateway}.as_rate()
\`\`\`

## Bits Chat Starters
- "Show me the error rate for api-gateway in the last 30 minutes and correlate with recent deploys"
- "What pods in the platform namespace have restarted more than 3 times in the last hour?"
- "Is there a pattern between auth-service latency and api-gateway error rate today?"
`,
  },
  {
    id: 'bitsmd-aws-serverless',
    title: 'AWS Serverless Stack bits.md',
    description: 'bits.md template for Lambda/API Gateway/DynamoDB architectures. Covers cold starts, concurrency limits, DynamoDB throttling, and common failure patterns for serverless SREs.',
    contentType: 'bits.md',
    monitorTypes: ['APM', 'Metric'],
    useCases: ['Incident Response', 'On-call Setup'],
    verified: false,
    author: 'sarah.chen',
    authorType: 'community',
    companySize: 'startup',
    industry: 'SaaS',
    stars: 147,
    usageCount: 623,
    createdAt: '2024-12-01',
    tags: ['aws', 'lambda', 'serverless', 'dynamodb', 'api-gateway', 'cold-start'],
    featured: false,
    trending: false,
    content: `# bits.md — AWS Serverless Stack

## Service Overview
Event-driven serverless application using AWS Lambda, API Gateway, and DynamoDB.
Processes ~500k events/day across 12 Lambda functions.

**Team:** Backend Engineering
**On-call:** #backend-oncall (PagerDuty escalation after 5 min)
**AWS Account:** production-123456789
**Region:** us-east-1 (primary), us-west-2 (DR)

## Lambda Functions
| Function | Trigger | Avg Duration | Memory | Timeout |
|----------|---------|-------------|--------|---------|
| api-handler | API Gateway | 120ms | 512MB | 30s |
| event-processor | SQS | 2.1s | 1024MB | 5min |
| data-transformer | S3 | 8.3s | 2048MB | 15min |
| notification-sender | EventBridge | 340ms | 256MB | 30s |
| auth-authorizer | API Gateway (authorizer) | 45ms | 128MB | 5s |

## Known Issues & Failure Patterns

### Cold Start Storms
After a traffic spike, provisioned concurrency may not cover all instances.
- **Signal**: P99 latency jumps to 3–8 seconds (cold start range for our functions)
- **Distinguish from real slowness**: Check \`aws.lambda.init_duration\` metric
- **Fix**: Temporarily increase provisioned concurrency for api-handler

### DynamoDB Throttling
- Table \`user-events\` has on-demand billing but can still throttle during rapid burst
- **Signal**: \`aws.dynamodb.system_errors\` + \`ConsumedWriteCapacityUnits\` near partition limit
- **Pattern**: Usually caused by hot partition keys (userId-based writes at login time)

### SQS Poison Pill Messages
- event-processor occasionally gets malformed messages stuck in retry loop
- **Signal**: SQS DLQ depth > 0, \`aws.lambda.errors\` on event-processor
- **Fix**: Inspect DLQ messages first; usually safe to purge after logging

## SLOs
- API availability: 99.95% (30-day rolling)
- P95 API latency (excluding cold starts): < 200ms
- Event processing lag < 60 seconds (measured at SQS ApproximateAgeOfOldestMessage)

## Bits Investigation Hints
- Always check cold start metrics before assuming code regression
- DynamoDB throttling has ~30s propagation delay — correlate timestamps carefully
- Lambda duration anomalies: first check memory utilization (\`aws.lambda.max_memory_used\`)
- Correlate API Gateway 5xx with Lambda error logs using \`requestId\` field

## Key Metrics for Bits
\`\`\`
aws.lambda.errors{functionname:api-handler}
aws.lambda.duration.p99{functionname:api-handler}
aws.lambda.concurrent_executions{functionname:event-processor}
aws.dynamodb.throttled_requests{tablename:user-events}
aws.sqs.approximate_age_of_oldest_message{queuename:event-processing-queue}
\`\`\`
`,
  },
  {
    id: 'bitsmd-database-backend',
    title: 'Database-Heavy Backend bits.md',
    description: 'bits.md for PostgreSQL/Redis-intensive services. Includes query performance patterns, connection pool tuning context, cache hit ratio SLOs, and common slow query signatures for Bits to recognize.',
    contentType: 'bits.md',
    monitorTypes: ['Metric', 'APM'],
    useCases: ['Performance Monitoring', 'Incident Response'],
    verified: false,
    author: 'marcus.okonkwo',
    authorType: 'community',
    companySize: 'mid-market',
    industry: 'FinTech',
    stars: 203,
    usageCount: 891,
    createdAt: '2024-10-22',
    tags: ['postgresql', 'redis', 'database', 'connection-pool', 'pgbouncer', 'cache'],
    featured: false,
    trending: false,
    content: `# bits.md — Database-Heavy Backend Service

## Service Overview
Core data service for a financial analytics platform. Executes ~15,000 queries/min against
PostgreSQL 15 (primary + 2 read replicas) with Redis for caching and session management.

**Team:** Data Platform
**DB Admin contacts:** db-oncall@company.com
**PagerDuty:** data-platform-critical

## Database Topology
\`\`\`
App Servers (6 pods)
  └── PgBouncer (connection pooler, pool_size=25 per pod)
        ├── postgres-primary (writes, complex aggregations)
        └── postgres-replica-[1,2] (read-heavy queries via read routing)

Redis Cluster (3-node)
  ├── db: 0 → session cache (TTL: 30min)
  ├── db: 1 → query result cache (TTL: varies 5s–5min)
  └── db: 2 → rate limiting counters (TTL: 1s–1hour)
\`\`\`

## Performance Baselines
| Metric | Normal | Degraded | Critical |
|--------|--------|----------|---------|
| Query P99 latency | < 50ms | 50–200ms | > 200ms |
| Connection pool utilization | < 60% | 60–85% | > 85% |
| Cache hit ratio | > 95% | 90–95% | < 90% |
| Replication lag | < 100ms | 100ms–1s | > 1s |
| Active connections | < 150 | 150–200 | > 200 |

## Known Slow Query Patterns
The following query shapes are known to spike under load:

1. **Report aggregation queries** (SELECT + GROUP BY on transactions table, >10M rows)
   - Run on replica, but if replicas are lagging, fallback hits primary
   - Check: \`pg_stat_activity\` for queries > 5s with \`state='active'\`

2. **Session invalidation sweeps** (DELETE WHERE created_at < NOW() - INTERVAL '30 days')
   - Runs at 02:00 UTC nightly via cron
   - Can lock rows and spike P99 by 3–5x during execution (~8 min duration)

3. **Missing index on user_events.correlation_id**
   - Known issue, tracked in PLAT-4821
   - Workaround: queries using this field go through Redis cache first

## Redis Cache Behavior
- Cache stampede protection via Lua script (distributed lock, 500ms lease)
- If Redis goes down: service falls back to DB with circuit breaker (50% error rate threshold)
- **Important for Bits**: Redis errors appear in APM as \`redis.command.error\`, not HTTP errors

## Bits Investigation Hints
- Error spikes at 02:00 UTC are almost always the nightly cleanup job — not a real incident
- Replication lag > 1s will cause stale reads on the replica fleet; check \`pg_stat_replication\`
- Connection pool exhaustion manifests as \`db.pool.wait_timeout\` errors in APM, not DB errors
- Cache miss ratio spike + latency spike = cache invalidation event or Redis restart

## Useful Queries for Bits
\`\`\`
# DB query duration P99
p99:postgresql.query.duration{service:data-backend}

# Cache hit ratio
1 - (sum:redis.keyspace_misses{service:data-backend} /
     (sum:redis.keyspace_hits{service:data-backend} + sum:redis.keyspace_misses{service:data-backend}))

# Connection pool exhaustion
sum:pgbouncer.pools.sv_idle{service:data-backend} < 5 → pool near exhaustion

# Replication lag
max:postgresql.replication.delay{role:replica}
\`\`\`
`,
  },
  {
    id: 'bitsmd-ecommerce-platform',
    title: 'E-Commerce Platform bits.md',
    description: 'Enterprise-grade bits.md for high-traffic e-commerce systems. Covers seasonal peak planning, multiple payment provider dependencies, cart and checkout service SLOs, and Black Friday runbook links.',
    contentType: 'bits.md',
    monitorTypes: ['APM', 'Metric', 'Synthetics'],
    useCases: ['Incident Response', 'Performance Monitoring', 'On-call Setup'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'E-Commerce',
    stars: 445,
    usageCount: 2310,
    createdAt: '2024-09-10',
    tags: ['ecommerce', 'payments', 'checkout', 'high-traffic', 'seasonal', 'stripe', 'black-friday'],
    featured: true,
    trending: false,
    content: `# bits.md — E-Commerce Platform

## Service Overview
Core e-commerce platform serving 50M+ monthly active users. Handles product catalog,
cart management, checkout, and order fulfillment. Peak traffic during Black Friday/Cyber Monday
reaches 50,000+ RPS (10x normal).

**Team:** Commerce Platform
**On-call:** #commerce-oncall | PagerDuty: commerce-critical
**Incident Commanders:** See PagerDuty escalation policy
**Status page:** status.company.com

## Critical User Journeys (monitored by Synthetics)
1. **Checkout Flow** (synthetic-checkout-prod) — tests every 1 min from 5 locations
2. **Search → PDP → Add to Cart** (synthetic-browse-flow) — tests every 5 min
3. **Guest Checkout** (synthetic-guest-checkout) — tests every 2 min
4. **Payment Processing** (synthetic-payment-flow) — tests every 1 min, CRITICAL priority

## Service Dependencies
\`\`\`
Frontend (Next.js CDN)
  └── checkout-service
        ├── cart-service (Redis-backed, TTL 7 days)
        ├── inventory-service (stock validation)
        ├── pricing-service (rules engine, 800ms P99 SLA)
        └── payment-router
              ├── Stripe (primary, 70% of transactions)
              ├── PayPal (secondary, 20%)
              └── Adyen (enterprise customers, 10%)
\`\`\`

## Payment Provider Status
**Always check third-party status pages before escalating payment failures:**
- Stripe: https://status.stripe.com | @stripe on PagerDuty webhook
- PayPal: https://www.paypal-status.com
- Adyen: https://status.adyen.com

Payment failures split by provider: \`sum:payment.failure{*} by {provider}\`

## SLOs
| Journey | Availability SLO | Latency SLO | Revenue Impact/min |
|---------|-----------------|------------|---------------------|
| Checkout | 99.95% | P99 < 2s | ~$15,000 |
| Search | 99.9% | P99 < 500ms | ~$3,000 |
| Product Display | 99.9% | P99 < 300ms | ~$5,000 |

## Seasonal Peak Context
**Black Friday mode** (typically last Thursday/Friday of November):
- Auto-scaling pre-warmed 3 days before (checkout-service: min 20 pods)
- Read replicas doubled, Redis cluster scaled out
- Feature flags: \`dark_mode_features_disabled=true\`, \`recommendations_engine=simplified\`
- Incident Commander on standby shift, 30-min check-ins on #commerce-war-room

**Sales events** (triggered by marketing, 24-48hr notice):
- Slack: #peak-traffic-readiness
- Runbook: [Peak Traffic Readiness](https://wiki.internal/peak-traffic-readiness)

## Known Failure Modes
- **Pricing service timeouts** (> 2s): Fallback to cached price kicks in. Check \`pricing.cache_fallback_rate\`
- **Cart service Redis OOM**: Happens if memory > 85%. Check Redis INFO memory, flush expired keys
- **Stripe webhook backlog**: If Stripe webhooks queue > 1000, orders may show as pending. Check SQS queue \`stripe-webhooks-prod\`
- **Inventory race conditions**: During high concurrency, occasional oversell on last-unit items. Expected; reconciliation job runs hourly

## Bits Investigation Hints
- Payment failures ≠ application errors. Always isolate by provider first
- Cart abandonment spike often precedes checkout error spike by 2–3 minutes
- During sales events, error rate baseline is higher (0.5% acceptable, vs 0.05% normal)
- Inventory service is eventually consistent — brief stock discrepancies are expected
- Check synthetic test results FIRST during checkout incidents (fastest signal)
`,
  },
  {
    id: 'bitsmd-data-pipeline',
    title: 'Data Pipeline Service bits.md',
    description: 'bits.md for Kafka-based data pipeline services with batch processing jobs. Documents consumer lag baselines, offset management, job scheduling context, and Bits-friendly signal descriptions.',
    contentType: 'bits.md',
    monitorTypes: ['Metric', 'Log'],
    useCases: ['Incident Response', 'Performance Monitoring'],
    verified: false,
    author: 'priya.krishnamurthy',
    authorType: 'community',
    companySize: 'mid-market',
    industry: 'Data & Analytics',
    stars: 178,
    usageCount: 734,
    createdAt: '2025-01-08',
    tags: ['kafka', 'data-pipeline', 'batch-jobs', 'consumer-lag', 'spark', 'airflow'],
    featured: false,
    trending: false,
    content: `# bits.md — Data Pipeline Service

## Service Overview
Real-time and batch data processing service. Consumes from Kafka, transforms,
and writes to data warehouse (Snowflake) and operational databases.

**Team:** Data Engineering
**Slack:** #data-pipeline-oncall
**On-call rotates weekly** — see Opsgenie schedule

## Pipeline Architecture
\`\`\`
Event Sources → Kafka (12 partitions/topic) → Pipeline Workers → Destinations
                                                    ├── Snowflake (analytics)
                                                    ├── Elasticsearch (search index)
                                                    └── PostgreSQL (operational)

Batch Jobs (Airflow-orchestrated, runs on Spark):
  - daily_aggregations: 01:00 UTC (2–4 hour runtime)
  - weekly_rollups: Sunday 03:00 UTC (4–8 hour runtime)
  - backfill_jobs: Manual trigger only
\`\`\`

## Kafka Topics & Consumer Groups
| Topic | Partitions | Consumer Group | Lag SLO | Avg Throughput |
|-------|-----------|---------------|---------|----------------|
| user-events | 12 | pipeline-worker-prod | < 10,000 msg | 50k msg/min |
| order-events | 6 | order-processor-prod | < 1,000 msg | 5k msg/min |
| clickstream | 24 | analytics-writer-prod | < 100,000 msg | 500k msg/min |
| error-events | 4 | error-aggregator-prod | < 500 msg | 1k msg/min |

## Consumer Lag Baselines
Consumer lag is **expected and not always an incident**:
- **user-events** lag spike to 50k: Normal during traffic spikes, should recover < 30 min
- **order-events** lag > 5k: Investigate — may impact order status updates
- **clickstream** lag > 500k: Normal, this is best-effort analytics
- **error-events** lag > 2k: Investigate — error aggregation delay affects alerting

## Batch Job Context for Bits
When Bits sees high CPU/memory on pipeline-worker pods between 01:00–05:00 UTC,
this is expected — the Airflow batch jobs are running. **Not an incident.**

If Spark jobs fail, check Airflow UI first: https://airflow.internal/dags
Common failure reasons:
1. Snowflake warehouse timeout (increase query timeout in job config)
2. OOM in Spark executor (check \`spark.executor.memory\` — may need increase for large datasets)
3. Schema mismatch (new fields in upstream data — check schema registry)

## Bits Investigation Hints
- Kafka consumer lag spikes are usually traffic spikes, not pipeline failures
- Check if an Airflow job is running before assuming CPU anomaly is an incident
- Dead letter queue (DLQ) message count > 100 is the real signal for data quality issues
- Snowflake query failures appear in logs as \`SnowflakeError\`, not as service HTTP errors
- Reprocessing jobs (backfills) cause intentional duplicate writes — always check Airflow first

## Key Metrics
\`\`\`
# Consumer lag by topic
kafka.consumer.lag{consumer_group:pipeline-worker-prod} by {topic}

# Batch job duration
airflow.dag.duration{dag_id:daily_aggregations}

# DLQ depth
aws.sqs.approximate_number_of_messages_visible{queuename:pipeline-dlq}

# Snowflake write throughput
sum:custom.snowflake.rows_written{service:data-pipeline}.as_rate()
\`\`\`
`,
  },

  // ─────────────────────────────────────────
  // Monitor Templates (6–10)
  // ─────────────────────────────────────────
  {
    id: 'monitor-high-error-rate-apm',
    title: 'High Error Rate — APM Service',
    description: 'Production-ready APM error rate monitor with Bits-optimized alert message. Includes template variables, dynamic thresholds, Bits chat prompt suggestions, and runbook links baked into the notification.',
    contentType: 'Monitor Template',
    monitorTypes: ['APM'],
    useCases: ['Incident Response', 'On-call Setup'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 521,
    usageCount: 3240,
    createdAt: '2024-08-20',
    tags: ['apm', 'error-rate', 'monitor', 'latency', 'service-level'],
    featured: false,
    trending: true,
    content: `## Datadog Monitor Configuration

**Monitor Name:** [SERVICE] High Error Rate — {{service.name}}

**Monitor Query:**
\`\`\`
sum(last_5m):sum:trace.web.request.errors{service:{{service.name}},env:production}.as_rate() / sum:trace.web.request.hits{service:{{service.name}},env:production}.as_rate() > 0.05
\`\`\`

**Alert Thresholds:**
- Critical: > 5% error rate
- Warning: > 2% error rate
- Recovery: < 1% error rate

**Monitor Message:**
\`\`\`
## 🚨 High Error Rate Detected — {{service.name}}

**Current error rate:** {{value}}%
**Threshold:** {{threshold}}%
**Environment:** {{env.name}}
**Service:** {{service.name}}
**Resource:** {{resource_name}}

### Current Error Rate: {{value}}%
Error rate has exceeded {{threshold}}% for service **{{service.name}}** in **{{env.name}}**.

### Immediate Actions
1. Check recent deployments: did anything ship in the last 30 minutes?
2. Review error breakdown by \`http.status_code\` and \`error.type\`
3. Correlate with downstream dependency health

### Ask Bits
> "What is causing the error rate spike for {{service.name}} starting around {{last_triggered_at}}?
> Show me the top error types and correlate with any recent deployments or upstream dependency changes."

### Useful Links
- [APM Service Map](https://app.datadoghq.com/apm/map?env=production&service={{service.name}})
- [Error Traces](https://app.datadoghq.com/apm/traces?query=service:{{service.name}}%20status:error&env=production)
- [Runbook](https://wiki.internal/runbooks/service-degradation)

### Escalation
- P1 (error rate > 10%): Page on-call immediately
- P2 (error rate 5–10%): Notify #incidents channel, investigate within 15 min

@pagerduty-{{service.name}}-oncall
{{#is_alert}}@slack-incidents{{/is_alert}}
{{#is_warning}}@slack-engineering{{/is_warning}}
\`\`\`

**Tags to apply:** \`service:{{service.name}}\`, \`env:production\`, \`team:{{team}}\`, \`severity:p1\`

**Monitor Options:**
- Evaluation window: 5 minutes
- Renotify: every 30 minutes while in alert state
- Require full window of data before alerting: Yes
- No data: Do not alert (expected during deployments)
`,
  },
  {
    id: 'monitor-pod-crashloop',
    title: 'Pod CrashLoopBackOff Alert',
    description: 'Kubernetes pod crash loop monitor with namespace and deployment template variables. Alert message guides on-call engineers through the right kubectl commands and prompts Bits for root cause.',
    contentType: 'Monitor Template',
    monitorTypes: ['Infrastructure'],
    useCases: ['Incident Response', 'On-call Setup'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 389,
    usageCount: 2180,
    createdAt: '2024-09-05',
    tags: ['kubernetes', 'crashloop', 'pods', 'k8s', 'infrastructure'],
    featured: false,
    trending: false,
    content: `## Datadog Monitor Configuration

**Monitor Name:** K8s Pod CrashLoopBackOff — {{kube_namespace}} / {{kube_deployment}}

**Monitor Query:**
\`\`\`
max(last_10m):max:kubernetes_state.container.status_report.count.waiting{
  reason:crashloopbackoff,
  kube_namespace:{{kube_namespace}}
} by {kube_deployment,kube_namespace,pod_name} >= 1
\`\`\`

**Alert Thresholds:**
- Critical: >= 1 pod in CrashLoopBackOff for 10+ minutes
- Warning: >= 1 pod in CrashLoopBackOff for 5 minutes

**Monitor Message:**
\`\`\`
## 🔴 Pod CrashLoopBackOff Detected

**Deployment:** {{kube_deployment.name}}
**Namespace:** {{kube_namespace.name}}
**Pod:** {{pod_name.name}}
**Cluster:** {{cluster_name.name}}

A pod has been in CrashLoopBackOff for {{value}} restart(s).

### Immediate Triage Commands
\`\`\`bash
# Check pod status
kubectl get pods -n {{kube_namespace.name}} -l app={{kube_deployment.name}} -o wide

# View crash logs (last crash)
kubectl logs -n {{kube_namespace.name}} {{pod_name.name}} --previous --tail=100

# Describe pod for events/OOM signals
kubectl describe pod -n {{kube_namespace.name}} {{pod_name.name}}

# Check resource limits
kubectl get pod -n {{kube_namespace.name}} {{pod_name.name}} -o jsonpath='{.spec.containers[*].resources}'
\`\`\`

### Common Root Causes
- **OOMKilled**: Container exceeded memory limit → increase limit or investigate memory leak
- **ConfigMap/Secret missing**: Check for missing environment variables in describe output
- **Liveness probe failing**: Application not starting in time → check startup logs
- **Dependency unavailable**: DB or external service unreachable at startup

### Ask Bits
> "Why is {{kube_deployment.name}} in namespace {{kube_namespace.name}} crash looping?
> Show me the container logs, recent events, and any correlated infrastructure changes."

### Runbook
https://wiki.internal/runbooks/pod-crashloop

@pagerduty-platform-oncall
{{#is_alert}}@slack-platform-incidents{{/is_alert}}
\`\`\`

**Tags:** \`kube_namespace:{{kube_namespace}}\`, \`kube_deployment:{{kube_deployment}}\`, \`env:production\`

**Note:** Set \`kube_namespace\` template variable to scope this monitor to your namespace.
`,
  },
  {
    id: 'monitor-db-connection-pool',
    title: 'Database Connection Pool Exhausted',
    description: 'Monitor for PgBouncer/connection pool exhaustion with warning and critical thresholds. Fires before complete exhaustion so on-call has time to act. Includes Bits prompt for root cause analysis.',
    contentType: 'Monitor Template',
    monitorTypes: ['Metric'],
    useCases: ['Incident Response', 'Performance Monitoring'],
    verified: false,
    author: 'james.whitfield',
    authorType: 'community',
    companySize: 'mid-market',
    industry: 'FinTech',
    stars: 267,
    usageCount: 1120,
    createdAt: '2024-11-30',
    tags: ['database', 'postgresql', 'pgbouncer', 'connection-pool', 'metric'],
    featured: true,
    trending: false,
    content: `## Datadog Monitor Configuration

**Monitor Name:** DB Connection Pool Utilization High — {{service.name}}

**Monitor Query:**
\`\`\`
avg(last_5m):
  (
    sum:pgbouncer.pools.sv_active{service:{{service.name}}} +
    sum:pgbouncer.pools.sv_used{service:{{service.name}}}
  ) /
  sum:pgbouncer.pools.maxwait{service:{{service.name}}} * 100 > 85
\`\`\`

**Alternative Query (if using custom metrics):**
\`\`\`
avg(last_5m):
  avg:custom.db.pool.utilization_pct{service:{{service.name}},env:production} > 85
\`\`\`

**Alert Thresholds:**
- Critical: > 85% pool utilization (connections about to be refused)
- Warning: > 70% pool utilization (elevated, investigate)
- Recovery: < 60%

**Monitor Message:**
\`\`\`
## ⚠️ Database Connection Pool Approaching Exhaustion

**Service:** {{service.name}}
**Current utilization:** {{value}}%
**Threshold:** {{threshold}}%
**Database host:** {{db_host}} *(set via tag)*

Connection pool is at **{{value}}% utilization**. At 100%, new requests will fail with
"too many clients" errors. Act before this escalates.

### Immediate Investigation
\`\`\`sql
-- Run on the database to find long-running queries holding connections
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds'
ORDER BY duration DESC;

-- Check total connections by state
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

-- PgBouncer stats
SHOW POOLS;
SHOW CLIENTS;
\`\`\`

### Common Causes
1. **Long-running transactions not committing**: Look for queries in \`idle in transaction\` state
2. **Connection leak in application**: Connections opened but not released
3. **Traffic spike**: More app instances than expected — check HPA/deployment scaling
4. **Deadlock cascade**: Queries blocking each other

### Ask Bits
> "Why is the database connection pool for {{service.name}} reaching exhaustion?
> Show me query latency trends, active connection counts, and any related error spikes
> in the last 30 minutes."

### Mitigation
- Short-term: Restart application pods to release leaked connections (verify first)
- Long-term: Increase pool size (pgbouncer.ini \`pool_size\`) or investigate connection leak

@pagerduty-{{team}}-oncall
@slack-db-oncall
\`\`\`

**Tags:** \`service:{{service.name}}\`, \`team:{{team}}\`, \`component:database\`
`,
  },
  {
    id: 'monitor-synthetic-critical-path',
    title: 'Synthetic Critical Path Failure',
    description: 'Monitor template for Synthetic test failures on critical user journeys. Designed to alert on complete journey failure vs individual step failure, with multi-location awareness and Bits investigation guidance.',
    contentType: 'Monitor Template',
    monitorTypes: ['Synthetics'],
    useCases: ['Incident Response', 'Performance Monitoring'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'E-Commerce',
    stars: 198,
    usageCount: 876,
    createdAt: '2024-10-15',
    tags: ['synthetics', 'browser-test', 'user-journey', 'critical-path', 'availability'],
    featured: false,
    trending: false,
    content: `## Datadog Monitor Configuration

**Monitor Name:** Synthetic Critical Path Failure — {{test_name}}

**Monitor Type:** Composite Monitor (combine multiple synthetic test monitors)

**Query (for individual synthetic test):**
\`\`\`
synthetics.test_duration{test_id:{{synthetic_test_id}},location:*}
\`\`\`

**Composite Monitor — Alert when test fails from majority of locations:**
\`\`\`
# Alert when test fails from >= 3 out of 5 locations
monitor id {{monitor_location_1}} && monitor id {{monitor_location_2}} && monitor id {{monitor_location_3}}
\`\`\`

**Monitor Message:**
\`\`\`
## 🔴 Critical User Journey Failure — {{test_name}}

**Test:** {{test_name}}
**Failed from locations:** {{failing_locations}}
**Step that failed:** {{failed_step}}
**Error:** {{error_message}}
**Test URL:** [View in Datadog](https://app.datadoghq.com/synthetics/details/{{test_public_id}})

### Journey: {{test_name}}
A critical synthetic test has failed from {{failing_locations_count}} location(s),
indicating a **real user-impacting issue**, not a fluke.

### Failed at Step
\`\`\`
Step {{failed_step_number}}: {{failed_step}}
Error: {{error_message}}
\`\`\`

### Correlation Checklist
- [ ] Check APM service errors for the affected service
- [ ] Verify CDN/load balancer health (CloudFront, ALB)
- [ ] Check for recent deployments (last 30 min)
- [ ] Verify database connectivity from the web tier
- [ ] Check third-party dependencies (auth, payments)

### Ask Bits
> "The synthetic test '{{test_name}}' is failing at step '{{failed_step}}'.
> What backend errors correlate with this failure? Is this affecting real users
> based on RUM data?"

### Real User Impact
Check RUM for actual user impact:
- [Core Web Vitals](https://app.datadoghq.com/rum/performance-monitoring)
- [Session Explorer](https://app.datadoghq.com/rum/sessions?query=has_error:true)

@pagerduty-web-oncall
{{#is_alert}}@slack-incidents @slack-webops{{/is_alert}}
\`\`\`
`,
  },
  {
    id: 'monitor-anomaly-traffic-drop',
    title: 'Anomaly — Sudden Traffic Drop',
    description: 'Anomaly detection monitor for unexpected drops in service traffic, request rate, or event volume. Uses adaptive baseline with day-of-week awareness. Critical for catching silent failures.',
    contentType: 'Monitor Template',
    monitorTypes: ['Anomaly'],
    useCases: ['Incident Response', 'Performance Monitoring'],
    verified: false,
    author: 'alex.nguyen',
    authorType: 'community',
    companySize: 'startup',
    industry: 'SaaS',
    stars: 231,
    usageCount: 987,
    createdAt: '2025-01-20',
    tags: ['anomaly', 'traffic', 'silent-failure', 'request-rate', 'drop'],
    featured: false,
    trending: false,
    content: `## Datadog Monitor Configuration

**Monitor Name:** Anomaly — Traffic Drop Detected — {{service.name}}

**Monitor Query (Anomaly Detection):**
\`\`\`
avg(last_30m):anomalies(
  sum:trace.web.request.hits{service:{{service.name}},env:production}.as_rate(),
  'agile',
  3,
  direction='below',
  alert_window='last_15m',
  interval=60,
  count_default_zero='true',
  seasonality='weekly'
) >= 1
\`\`\`

**Alert Thresholds:**
- Critical: Anomaly score >= 1 (3 standard deviations below expected, for 15 minutes)
- Warning: Anomaly score >= 0.75

**Monitor Message:**
\`\`\`
## ⚠️ Unexpected Traffic Drop — {{service.name}}

**Service:** {{service.name}}
**Current RPS:** {{value}} req/s
**Expected (baseline):** ~{{threshold}} req/s
**Drop duration:** > 15 minutes

An anomalous **traffic drop** has been detected. This may indicate:
- A silent failure (requests failing before reaching the service)
- Load balancer routing issue
- DNS resolution failure
- Upstream service not sending traffic
- Feature flag that accidentally disabled traffic routing

### Silent Failure Checklist
Traffic drops are often MORE serious than error spikes because they can indicate
failures at the infrastructure layer that don't generate application errors.

1. **Check load balancer**: Are ALB/ELB health checks passing?
2. **Check DNS**: Is the service hostname resolving correctly?
3. **Check upstream**: Is the caller service also showing reduced traffic?
4. **Check deployment**: Was there a recent config change or deployment?
5. **Check network policies**: Any recent K8s NetworkPolicy changes?

### Ask Bits
> "{{service.name}} is receiving significantly less traffic than expected for this time of day/week.
> What could explain this drop? Check upstream services, load balancer health, and recent
> infrastructure changes starting from {{last_triggered_at}}."

### Expected Traffic Baseline
This monitor uses weekly seasonality, so it accounts for lower traffic on weekends.
If you intentionally reduced traffic (maintenance, canary rollback), silence this monitor.

@pagerduty-{{service.name}}-oncall
@slack-incidents
\`\`\`

**Important Notes:**
- Set \`seasonality='weekly'\` if your traffic has day-of-week patterns
- Use \`direction='below'\` to only alert on drops (not spikes)
- The \`count_default_zero='true'\` ensures periods with 0 traffic still trigger
`,
  },

  // ─────────────────────────────────────────
  // Runbooks (11–14)
  // ─────────────────────────────────────────
  {
    id: 'runbook-service-degradation',
    title: 'Service Degradation Runbook',
    description: 'Comprehensive runbook for service degradation incidents, structured with sections Bits AI expects. Covers triage, investigation, mitigation, and post-incident steps with copy-pasteable commands.',
    contentType: 'Runbook',
    monitorTypes: ['APM', 'Metric'],
    useCases: ['Incident Response', 'Post-Incident'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 612,
    usageCount: 4120,
    createdAt: '2024-07-18',
    tags: ['runbook', 'incident', 'degradation', 'triage', 'mitigation', 'structured'],
    featured: true,
    trending: false,
    content: `# Service Degradation Runbook

## Overview
**When to use:** Service error rate > 1%, P99 latency > 2x baseline, or availability SLO breach.
**Expected time to resolve:** 15–60 minutes depending on cause.
**Severity:** P1 (> 5% error rate), P2 (1–5%), P3 (< 1% but SLO burn)

---

## Phase 1: Immediate Triage (0–5 min)

### 1.1 Declare the Incident
\`\`\`bash
# Create incident in Datadog
dd incident create --title "[SERVICE] Degradation" --severity P2

# Or via Slack:
/incident declare "[SERVICE] is degraded - elevated error rate"
\`\`\`

### 1.2 Ask Bits for Initial Context
Paste into Bits chat:
\`\`\`
What is causing the degradation in [SERVICE]?
Show me: error rate trend, P99 latency, top error types,
any correlated deploys or infrastructure changes in the last hour.
\`\`\`

### 1.3 Establish Blast Radius
- How many users are affected? (check RUM error rate)
- Which endpoints/operations are failing?
- Is this a total outage or partial degradation?
- Are downstream services impacted?

---

## Phase 2: Root Cause Investigation (5–20 min)

### 2.1 Check Recent Changes
\`\`\`bash
# Recent deploys (ArgoCD)
argocd app history [app-name] --last 5

# Recent config changes
kubectl rollout history deployment/[service-name] -n [namespace]

# Recent infrastructure changes
git log --oneline -20 -- terraform/
\`\`\`

### 2.2 Isolate by Component
Work through this decision tree:

**Is the database healthy?**
\`\`\`sql
-- Check for long-running queries
SELECT pid, duration, query FROM pg_stat_activity
WHERE duration > interval '10 seconds' ORDER BY duration DESC;
\`\`\`

**Is the cache responding?**
\`\`\`bash
redis-cli -h [redis-host] ping
redis-cli -h [redis-host] info stats | grep -E 'hit|miss'
\`\`\`

**Are dependent services healthy?**
\`\`\`bash
# Check each upstream dependency
curl -s https://[dependency-health-endpoint]/health | jq .
\`\`\`

### 2.3 Review Logs
\`\`\`bash
# Kubernetes logs
kubectl logs -n [namespace] -l app=[service] --since=15m | grep -i error | head -50

# Or via Datadog Log Explorer query:
# service:[service-name] status:error @http.status_code:5*
\`\`\`

---

## Phase 3: Mitigation (20–45 min)

### 3.1 Quick Mitigation Options (ordered by risk)

**Option A — Roll back deployment (LOWEST RISK if cause is a deploy)**
\`\`\`bash
kubectl rollout undo deployment/[service-name] -n [namespace]
kubectl rollout status deployment/[service-name] -n [namespace]
\`\`\`

**Option B — Restart degraded pods**
\`\`\`bash
# Restart specific pod
kubectl delete pod [pod-name] -n [namespace]

# Rolling restart all pods
kubectl rollout restart deployment/[service-name] -n [namespace]
\`\`\`

**Option C — Enable feature flag for degraded mode**
\`\`\`bash
# If service has a degraded mode feature flag
curl -X PATCH https://flagd.internal/flags/[service]_degraded_mode \
  -d '{"enabled": true}'
\`\`\`

**Option D — Scale up to absorb traffic**
\`\`\`bash
kubectl scale deployment/[service-name] --replicas=10 -n [namespace]
\`\`\`

### 3.2 Verify Mitigation is Working
- Error rate should start dropping within 2–3 minutes
- Check APM trace error rate graph
- Verify synthetic tests are passing again

---

## Phase 4: Post-Incident (45+ min)

### 4.1 Write Initial Impact Summary
\`\`\`
Incident: [SERVICE] Degradation
Duration: [start time] – [end time] ([X] minutes)
Impact: [X]% error rate, estimated [N] users affected
Root cause: [1-sentence summary]
Mitigation: [what you did]
\`\`\`

### 4.2 Ask Bits for Post-Incident Summary
\`\`\`
Generate a post-incident summary for the degradation in [SERVICE]
that occurred between [start time] and [end time].
Include: root cause, impact (error rate, user count),
contributing factors, and timeline of events.
\`\`\`

### 4.3 Schedule Post-Mortem
- P1 incidents: Post-mortem within 48 hours
- P2 incidents: Post-mortem within 1 week
- Use the post-mortem template: [Post-Mortem Template](https://wiki.internal/postmortem-template)
`,
  },
  {
    id: 'runbook-db-failover',
    title: 'Database Failover Runbook',
    description: 'Step-by-step runbook for triggering and managing a PostgreSQL primary database failover to a read replica. Includes pre-failover checklist, application reconnection steps, and data consistency verification.',
    contentType: 'Runbook',
    monitorTypes: ['Metric'],
    useCases: ['Incident Response'],
    verified: false,
    author: 'diana.kowalski',
    authorType: 'community',
    companySize: 'enterprise',
    industry: 'FinTech',
    stars: 334,
    usageCount: 1560,
    createdAt: '2024-11-02',
    tags: ['database', 'failover', 'postgresql', 'rds', 'dr', 'replica'],
    featured: false,
    trending: false,
    content: `# Database Failover Runbook

## Overview
**When to use:** Primary DB unavailable, RDS instance degraded, or planned maintenance failover.
**RTO Target:** < 10 minutes
**RPO Target:** < 30 seconds (replication lag at time of failover)
**Requires:** DB Admin access + application team coordination

---

## Pre-Failover Checklist

Before triggering failover, confirm:
- [ ] Primary DB is actually unavailable (not just a monitoring glitch)
- [ ] Replica is healthy and replication lag < 60 seconds
- [ ] Application team is notified and standing by
- [ ] Incident channel is open: #db-incidents
- [ ] DBA is present (page if needed: PagerDuty → db-admin-oncall)

\`\`\`bash
# Check replication lag
psql -h [replica-host] -U datadog -c "
SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"

# Check replica is caught up
psql -h [replica-host] -U datadog -c "
SELECT pg_is_in_recovery(), pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"
\`\`\`

---

## Phase 1: Application Traffic Cutover (0–2 min)

### 1.1 Enable Maintenance Mode (Reduce New Traffic)
\`\`\`bash
# Enable maintenance page via load balancer
aws elbv2 modify-rule --rule-arn [maintenance-rule-arn] \
  --actions Type=fixed-response,FixedResponseConfig={StatusCode=503,MessageBody="Maintenance in progress"}
\`\`\`

### 1.2 Drain In-Flight Transactions
\`\`\`sql
-- Wait for active transactions to complete (monitor this)
SELECT count(*) FROM pg_stat_activity WHERE state != 'idle';
-- Wait until count reaches 0 or set a 30-second timeout
\`\`\`

---

## Phase 2: Promote Replica (2–5 min)

### 2.1 For AWS RDS (Recommended)
\`\`\`bash
# RDS automatic failover (Multi-AZ) — triggers within 60 seconds automatically
# For manual forced failover:
aws rds reboot-db-instance \
  --db-instance-identifier [primary-instance-id] \
  --force-failover

# Monitor failover progress
watch -n 5 "aws rds describe-db-instances \
  --db-instance-identifier [primary-instance-id] \
  --query 'DBInstances[0].DBInstanceStatus'"
\`\`\`

### 2.2 For Self-Managed PostgreSQL
\`\`\`bash
# On the replica server
pg_ctl promote -D /var/lib/postgresql/data

# Verify it's now primary
psql -h [replica-host] -c "SELECT pg_is_in_recovery();"
# Should return: f (false = now primary)
\`\`\`

---

## Phase 3: Update Application Connections (5–8 min)

### 3.1 Update PgBouncer / Connection String
\`\`\`bash
# Update connection string in application config
kubectl set env deployment/[service-name] \
  DATABASE_URL="postgresql://[user]:[pass]@[new-primary-host]:5432/[dbname]" \
  -n [namespace]

# Or update the Kubernetes Secret
kubectl patch secret db-credentials -n [namespace] \
  -p '{"stringData": {"host": "[new-primary-host]"}}'

# Restart application pods to pick up new connection
kubectl rollout restart deployment/[service-name] -n [namespace]
\`\`\`

### 3.2 Verify Application Connectivity
\`\`\`bash
# Check application health endpoint
curl https://[service-url]/health | jq '.database'

# Watch pod startup
kubectl rollout status deployment/[service-name] -n [namespace]
\`\`\`

---

## Phase 4: Restore Traffic (8–10 min)

\`\`\`bash
# Disable maintenance mode
aws elbv2 modify-rule --rule-arn [maintenance-rule-arn] \
  --actions Type=forward,TargetGroupArn=[target-group-arn]

# Verify traffic flowing
watch -n 5 'aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=[alb-name] \
  --start-time $(date -u -v-5M +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 --statistics Sum'
\`\`\`

---

## Phase 5: Post-Failover Verification

\`\`\`sql
-- Verify write operations working
INSERT INTO health_check (check_time) VALUES (now()) RETURNING *;

-- Verify no data loss (check last few transactions)
SELECT * FROM [critical_table] ORDER BY created_at DESC LIMIT 10;

-- Check for replication setup (for future failover)
SELECT * FROM pg_stat_replication;
\`\`\`

**After failover is complete:**
- Provision a new replica from the new primary (for HA restoration)
- Schedule post-incident review
- Update DNS if using custom DB hostnames
`,
  },
  {
    id: 'runbook-memory-leak',
    title: 'Memory Leak Investigation Runbook',
    description: 'Systematic approach to identifying and mitigating memory leaks in production services. Covers JVM heap analysis, Node.js heap dumps, container memory metrics, and safe pod rotation strategies.',
    contentType: 'Runbook',
    monitorTypes: ['Metric', 'Infrastructure'],
    useCases: ['Incident Response', 'Performance Monitoring', 'Post-Incident'],
    verified: false,
    author: 'tomás.herrera',
    authorType: 'community',
    companySize: 'mid-market',
    industry: 'SaaS',
    stars: 289,
    usageCount: 1340,
    createdAt: '2024-12-10',
    tags: ['memory-leak', 'heap', 'oom', 'jvm', 'nodejs', 'kubernetes', 'profiling'],
    featured: false,
    trending: false,
    content: `# Memory Leak Investigation Runbook

## Overview
**Symptoms:** Container memory steadily growing, OOMKilled pods, increasing GC pressure,
gradual latency degradation over hours/days.
**First action:** Implement safe pod rotation to buy time, then investigate.

---

## Phase 1: Immediate Mitigation (0–10 min)

### 1.1 Identify Affected Pods
\`\`\`bash
# List pods by memory usage (highest first)
kubectl top pods -n [namespace] --sort-by=memory | head -20

# Check for OOMKilled history
kubectl get pods -n [namespace] -o json | jq -r \
  '.items[] | select(.status.containerStatuses[]?.lastState.terminated.reason == "OOMKilled") | .metadata.name'
\`\`\`

### 1.2 Safe Rolling Rotation (Buys Time)
\`\`\`bash
# Rolling restart — replaces pods gradually without downtime
kubectl rollout restart deployment/[service-name] -n [namespace]

# Lower the memory limit temporarily if OOMKill imminent
# (increases limit to give breathing room, not fix the leak)
kubectl set resources deployment/[service-name] \
  --limits=memory=2Gi -n [namespace]
\`\`\`

### 1.3 Ask Bits for Context
\`\`\`
Show me the memory usage trend for [service-name] over the last 24 hours.
Is this a gradual climb (leak) or a sudden jump (memory spike)?
Are any pods showing OOMKilled events?
\`\`\`

---

## Phase 2: Confirm It's a Leak (10–20 min)

A true memory leak shows a **sawtooth pattern**: gradual growth, OOMKill/restart, growth again.

### 2.1 Memory Growth Pattern Query
In Datadog, check:
\`\`\`
# Container memory usage over 48h
avg:kubernetes.memory.usage{kube_deployment:[service-name],kube_namespace:[namespace]} by {pod_name}
\`\`\`

Expected leak pattern:
- Memory grows monotonically
- Never decreases even during low-traffic periods
- Restarts reset memory, then it grows again

---

## Phase 3: Collect Heap Dump (20–45 min)

### 3.1 Node.js Services
\`\`\`bash
# Exec into the highest-memory pod
kubectl exec -it [pod-name] -n [namespace] -- /bin/sh

# Trigger heap snapshot (requires --expose-gc flag or heapdump module)
kill -USR2 $(pgrep node)  # If configured with heapdump signal handler

# Or via Node.js REPL / REST endpoint if exposed:
curl -X POST http://localhost:9229/heap-snapshot > heap-$(date +%s).heapsnapshot

# Copy from pod to local
kubectl cp [namespace]/[pod-name]:/tmp/heap-snapshot.heapsnapshot ./heap-snapshot.heapsnapshot
\`\`\`

Analyze with Chrome DevTools: \`chrome://inspect\` → Open dedicated DevTools → Memory → Load snapshot

### 3.2 JVM Services (Java/Kotlin/Scala)
\`\`\`bash
# Get heap dump
kubectl exec -it [pod-name] -n [namespace] -- \
  jmap -dump:format=b,file=/tmp/heap.hprof $(pgrep java)

# Copy to local
kubectl cp [namespace]/[pod-name]:/tmp/heap.hprof ./heap.hprof

# Analyze with Eclipse MAT or VisualVM
# Look for: objects with highest retained heap, class instances count
\`\`\`

### 3.3 Go Services
\`\`\`bash
# Enable pprof endpoint in code (should already be enabled in non-prod)
curl http://[pod-ip]:6060/debug/pprof/heap > heap.pprof
go tool pprof -http=:8080 heap.pprof
\`\`\`

---

## Phase 4: Common Root Causes & Fixes

| Pattern | Likely Cause | Fix |
|---------|-------------|-----|
| Large number of string instances | Unbounded caches, log buffers | Add cache eviction / size limits |
| Event listeners accumulating | Missing removeEventListener / unsubscribe | Audit all event registrations |
| Closure holding large objects | Callbacks keeping scope alive | Reduce closure scope |
| Database result sets not released | ResultSet/cursor not closed | Add finally blocks for cleanup |
| HTTP keep-alive connections | Connection pool not bounded | Set maxSockets limit |

---

## Phase 5: Long-term Monitoring
\`\`\`
# Add memory growth rate alert
avg(last_1h):derivative(avg:kubernetes.memory.usage{service:[service-name]}) > 10000000
# Alerts if memory grows > 10MB/hour on average
\`\`\`
`,
  },
  {
    id: 'runbook-cascading-failure',
    title: 'Cascading Failure Runbook',
    description: 'Multi-service cascading failure response runbook. Guides incident commanders through blast radius assessment, dependency circuit breaking, traffic shedding, and coordinated recovery sequencing.',
    contentType: 'Runbook',
    monitorTypes: ['APM', 'Metric', 'Infrastructure'],
    useCases: ['Incident Response', 'Post-Incident'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 478,
    usageCount: 2890,
    createdAt: '2024-10-08',
    tags: ['cascading-failure', 'multi-service', 'circuit-breaker', 'incident-command', 'traffic-shedding'],
    featured: false,
    trending: true,
    content: `# Cascading Failure Runbook

## Overview
A cascading failure occurs when one service's degradation causes failures in dependent services,
which in turn cause failures in their dependents. This runbook guides the incident commander
through structured containment and recovery.

**Key principle:** Stop the cascade FIRST, investigate SECOND.

---

## Recognizing a Cascading Failure

Signs you have a cascade (not a single-service incident):
- Multiple services showing errors simultaneously
- Error rate increasing over time (not stable)
- Services showing timeouts to dependencies
- APM service map showing multiple red nodes spreading from a source

\`\`\`
# Ask Bits:
"Are multiple services degraded right now? Show me the APM service map
and identify which service appears to be the origin of the cascade."
\`\`\`

---

## Phase 1: Stop the Cascade (0–10 min)

**Priority: Prevent healthy services from being dragged down.**

### 1.1 Identify the Origin Service
\`\`\`
# In Bits:
"Which service started degrading first? Show me error rate timelines for all
affected services in the last 30 minutes, ordered by when errors first appeared."
\`\`\`

### 1.2 Enable Circuit Breakers
If your services use a service mesh (Istio/Linkerd) or SDK circuit breakers:

\`\`\`bash
# Istio: Apply circuit breaker to failing upstream
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: [failing-service]-circuit-breaker
  namespace: [namespace]
spec:
  host: [failing-service]
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 100
EOF
\`\`\`

### 1.3 Traffic Shedding (If Load Is Amplifying the Cascade)
\`\`\`bash
# Rate limit at ingress (Nginx example)
kubectl annotate ingress [service-ingress] \
  nginx.ingress.kubernetes.io/limit-rps=100 \
  -n [namespace]

# Or reduce upstream traffic by adding a header-based routing rule
# to route % of traffic to a static response
\`\`\`

### 1.4 Isolate the Origin Service
\`\`\`bash
# Remove origin service from load balancer to stop traffic flowing to it
kubectl scale deployment/[origin-service] --replicas=0 -n [namespace]
# WARNING: This takes the service down. Only do this if it's causing cascade.
\`\`\`

---

## Phase 2: Stabilize (10–25 min)

### 2.1 Recovery Sequencing
Restart services from **leaves to root** (not root to leaves):
1. Identify services with no downstream dependencies first
2. Restart/recover those first
3. Work back up the dependency tree

\`\`\`bash
# Example recovery order (customize to your topology)
# 1. notification-service (no dependents)
kubectl rollout restart deployment/notification-service -n [namespace]

# 2. auth-service (only used by api-gateway)
kubectl rollout restart deployment/auth-service -n [namespace]

# 3. api-gateway (entry point, last)
kubectl rollout restart deployment/api-gateway -n [namespace]
\`\`\`

### 2.2 Verify Each Service Before Proceeding
\`\`\`bash
# After each restart, verify error rate drops before proceeding to next
watch -n 10 'kubectl top pods -n [namespace]'
# And check Datadog error rate in the APM service
\`\`\`

---

## Phase 3: Root Cause Investigation (25–60 min)

Once cascade is stopped and services are recovering:

### 3.1 Ask Bits for Timeline Reconstruction
\`\`\`
Reconstruct the cascade timeline for the incident between [start time] and [end time].
Show me: which service failed first, how errors propagated, what metrics changed
in what order, and what the root cause appears to be.
\`\`\`

### 3.2 Common Root Causes of Cascades
- **Slow DB query blocking threads** → thread pool exhaustion → timeouts → cascade
- **Deployment of bad code** to high-traffic service → errors amplified downstream
- **Memory leak reaching OOM** → pod restart loop → dependency timeouts
- **Network partition** between service mesh nodes
- **Third-party API degradation** causing connection pool exhaustion

---

## Phase 4: Post-Cascade Actions

- [ ] Implement circuit breakers for services that lacked them
- [ ] Add timeout configuration for all service-to-service calls
- [ ] Review retry policies — retries amplify cascades (use exponential backoff + jitter)
- [ ] Add bulkhead pattern for critical paths (separate thread pools)
- [ ] Write blameless post-mortem within 48 hours
`,
  },

  // ─────────────────────────────────────────
  // Chat Prompts (15–18)
  // ─────────────────────────────────────────
  {
    id: 'prompts-root-cause-investigation',
    title: 'Root Cause Investigation Prompts',
    description: 'A curated collection of 10 battle-tested Bits chat prompts for root cause analysis. Covers error correlation, deployment causation, dependency failure tracing, and multi-signal investigation workflows.',
    contentType: 'Chat Prompts',
    monitorTypes: ['APM', 'Metric', 'Log', 'Infrastructure'],
    useCases: ['Incident Response'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 834,
    usageCount: 6240,
    createdAt: '2024-06-15',
    tags: ['chat-prompts', 'root-cause', 'investigation', 'bits', 'incident', 'prompts'],
    featured: true,
    trending: true,
    content: `# Root Cause Investigation Prompts for Bits

Copy and paste these prompts directly into Bits during an incident investigation.
Replace placeholders in [brackets] with actual values.

---

## Prompt 1 — Initial Triage
\`\`\`
What caused the spike in error rate for [service] starting at [time]?
Show me correlated signals across metrics, logs, and traces.
Was there a recent deployment, config change, or infrastructure event?
\`\`\`

## Prompt 2 — Error Deep Dive
\`\`\`
Break down the top error types for [service] in the last [30 minutes / 1 hour].
For the most common error, show me example traces and identify which code path
or dependency is responsible.
\`\`\`

## Prompt 3 — Deployment Causation
\`\`\`
Did the deployment of [service] at [time] cause the current degradation?
Compare error rate, P99 latency, and throughput in the 30 minutes before
and after the deploy. Show me what changed.
\`\`\`

## Prompt 4 — Dependency Tracing
\`\`\`
Is the degradation in [service] caused by an upstream or downstream dependency?
Show me the service map for [service] and identify which dependencies are
returning errors or slow responses.
\`\`\`

## Prompt 5 — Infrastructure Correlation
\`\`\`
Correlate the application errors in [service] with infrastructure metrics.
Is this related to CPU throttling, memory pressure, disk I/O, or network issues
on the underlying nodes or pods?
\`\`\`

## Prompt 6 — Database Root Cause
\`\`\`
Are the errors in [service] caused by database issues? Check for:
- Slow query spikes in the last [time window]
- Connection pool exhaustion
- Lock contention or deadlocks
- Replication lag on read replicas
\`\`\`

## Prompt 7 — Latency Decomposition
\`\`\`
Why is P99 latency for [service] / [endpoint] elevated right now?
Break down the latency by span — which operation within the request
is taking the longest? Is it serialization, DB queries, external API calls,
or application logic?
\`\`\`

## Prompt 8 — Traffic Pattern Analysis
\`\`\`
Is the error rate increase in [service] proportional to traffic (same error %),
or did errors increase while traffic stayed flat (regression)?
Show me the error rate as a percentage of requests, not absolute count.
\`\`\`

## Prompt 9 — Multi-Service Incident
\`\`\`
Multiple services appear degraded. Which service failed first, and how did
failures propagate? Show me error rate timelines for [service-a], [service-b],
and [service-c] in chronological order to map the cascade.
\`\`\`

## Prompt 10 — Silent Failure Detection
\`\`\`
[Service] is receiving less traffic than expected. Is this a silent failure
where requests are being dropped before reaching the service?
Check load balancer health, DNS, upstream caller error rates, and whether
any circuit breakers are open.
\`\`\`

---

## Usage Tips
- Always include a specific time window ("in the last 30 minutes") for faster, more accurate results
- If Bits returns too much data, add "focus on the top 3 causes" or "summarize in 5 bullet points"
- Chain prompts: use Prompt 1 first, then drill into the identified cause with the relevant specific prompt
- For intermittent issues, use "Show me the pattern over the last 24 hours" to find recurrence
`,
  },
  {
    id: 'prompts-post-incident-analysis',
    title: 'Post-Incident Analysis Prompts',
    description: 'Bits chat prompts optimized for post-incident reviews and blameless post-mortems. Helps generate timelines, impact summaries, contributing factor analysis, and action item suggestions.',
    contentType: 'Chat Prompts',
    monitorTypes: ['APM', 'Metric', 'Log'],
    useCases: ['Post-Incident'],
    verified: false,
    author: 'roberto.silva',
    authorType: 'community',
    companySize: 'mid-market',
    industry: 'SaaS',
    stars: 412,
    usageCount: 2140,
    createdAt: '2025-01-15',
    tags: ['post-mortem', 'post-incident', 'chat-prompts', 'timeline', 'blameless'],
    featured: false,
    trending: false,
    content: `# Post-Incident Analysis Prompts for Bits

Use these prompts after an incident is resolved to build your post-mortem document.
These work best when used within 4 hours of incident resolution while data is fresh.

---

## Prompt 1 — Incident Timeline Generation
\`\`\`
Generate a chronological timeline for the incident in [service] between
[start datetime] and [end datetime]. Include: when metrics first deviated,
when alerts fired, when the issue was detected by the team, and when it was resolved.
Use 5-minute granularity.
\`\`\`

## Prompt 2 — Impact Quantification
\`\`\`
Quantify the impact of the incident in [service] between [start] and [end]:
- Total requests affected (errors / total requests in window)
- Estimated percentage of users impacted
- Which geographic regions were affected
- Which specific endpoints or features were degraded
\`\`\`

## Prompt 3 — Root Cause Explanation
\`\`\`
Explain the root cause of the incident in [service] in plain language suitable
for a non-technical audience. Then provide a technical deep-dive suitable
for the engineering team. Keep each to 2–3 sentences.
\`\`\`

## Prompt 4 — Contributing Factors
\`\`\`
What contributing factors made this incident worse or harder to detect?
Consider: lack of monitoring, alerting gaps, runbook gaps,
toil in the response process, architectural weaknesses, or process failures.
\`\`\`

## Prompt 5 — Detection Gap Analysis
\`\`\`
How long did it take to detect this incident after it started?
What was the detection method (alert, customer report, engineer noticed)?
What monitoring or alerting could have reduced the time to detection?
\`\`\`

## Prompt 6 — Action Item Generation
\`\`\`
Based on this incident in [service], suggest 5 concrete action items to prevent
recurrence or reduce impact. For each, provide: the action, which team owns it,
and estimated effort (small/medium/large).
\`\`\`

## Prompt 7 — Similar Incident History
\`\`\`
Have there been similar incidents to what happened in [service] today
in the last 6 months? Show me incidents with matching error patterns or
root causes that we might be missing in our pattern analysis.
\`\`\`

## Prompt 8 — SLO Impact Report
\`\`\`
How did this incident impact our SLOs? Show me the error budget burn rate
for [service] during the incident window and the total error budget consumed.
At this rate, when would we exhaust our 30-day error budget?
\`\`\`
`,
  },
  {
    id: 'prompts-performance-deep-dive',
    title: 'Performance Deep-Dive Prompts',
    description: 'Bits prompts for systematic latency and throughput investigation. Covers P99 breakdown, database query analysis, cache efficiency, and identifying performance regressions introduced by code changes.',
    contentType: 'Chat Prompts',
    monitorTypes: ['APM', 'Metric'],
    useCases: ['Performance Monitoring', 'Incident Response'],
    verified: false,
    author: 'yuki.tanaka',
    authorType: 'community',
    companySize: 'startup',
    industry: 'Technology',
    stars: 356,
    usageCount: 1780,
    createdAt: '2024-12-22',
    tags: ['performance', 'latency', 'throughput', 'p99', 'chat-prompts', 'profiling'],
    featured: false,
    trending: false,
    content: `# Performance Deep-Dive Prompts for Bits

Use these when you need to understand WHY something is slow — not just that it is.

---

## Prompt 1 — Endpoint Latency Breakdown
\`\`\`
Break down the P99 latency for [endpoint] on [service] into its components.
Which span within the request is contributing most to latency?
Compare today's breakdown to the baseline from 7 days ago.
\`\`\`

## Prompt 2 — Latency Regression Finder
\`\`\`
When did the latency for [service] first start increasing?
Was it a gradual drift or a sudden step change?
Correlate the inflection point with any deployments, config changes,
or infrastructure events.
\`\`\`

## Prompt 3 — Database Query Performance
\`\`\`
Show me the slowest database queries executed by [service] in the last [time window].
For the top 3 slowest, show me: the query pattern, average duration,
call count, and whether duration has increased recently.
\`\`\`

## Prompt 4 — Cache Effectiveness
\`\`\`
How effective is the cache for [service]? Show me cache hit rate trends over
the last 24 hours. If hit rate has dropped, correlate with any events
(cache flush, restart, TTL changes, traffic pattern changes).
\`\`\`

## Prompt 5 — Throughput Capacity Analysis
\`\`\`
At what request rate does [service] start showing latency degradation?
Show me the correlation between RPS and P99 latency over the last week
to identify the throughput knee point.
\`\`\`

## Prompt 6 — P50 vs P99 Divergence
\`\`\`
Show me P50 and P99 latency for [service] on the same chart for the last 24 hours.
When P99 diverges from P50, what events or request patterns correlate with that divergence?
\`\`\`

## Prompt 7 — External API Latency
\`\`\`
How much of [service]'s total latency is attributable to external API calls?
Which third-party APIs or downstream services add the most latency?
Has any external API's latency changed in the last 48 hours?
\`\`\`

## Prompt 8 — GC / Runtime Overhead
\`\`\`
Is garbage collection contributing to latency spikes in [service]?
Show me GC pause times correlated with P99 latency spikes.
What's the current heap utilization and GC frequency?
\`\`\`
`,
  },
  {
    id: 'prompts-dependency-failure',
    title: 'Dependency Failure Prompts',
    description: 'Bits prompts for investigating upstream and downstream dependency failures. Identifies blast radius, distinguishes dependency-caused vs self-caused issues, and surfaces circuit breaker and timeout opportunities.',
    contentType: 'Chat Prompts',
    monitorTypes: ['APM', 'Metric'],
    useCases: ['Incident Response'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 445,
    usageCount: 2560,
    createdAt: '2024-11-10',
    tags: ['dependencies', 'upstream', 'downstream', 'circuit-breaker', 'chat-prompts'],
    featured: false,
    trending: false,
    content: `# Dependency Failure Investigation Prompts for Bits

When your service is degraded but you suspect it might be caused by
an upstream or downstream service, use these prompts to isolate quickly.

---

## Prompt 1 — Dependency Health Overview
\`\`\`
Show me the health of all services that [service] depends on right now.
Which dependencies are showing elevated error rates or latency?
Highlight any dependency that changed status in the last hour.
\`\`\`

## Prompt 2 — Upstream vs Self Isolation
\`\`\`
Is the current degradation in [service] caused by [service] itself
or by an upstream dependency?
Compare the error rate and latency of [service]'s own logic
versus errors returned by its dependencies.
\`\`\`

## Prompt 3 — Downstream Impact Assessment
\`\`\`
Which services depend on [service]?
Are they currently showing degradation that could be caused by [service]'s issues?
Show me the downstream impact propagation in the service map.
\`\`\`

## Prompt 4 — Third-Party API Failure
\`\`\`
Is [service] making calls to any external / third-party APIs that are currently failing?
Show me error rates and latencies for outbound HTTP calls to external hosts.
Compare current performance to the 7-day baseline.
\`\`\`

## Prompt 5 — Timeout Pattern Analysis
\`\`\`
Are [service]'s dependency failures showing as timeouts or as explicit errors?
If timeouts, which dependency is timing out and what's the configured timeout value?
Is the timeout value appropriate given the dependency's normal response time?
\`\`\`

## Prompt 6 — Retry Storm Detection
\`\`\`
Is [service] in a retry storm against [dependency]?
Show me the call rate from [service] to [dependency] —
is it significantly higher than normal? Are retries amplifying the dependency's issues?
\`\`\`

## Prompt 7 — Graceful Degradation Check
\`\`\`
When [dependency] is unavailable, how does [service] behave?
Is it serving fallback responses, failing fast with circuit breaker,
or propagating errors to users? What's the expected behavior per the service's bits.md?
\`\`\`

## Prompt 8 — Cascading Failure Origin
\`\`\`
Multiple services are degraded. Trace the origin: which service started failing first,
and show me how failures spread through the dependency graph.
Identify the single root cause service to focus remediation efforts.
\`\`\`
`,
  },

  // ─────────────────────────────────────────
  // Setup Guides (19–20)
  // ─────────────────────────────────────────
  {
    id: 'guide-first-30-minutes',
    title: 'First 30 Minutes with Bits',
    description: 'Step-by-step onboarding guide for new Bits users. Walks through connecting your first service, writing your first bits.md, running your first investigation, and getting the most value in the first session.',
    contentType: 'Setup Guide',
    monitorTypes: [],
    useCases: ['Onboarding'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'startup',
    industry: 'Technology',
    stars: 923,
    usageCount: 8410,
    createdAt: '2024-05-01',
    tags: ['onboarding', 'getting-started', 'setup', 'first-steps', 'bits-md', 'guide'],
    featured: true,
    trending: false,
    content: `# First 30 Minutes with Bits — Getting Started Guide

Welcome to Bits, Datadog's AI SRE. This guide gets you from zero to your first real
investigation in 30 minutes.

---

## Minute 0–5: Connect Bits to Your Service

### Step 1: Navigate to Bits
1. Log in to Datadog → Click **Bits** in the left navigation (or go to app.datadoghq.com/bits)
2. You'll see the Bits chat interface

### Step 2: Start with a Simple Question
Before configuring anything, try asking Bits about a real service:

\`\`\`
What is the current error rate for [your-service-name]?
\`\`\`

If Bits can answer this, your APM/metrics data is connected.

**Can't find your service?** Check that:
- Datadog APM is instrumented on the service
- The \`service\` tag is set in your traces/metrics
- The service has received traffic in the last hour

---

## Minute 5–15: Write Your First bits.md

The bits.md file is how you give Bits context about your service.
Think of it as briefing a new engineer who's about to be on call.

### Step 1: Create bits.md in Your Repo
\`\`\`bash
touch bits.md
\`\`\`

### Step 2: Use This Minimal Template to Start
\`\`\`markdown
# bits.md — [Your Service Name]

## What This Service Does
[1-2 sentences: what does this service do and who uses it?]

## Key Metrics to Watch
- Primary error signal: [metric name or APM service name]
- Primary latency signal: [metric name]
- Traffic signal: [requests per second metric]

## Normal Behavior
- Typical RPS: [X] req/s
- Expected P99 latency: < [X]ms
- Normal error rate: < [X]%

## Known Issues / False Positives
[List anything that looks alarming but is expected, e.g., "Error spike at 02:00 UTC is a cron job"]

## On-call Contact
- Slack: #[your-team-channel]
- PagerDuty: [service-name]
- Runbook: [URL]
\`\`\`

### Step 3: Connect bits.md to Datadog
1. In Bits, click **"Connect a service"**
2. Paste your bits.md content OR connect your GitHub repo
3. Select which Datadog service this bits.md belongs to

---

## Minute 15–20: Run Your First Investigation

Now ask Bits something real about your service:

\`\`\`
Show me the health summary for [your-service]. What is the current error rate,
P99 latency, and throughput? Are there any anomalies in the last hour?
\`\`\`

Bits will pull together your metrics, traces, and logs into a unified view.

**Power tip:** Click any metric Bits mentions to see the full Datadog graph.

---

## Minute 20–25: Set Up Your First Alert Integration

For Bits to proactively help during incidents, connect your monitors:

1. Go to any existing monitor that fires for your service
2. Add to the monitor message:
\`\`\`
Ask Bits: "What is causing the alert for {{service.name}}?
Show me correlated signals since {{last_triggered_at}}."
\`\`\`
3. Now when the monitor fires, the on-call engineer has an instant Bits prompt ready

---

## Minute 25–30: Explore These Starter Prompts

Try each of these to understand what Bits can do:

\`\`\`
1. "Show me the top 3 services with the highest error rates right now"

2. "Did anything change in the last 2 hours for [service]?"

3. "What was the root cause of the last incident for [service]?"

4. "Generate a health report for my team's services"
\`\`\`

---

## What to Do Next

**Day 1:** Expand your bits.md with dependency graph and runbook links
**Day 2:** Add known failure modes and investigation hints
**Week 1:** Configure Bits to get notified in your Slack channel
**Week 2:** Run your first proactive review ("How are our SLOs looking this week?")

**Resources:**
- bits.md Reference Guide: [Bits Community → Setup Guides]
- Monitor Template for Bits Integration: [Bits Community → Monitor Templates]
- Team Setup Guide: [Optimizing Service Dependencies for Bits]
`,
  },
  {
    id: 'guide-service-dependencies',
    title: 'Optimizing Service Dependencies for Bits',
    description: 'Guide for documenting your service graph in a way Bits can understand and use. Covers dependency notation, SLO documentation, failure mode inventory, and team contact structure in bits.md.',
    contentType: 'Setup Guide',
    monitorTypes: [],
    useCases: ['Onboarding', 'On-call Setup'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'enterprise',
    industry: 'Technology',
    stars: 567,
    usageCount: 3210,
    createdAt: '2024-07-10',
    tags: ['service-graph', 'dependencies', 'bits-md', 'slo', 'setup', 'documentation'],
    featured: false,
    trending: false,
    content: `# Optimizing Service Dependencies for Bits

One of the highest-value things you can do to improve Bits investigations is
to accurately document your service dependencies. This guide explains how.

---

## Why Dependencies Matter for Bits

When Bits investigates an incident, it needs to know:
1. Which services could be causing this service's errors (upstreams)
2. Which services this service could be impacting (downstreams)
3. What the expected behavior is when a dependency fails

Without this context, Bits may focus on the wrong service or miss the root cause entirely.

---

## Section 1: The Dependency Block in bits.md

Add a \`## Dependencies\` section to your bits.md using this format:

\`\`\`markdown
## Dependencies

### Upstream Services (we call them)
| Service | Type | Criticality | Failure Behavior |
|---------|------|-------------|-----------------|
| auth-service | Internal gRPC | Critical | Return 401, do not retry |
| pricing-api | Internal HTTP | High | Use cached price (5-min TTL) |
| stripe-api | External HTTPS | High | Queue for retry, show pending state |
| s3-assets | External AWS | Medium | Serve from CDN cache |

### Downstream Consumers (they call us)
| Service | Type | Their SLA | Impact if We're Down |
|---------|------|-----------|---------------------|
| api-gateway | Internal HTTP | 99.9% | User-facing errors on all routes |
| analytics-pipeline | Kafka consumer | best-effort | Delayed analytics (acceptable) |
| mobile-app | REST | 99.5% | App degraded, no checkout |
\`\`\`

---

## Section 2: Documenting SLOs in bits.md

Bits uses SLO information to calibrate alert severity and prioritize investigations.

\`\`\`markdown
## SLOs

### Availability SLO
- **Target:** 99.9% over 30 days
- **Error budget:** 43.8 minutes/month
- **Datadog SLO ID:** slo-abc123 *(find in Datadog → SLOs)*
- **Burn rate alert:** 2x burn rate (fast-burn) → page on-call

### Latency SLO
- **Target:** P99 < 300ms for 99.5% of requests (7-day rolling)
- **Measurement:** trace.express.request.duration{service:my-service}
- **Datadog SLO ID:** slo-def456

### Business SLO (if applicable)
- **Target:** Checkout success rate > 99.8%
- **Measurement:** custom.checkout.success_rate
- **Revenue impact:** ~$500/min if checkout fails
\`\`\`

---

## Section 3: Failure Mode Inventory

This is the section that most dramatically improves Bits' investigation quality.
Document failure modes that Bits should know about:

\`\`\`markdown
## Known Failure Modes

### Failure: auth-service latency spike
- **Symptom:** Our P99 jumps from 150ms to 800ms, error rate stays low
- **Cause:** auth-service is slow, not failing
- **Detection:** Check auth_service_latency_p99 metric (should be < 50ms normally)
- **Resolution:** auth-service is self-healing, wait 10 min. If > 15 min, page auth team.

### Failure: pricing cache miss storm
- **Symptom:** Sudden CPU spike + latency increase, no errors
- **Cause:** Cache TTL expiry during high traffic (pricing API calls surge)
- **Detection:** custom.pricing.cache_miss_rate > 0.5
- **Resolution:** Warm cache manually: POST /internal/warm-cache (requires prod access)

### Failure: high-traffic event (planned)
- **Symptom:** RPS 5–10x normal, latency increases proportionally
- **Cause:** Marketing email/event (usually has 24hr notice)
- **Detection:** Check #marketing-events Slack channel
- **NOT an incident:** Scale up pods using runbook, monitor SLOs
\`\`\`

---

## Section 4: Team & Escalation Structure

\`\`\`markdown
## Team & Escalation

### Primary On-call
- **Rotation:** Weekly, see PagerDuty schedule "platform-oncall"
- **Escalation SLA:** Acknowledge P1 within 5 min, P2 within 15 min
- **Slack:** #platform-oncall-private (paged), #platform-incidents (public)

### Secondary Escalation
| Scenario | Contact | SLA |
|----------|---------|-----|
| Database issues | db-admin-oncall@company.com | 15 min |
| Payment failures | payments-oncall@company.com | 5 min |
| Infrastructure/K8s | platform-sre@company.com | 10 min |
| Business escalation | eng-manager@company.com | 30 min |

### External Dependencies Escalation
- Stripe: status.stripe.com + support.stripe.com (Priority support: P12345)
- AWS: AWS Support (Ticket: Business/Enterprise tier)
\`\`\`

---

## Validation Checklist

Before considering your bits.md complete, verify:
- [ ] All upstream dependencies listed with criticality and failure behavior
- [ ] All downstream consumers listed with their expected SLA
- [ ] SLOs defined with Datadog SLO IDs
- [ ] At least 3 known failure modes documented
- [ ] Escalation contacts current and complete
- [ ] Tested: Ask Bits "What are the dependencies of [service]?" — does it answer correctly?
`,
  },

  // ─────────────────────────────────────────
  // Tips & Best Practices (21–22)
  // ─────────────────────────────────────────
  {
    id: 'tips-bitsmd-sections',
    title: '5 bits.md Sections That Unlock Better Investigations',
    description: 'Practical guide to the 5 most impactful sections to add to your bits.md. Each section is explained with a before/after example showing how it changes the quality of Bits investigations.',
    contentType: 'Tips & Best Practices',
    monitorTypes: [],
    useCases: ['Onboarding', 'On-call Setup'],
    verified: true,
    author: 'Datadog',
    authorType: 'datadog',
    companySize: 'mid-market',
    industry: 'Technology',
    stars: 754,
    usageCount: 5640,
    createdAt: '2024-08-05',
    tags: ['bits-md', 'best-practices', 'tips', 'investigation', 'onboarding'],
    featured: false,
    trending: true,
    content: `# 5 bits.md Sections That Unlock Better Investigations

Most teams write bits.md that describes what their service does.
The best bits.md files tell Bits how to THINK about their service. Here's the difference.

---

## Section 1: Known False Positives

**Why it matters:** Without this, Bits will investigate non-issues during your incident response.

**Before (missing):**
Bits gets paged at 02:00 UTC for a CPU spike and starts a full investigation.
The engineer has to tell Bits: "Oh, that's just the nightly job."

**After (with this section):**
\`\`\`markdown
## Known False Positives / Expected Anomalies

| Time | Signal | Reason | Action |
|------|--------|--------|--------|
| 02:00–04:00 UTC daily | CPU spike 3x normal | Nightly aggregation job | Do not alert, this is expected |
| Mon 06:00 UTC | Memory usage high | Weekly cache rebuild | Expected, resolves by 07:00 |
| Any time | Error rate spike for /health | Load balancer health checks count as 400s in our setup | Exclude /health from error rate monitors |
| Black Friday (Nov) | RPS 10x normal | Peak season event | Scale up proactively per peak-readiness runbook |
\`\`\`

---

## Section 2: Metric Aliases & What They Actually Mean

**Why it matters:** Your metrics often have internal names that don't obviously map to concepts. Bits needs to know which metric means what.

\`\`\`markdown
## Metric Reference

| What you want to know | Metric to use | Normal range |
|----------------------|--------------|-------------|
| Is the service healthy? | \`trace.express.request.errors\` rate | < 0.1% |
| Is it slow? | \`p99:trace.express.request.duration{service:my-service}\` | < 200ms |
| Is DB overwhelmed? | \`custom.db.pool.waiting_queue_depth\` | < 5 |
| Are we processing all events? | \`custom.queue.lag.seconds\` | < 30s |
| Is cache working? | \`custom.redis.hit_ratio\` | > 0.95 (95%) |

Note: We do NOT use \`system.cpu.user\` as a health signal — CPU usage is variable
and not correlated with user-facing health for this service.
\`\`\`

---

## Section 3: The "First 3 Things to Check" List

**Why it matters:** Experienced SREs develop intuition for where to look. Give that intuition to Bits.

\`\`\`markdown
## When Something Goes Wrong: First 3 Things to Check

### If error rate spikes:
1. Check \`trace.express.request.errors\` by \`http.route\` — is it one endpoint or all?
2. Check for recent deploy (ArgoCD → app → last sync time)
3. Check auth-service health — 80% of our error spikes originate there

### If P99 latency spikes:
1. Check \`db.query.duration.p99\` — almost always the DB
2. Check Redis hit ratio — cache miss storm is second most common
3. If DB and cache are fine, check if a specific endpoint's latency changed

### If throughput drops unexpectedly:
1. Check ALB health checks — are we passing?
2. Check for circuit breaker open state in service logs
3. Check if upstream caller (api-gateway) is also seeing reduced traffic
\`\`\`

---

## Section 4: Business Context Mapping

**Why it matters:** Bits can help prioritize by understanding revenue/user impact.

\`\`\`markdown
## Business Impact Mapping

| Service Component | User Impact | Revenue Impact |
|------------------|-------------|---------------|
| Checkout endpoint (/api/checkout) | Users cannot purchase | ~$2,000/min |
| Search (/api/search) | Degraded discovery, can still checkout | ~$500/min |
| Recommendations | No recommendations shown | ~$100/min |
| User profile (/api/me) | Cannot view account | No direct revenue impact |
| Admin dashboard | Internal users only | $0 user impact |

**SLO priority:** Always fix checkout first, then search, then the rest.
\`\`\`

---

## Section 5: Escalation Decision Tree

**Why it matters:** Bits can help determine when to escalate and to whom.

\`\`\`markdown
## When to Escalate (Decision Tree)

### Escalate to DB Team if:
- DB query P99 > 1 second for > 5 minutes AND you can't identify the slow query
- Replication lag > 2 minutes
- Connection pool at 100% and pod restarts haven't helped

### Escalate to Platform/SRE if:
- Pod keeps crashing after 3 rollout attempts
- Node-level CPU/memory issues (not pod-level)
- Network connectivity issues between services

### Page the On-call Manager if:
- Error rate > 10% for > 10 minutes (P1 incident)
- Checkout is completely down
- Data breach or security incident suspected (always)

### Do NOT Escalate For:
- Nightly job CPU spike (expected)
- Individual pod restart (auto-heals)
- Single slow query that resolves itself in < 2 minutes
\`\`\`
`,
  },
  {
    id: 'tips-monitor-messages-bits',
    title: 'Writing Monitor Messages Bits Can Parse',
    description: 'Best practices for structuring Datadog monitor messages so Bits can extract context, suggest investigation paths, and provide better incident response. Includes good/bad examples and a copy-paste template.',
    contentType: 'Tips & Best Practices',
    monitorTypes: ['APM', 'Metric', 'Log', 'Infrastructure', 'Synthetics'],
    useCases: ['On-call Setup', 'Incident Response'],
    verified: false,
    author: 'nathan.brooks',
    authorType: 'community',
    companySize: 'mid-market',
    industry: 'SaaS',
    stars: 487,
    usageCount: 3120,
    createdAt: '2025-01-28',
    tags: ['monitor', 'message', 'best-practices', 'tips', 'template-vars', 'bits'],
    featured: true,
    trending: false,
    content: `# Writing Monitor Messages Bits Can Parse

The way you write your Datadog monitor messages directly impacts how well Bits
can help during incidents. Here's how to write messages that maximize Bits' usefulness.

---

## Principle 1: Always Include a Bits Chat Starter Prompt

The most impactful single change: add a suggested Bits prompt directly in your monitor message.

**❌ Bad — No Bits context:**
\`\`\`
Alert: High error rate on api-service.
Current value: {{value}}%
\`\`\`

**✅ Good — With Bits prompt:**
\`\`\`
🚨 High Error Rate — {{service.name}}
Current error rate: {{value}}%
Threshold: {{threshold}}%

### Ask Bits First
> "What is causing the high error rate for {{service.name}}?
> Show me correlated signals and any recent changes since the alert fired at {{last_triggered_at}}."
\`\`\`

---

## Principle 2: Use Datadog Template Variables Generously

Template variables make your message dynamic and Bits-readable. Use them everywhere.

**Most Useful Template Variables:**
\`\`\`
{{value}}              → The current metric value that triggered the alert
{{threshold}}          → The configured alert threshold
{{service.name}}       → The service tag (APM monitors)
{{env.name}}           → The environment
{{last_triggered_at}}  → Exact time the alert fired (for Bits time correlation)
{{hostname}}           → The host where the issue occurred
{{kube_namespace.name}} → Kubernetes namespace
{{kube_deployment.name}} → Kubernetes deployment
{{alert_title}}        → The monitor name
\`\`\`

---

## Principle 3: Structure with Headers and Sections

Bits parses structured text better than paragraphs. Use markdown headers.

**Template Structure (copy this):**
\`\`\`markdown
## 🚨 [ALERT TYPE] — {{service.name}}

**What happened:** [One sentence describing the condition]
**Current value:** {{value}} | **Threshold:** {{threshold}}
**Service:** {{service.name}} | **Env:** {{env.name}} | **Since:** {{last_triggered_at}}

### Likely Causes (in order of probability)
1. [Most common cause for this alert]
2. [Second most common cause]
3. [Third most common cause]

### Ask Bits
> "[Specific investigation prompt tailored to this alert type]"

### Quick Triage
- [ ] Check recent deployments
- [ ] Check [specific metric for this alert]
- [ ] Check [specific log query for this alert]

### Runbook
[Link to runbook]

[Routing: @pagerduty-[team]-oncall if critical]
\`\`\`

---

## Principle 4: Include Context-Specific Investigation Hints

Generic alerts waste time. Add specific context for your service.

**❌ Generic:**
\`\`\`
High CPU detected on {{hostname}}.
Check the server and investigate.
\`\`\`

**✅ Service-specific:**
\`\`\`
High CPU on {{hostname}} — [service] Pod

**If this is between 02:00–04:00 UTC:** This is the nightly aggregation job.
Do NOT page — monitor but expected to resolve by 04:30 UTC.

**If this is at any other time:**
1. Check for request rate spike: is traffic higher than normal?
2. Check if a background job is running unexpectedly
3. Check for infinite loop in recent code deploy

Ask Bits: "Is the CPU spike on {{hostname}} correlated with a traffic increase
or is it a CPU regression? Compare with the same time yesterday."
\`\`\`

---

## Principle 5: Distinguish P1 from P2 in the Message

Help Bits and on-call engineers calibrate urgency instantly.

\`\`\`markdown
{{#is_alert}}
## 🔴 CRITICAL — Immediate Response Required
Error rate is at {{value}}% — this is a P1 incident.
**Revenue impact:** ~$2,000/min. Wake up the on-call engineer.
@pagerduty-platform-oncall
{{/is_alert}}

{{#is_warning}}
## 🟡 WARNING — Investigation Needed (Not Urgent)
Error rate is at {{value}}% — elevated but not yet critical.
Investigate within 30 minutes. No need to page if it's within business hours.
@slack-platform-alerts
{{/is_warning}}
\`\`\`

---

## Quick Reference: Before and After

| Before | After |
|--------|-------|
| No Bits prompt | Always include suggested Bits investigation prompt |
| Static text only | Use template variables for dynamic context |
| Wall of text | Use headers + structured sections |
| Generic advice | Service-specific investigation steps |
| Single severity message | Separate content for alert vs warning state |
| No runbook link | Always link to runbook |
`,
  },
]

// ─── Derived helpers ───────────────────────────────────────────────
export const contentTypes = [
  'bits.md',
  'Monitor Template',
  'Runbook',
  'Chat Prompts',
  'Setup Guide',
  'Tips & Best Practices',
]

export const monitorTypes = [
  'APM',
  'Metric',
  'Log',
  'Anomaly',
  'Synthetics',
  'Infrastructure',
]

export const useCases = [
  'Incident Response',
  'On-call Setup',
  'Performance Monitoring',
  'Post-Incident',
  'Onboarding',
]

export const contentTypeIcons = {
  'bits.md': '📄',
  'Monitor Template': '🔔',
  'Runbook': '📋',
  'Chat Prompts': '💬',
  'Setup Guide': '🚀',
  'Tips & Best Practices': '💡',
}

export const contentTypeDescriptions = {
  'bits.md': 'Service context files for Bits AI investigations',
  'Monitor Template': 'Ready-to-use Datadog monitor configurations',
  'Runbook': 'Step-by-step incident response procedures',
  'Chat Prompts': 'Curated prompts for Bits AI chat',
  'Setup Guide': 'Guides for configuring Bits effectively',
  'Tips & Best Practices': 'Expert tips for getting more from Bits',
}
