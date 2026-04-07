/**
 * Curated investigation examples for the Library section.
 * Each entry showcases a real-world scenario where Bits AI SRE
 * investigated a complex problem triggered by a monitor alert.
 *
 * Structure per writeup:
 *   The Problem — what happened and why it's hard for SREs
 *   What Bits Did — the autonomous investigation steps
 *   What Bits Delivered — specific findings, evidence, root cause
 *   The Value — time saved, blast radius clarity, what would have happened without Bits
 */

export const investigationCategories = [
  'Deployment Failure',
  'Error Rate Spike',
  'Latency Degradation',
  'Infrastructure',
  'Database',
  'Resource Exhaustion',
]

export const categoryColors = {
  'Deployment Failure':      { bg: 'bg-yellow-500/12', text: 'text-yellow-400', border: 'border-yellow-500/25' },
  'Error Rate Spike':        { bg: 'bg-red-500/12',    text: 'text-red-400',    border: 'border-red-500/25' },
  'Latency Degradation':     { bg: 'bg-orange-500/12', text: 'text-orange-400', border: 'border-orange-500/25' },
  'Infrastructure':          { bg: 'bg-blue-500/12',   text: 'text-blue-400',   border: 'border-blue-500/25' },
  'Database':                { bg: 'bg-emerald-500/12',text: 'text-emerald-400',border: 'border-emerald-500/25' },
  'Resource Exhaustion':     { bg: 'bg-purple-500/12', text: 'text-purple-400', border: 'border-purple-500/25' },
}

export const categoryIcons = {
  'Deployment Failure':      '🚀',
  'Error Rate Spike':        '🚨',
  'Latency Degradation':     '📉',
  'Infrastructure':          '🏗️',
  'Database':                '🗄️',
  'Resource Exhaustion':     '🔥',
}

export const investigations = [
  {
    id: 'inv-001',
    title: 'Checkout Errors Spike 200x After a Clean Deploy',
    summary: 'A deploy introduced a subtle array bounds bug that only crashed when a specific feature flag was enabled. Bits traced 70,809 RUM errors to the exact line of code, the deploy that introduced it, and the feature flag that activated it — before the on-call had finished reading the alert.',
    category: 'Deployment Failure',
    services: ['shopist-web-ui', 'shopist-cart-service'],
    timeToResolution: '7 min',
    monitorType: 'RUM',
    tags: ['javascript', 'feature-flag', 'off-by-one', 'rum', 'cart-abandonment'],
    featured: true,
    writeup: `## The Problem

A RUM error rate monitor fires: error count on the cart page has spiked 200x. The on-call sees thousands of \`TypeError\` events but the stack traces point to minified production code. There's no obvious recent deploy — the last one was 8 hours ago and seemed fine. The errors only affect some users, not all, making it unclear whether this is a code bug, a browser compatibility issue, or a third-party script failure.

### Why This Is Hard

Feature-flag-gated bugs are some of the hardest to triage manually. The deploy "passed" — health checks were green, error rates didn't spike at deploy time because the flag wasn't enabled yet. When the flag was later ramped, the errors appear disconnected from any deployment event. An SRE would need to: check RUM error groupings, identify which users are affected, cross-reference feature flag state, find the relevant deploy, read the diff, and locate the bug — all while the incident is ongoing. This typically takes 30-60 minutes.

## What Bits Did

Bits was triggered by the RUM error rate monitor and autonomously:

1. **Grouped the RUM errors** by error message and identified the dominant error: \`TypeError: can't access property "id", s is undefined\` — accounting for 94% of all errors in the window
2. **Correlated with feature flags** by analyzing RUM session attributes, finding that 100% of affected sessions had \`new-checkout-flow: true\`
3. **Traced to the deployment** by matching the feature flag to the code path introduced in \`shopist-web-ui\` version \`6.4.7-rc\` (deployed 8 hours prior at 08:00 UTC, commit \`95c127f\`)
4. **Identified the exact bug** by inspecting the source: \`cart.vue\` line 564 uses \`i <= items.length\` instead of \`i < items.length\` in \`reconcileCartPricing()\`, causing an array-out-of-bounds access on every cart page load for flagged users
5. **Mapped the full blast radius** including secondary errors from the same flag path in \`placeOrder()\` that injected synthetic checkout failures for specific email domains

## What Bits Delivered

### Root Cause

Off-by-one bug at \`cart.vue:564\` — \`i <= items.length\` should be \`i < items.length\`. Activated by the \`new-checkout-flow\` feature flag, introduced in commit \`95c127f\`.

### Evidence

- **70,809** errors in the alert window, **53,401** RUM error events captured
- 100% of errors correlated with \`new-checkout-flow: true\` flag state
- Deploy \`6.4.7-rc\` at 08:00 UTC confirmed via change tracking
- Secondary error injection in \`placeOrder()\` lines 328-336 compounding the cart abandonment

### Impact Assessment

454 failed checkout attempts in a 15-minute window. Cart abandonment rate spiked above anomaly bounds, concentrated in the United States region. Customer impact lasted approximately 21 minutes.

## The Value

**Without Bits**, the on-call would have started by investigating the RUM errors in isolation — trying to reproduce the TypeError, checking browser versions, reviewing the minified stack trace. The connection to the feature flag (enabled hours after deploy) would not have been obvious. The deploy itself appeared clean. Reaching the root cause manually would have required correlating RUM data → feature flag state → deploy timeline → source code, a process that typically takes 30-60 minutes.

**Bits delivered the root cause, the exact line of code, and the full blast radius in 7 minutes** — before the on-call engineer had finished triaging the initial alert. The team disabled the feature flag and the errors stopped immediately.`,
  },
  {
    id: 'inv-002',
    title: '40% Auth 5xx Spike Traced Past Redis to Sidecar OOMKills',
    summary: 'A 40% spike in 5xx errors on the auth-service looked like a Redis connectivity issue. Bits traced it through APM spans to Envoy sidecar OOMKill events caused by a logging config change deployed 6 hours earlier — a connection no human would make quickly under pressure.',
    category: 'Resource Exhaustion',
    services: ['auth-service', 'redis-session-store', 'envoy-sidecar'],
    timeToResolution: '6 min',
    monitorType: 'APM',
    tags: ['redis', 'envoy', 'oomkill', 'connection-pool', 'kubernetes'],
    featured: true,
    writeup: `## The Problem

The auth-service error rate monitor fires: 5xx responses have jumped to 40%. The errors are intermittent — they spike for 8-12 seconds, recover, then spike again. APM traces show \`ECONNREFUSED\` on Redis commands. The Redis cluster itself looks healthy: no elevated latency, no connection limit issues, no memory pressure.

### Why This Is Hard

Intermittent errors that self-recover are notoriously difficult to debug. The SRE's first instinct is to investigate Redis (the service returning errors), but Redis is fine. The actual root cause is a sidecar proxy crash that happens at the network layer, invisible in application-level Redis metrics. The config change that caused it was deployed 6 hours ago to a completely different component (the Envoy proxy, not the application), and it didn't cause immediate issues — the memory leak was gradual. Connecting a "Redis connection refused" error to an "Envoy access logging config change" requires correlating across Kubernetes events, container metrics, config diffs, and APM traces simultaneously.

## What Bits Did

Bits was triggered by the APM error rate monitor and autonomously:

1. **Analyzed failing APM traces** and identified that 100% of errors shared a common span: \`redis.command\` failing with \`ECONNREFUSED 127.0.0.1:6379\` — the connection was refused at the loopback address, indicating a local proxy issue, not a remote Redis issue
2. **Checked Kubernetes events** for the auth-service pods and found 47 \`OOMKilled\` events on the \`envoy-sidecar\` container across 12 pods during the alert window
3. **Correlated the OOMKill timing** with the error spikes — each 8-12 second error window aligned exactly with an Envoy restart cycle
4. **Traced the memory increase** to a config change deployed 6 hours earlier that enabled \`access_log_format: FULL\`, increasing per-connection memory from ~2KB to ~18KB
5. **Calculated the memory math**: 7,200 active connections × 18KB = ~126Mi, just under the 128Mi limit — any traffic burst pushed it over

## What Bits Delivered

### Root Cause

Envoy sidecar \`access_log_format: FULL\` config change increased per-connection memory 9x. With ~7,200 active connections, total memory reached the 128Mi container limit, triggering OOMKill restarts that dropped all Redis connections routed through the sidecar.

### Evidence

- **47 OOMKill events** across 12 pods in the alert window
- \`ECONNREFUSED\` at \`127.0.0.1:6379\` (loopback = sidecar, not Redis)
- Config change deployed 6 hours prior: \`access_log_format: FULL\`
- Memory math: 7,200 connections × 18KB = 126Mi (limit: 128Mi)
- Mean time between OOMKill and recovery: **9.4 seconds**

### Impact Assessment

12,847 failed authenticated requests (40% error rate) over 18 minutes. All authenticated API functionality was degraded during OOMKill windows.

## The Value

**Without Bits**, the investigation would have started and likely stalled at Redis. The Redis cluster was healthy by every standard metric — an SRE could spend 20-30 minutes investigating Redis before realizing it wasn't the problem. Even after pivoting to the network layer, connecting the dots from sidecar OOMKills to a logging config change deployed 6 hours ago requires a specific mental model that's hard to construct during an active incident.

**Bits skipped the Redis red herring entirely.** By analyzing the \`ECONNREFUSED\` address (loopback, not remote), it immediately pivoted to the sidecar, found the OOMKills, and traced back to the config change — delivering the full causal chain in 6 minutes.`,
  },
  {
    id: 'inv-003',
    title: 'Kafka Consumer at 100% Error Rate From Upstream Schema Change',
    summary: 'A deployment changed Kafka message field names from snake_case to camelCase without updating the consumer. Every order failed deserialization. Bits correlated the 100% consumer error rate to the exact deploy diff and the specific field name mismatch.',
    category: 'Deployment Failure',
    services: ['order-service', 'fulfillment-consumer', 'kafka-orders-topic'],
    timeToResolution: '8 min',
    monitorType: 'Log',
    tags: ['kafka', 'serialization', 'schema-mismatch', 'deployment'],
    featured: false,
    writeup: `## The Problem

A log anomaly monitor fires on the \`fulfillment-consumer\`: error rate has jumped from 0% to 100%. Every single message from the \`orders.confirmed\` Kafka topic is failing. The consumer logs show \`KeyError: 'order_id'\` — but the \`order_id\` field has existed in the schema for years.

### Why This Is Hard

The consumer hasn't been deployed recently — so the SRE's first instinct isn't to look at code changes. The error message (\`KeyError: 'order_id'\`) suggests the field is missing from the payload, which could indicate a producer bug, a schema registry issue, or data corruption. Investigating the producer side requires cross-team coordination. The actual cause — a field naming convention change in the producer — is subtle: the field exists, it's just called \`orderId\` now instead of \`order_id\`. Discovering this requires comparing the raw Kafka message payload with the consumer's deserialization code, which isn't a standard troubleshooting step during an incident.

## What Bits Did

Bits was triggered by the log anomaly monitor and autonomously:

1. **Identified the error pattern**: 100% of messages failing with \`KeyError: 'order_id'\` at \`deserialize_order()\` line 47 in \`handlers/order_handler.py\`
2. **Checked for recent deployments** across all services touching the \`orders.confirmed\` topic and found \`order-service\` v3.8.0 deployed at 14:22 UTC — the exact timestamp where the error rate stepped from 0% to 100%
3. **Inspected the deploy diff** (commit \`a91bc3e\`): a global find-and-replace across all serializer classes converting snake_case to camelCase. PR description: "Part 2 of 3: API naming conventions"
4. **Confirmed the mismatch**: post-deploy messages contain \`{"orderId": "..."}\` while the consumer reads \`payload['order_id']\`
5. **Assessed the blast radius**: 8,491 messages queued in consumer lag, growing at ~370 messages/minute, no data loss (messages still in Kafka retention)

## What Bits Delivered

### Root Cause

\`order-service\` v3.8.0 (commit \`a91bc3e\`) changed Kafka message serialization from snake_case to camelCase. The downstream \`fulfillment-consumer\` was not updated (it was "Part 3 of 3" in the migration plan, not yet deployed). Every message fails with \`KeyError: 'order_id'\` because the field is now \`orderId\`.

### Evidence

- Error rate step-function from 0% to 100% at exactly 14:22 UTC
- Deploy of \`order-service\` v3.8.0 confirmed at 14:22 UTC via change tracking
- Deploy diff shows global snake_case → camelCase rename across serializers
- Consumer code at \`order_handler.py:47\` accesses \`payload['order_id']\` (snake_case)
- 8,491 messages in consumer lag, no data loss

### Impact Assessment

All order fulfillment processing stopped for 23 minutes. 8,491 orders breached the 5-minute fulfillment SLA. No permanent data loss — messages were reprocessed after the consumer was patched.

## The Value

**Without Bits**, the SRE would have started investigating the consumer (which hadn't changed) and potentially the Kafka cluster itself. The \`KeyError\` suggests a missing field, not a renamed field — it's not obvious from the error alone that the field exists under a different name. Cross-referencing the producer's deployment, reading the diff, and understanding the naming convention migration typically takes 20-40 minutes, especially when the producer and consumer are owned by different teams.

**Bits connected the consumer error to the producer deployment in minutes**, surfacing the exact diff, the field name mismatch, and the blast radius. The team was able to roll back the producer or hot-patch the consumer with full confidence in what had changed.`,
  },
  {
    id: 'inv-004',
    title: 'Intermittent 503s From Pod Evictions on Undersized Nodes',
    summary: 'Intermittent 503s that auto-resolved every few minutes were dismissed as flapping. Bits correlated the error pattern with Kubernetes eviction events and traced them to a DaemonSet version bump that doubled memory usage — but only on specific node instance types.',
    category: 'Infrastructure',
    services: ['k8s-cluster-prod', 'datadog-agent-daemonset', 'api-gateway'],
    timeToResolution: '6 min',
    monitorType: 'Metric',
    tags: ['kubernetes', 'pod-eviction', 'daemonset', 'memory-pressure'],
    featured: true,
    writeup: `## The Problem

The API gateway error rate monitor fires and auto-resolves repeatedly: 503 errors spike for 10-15 seconds, then return to zero, then spike again. The pattern has been going on for hours, generating 23 alert notifications. The on-call has checked the API gateway pods — they look healthy. Load balancer metrics are normal. No recent deploys to the gateway itself.

### Why This Is Hard

Intermittent issues that auto-resolve are often dismissed as "transient" or "network blips." The 503s only last 10-15 seconds at a time, making them nearly impossible to catch in real-time debugging. The actual cause — Kubernetes pod evictions from node memory pressure — doesn't show up in application-level metrics. The memory pressure itself comes from a DaemonSet updated 3 days ago, far outside the typical "what changed recently?" investigation window. And it only affects 3 of 17 nodes (the undersized ones), making the pattern inconsistent and harder to reproduce.

## What Bits Did

Bits was triggered by the metric monitor and autonomously:

1. **Identified the intermittent pattern**: 503 errors correlating with specific 8-15 second windows, repeating every 5-10 minutes
2. **Checked Kubernetes events** and found 23 pod eviction events on the same 3 nodes: \`ip-10-0-4-17\`, \`ip-10-0-4-23\`, \`ip-10-0-4-31\` — each eviction window aligned exactly with a 503 spike
3. **Analyzed node characteristics**: all 3 nodes are \`m5.large\` (8 GiB RAM). The remaining 14 nodes are \`m5.xlarge\` (16 GiB) and show zero evictions
4. **Calculated the memory breakdown** on affected nodes: the \`datadog-agent\` DaemonSet was consuming 1,780Mi per pod (up from 890Mi before the v7.54 update 3 days ago), leaving only 4,370Mi allocatable for apps — below the 4,480Mi of pod resource requests
5. **Found the root cause**: the v7.54 changelog enabled an in-memory metrics aggregation buffer by default (\`DD_AGENT_METRICS_BUFFER_ENABLED=true\`), doubling per-pod memory

## What Bits Delivered

### Root Cause

\`datadog-agent\` DaemonSet v7.54 update (3 days prior) enabled \`DD_AGENT_METRICS_BUFFER_ENABLED=true\` by default, doubling memory from 890Mi to 1,780Mi. On \`m5.large\` nodes (8 GiB), this pushed total resource requests above allocatable memory, triggering kubelet eviction of application pods.

### Evidence

- 23 eviction events across 3 nodes (all \`m5.large\`)
- Zero evictions on the 14 \`m5.xlarge\` nodes
- DaemonSet memory: 1,780Mi (v7.54) vs 890Mi (v7.52)
- Node memory math: 4,370Mi allocatable vs 4,480Mi requested = eviction
- Each eviction → reschedule cycle: 8-15 seconds, matching 503 windows exactly

### Impact Assessment

1,847 requests returned 503 errors over 45 minutes across 23 eviction cycles, affecting an estimated 340 unique users. The repeated alert firing and auto-resolving generated significant on-call noise.

## The Value

**Without Bits**, this would likely have been an extended troubleshooting session. The 503s auto-resolved each time, so there was nothing to "catch" — by the time the SRE checks, everything looks fine. The API gateway pods are healthy. The DaemonSet change was 3 days old. The node-level memory math requires cross-referencing DaemonSet resource usage, node instance types, and kubelet eviction thresholds — a chain that's very hard to assemble manually during repeated 10-second error windows.

**Bits turned 23 flapping alerts into one clear diagnosis**: DaemonSet memory increase + undersized nodes = eviction loop. The team disabled the buffer flag on affected nodes and the evictions stopped immediately.`,
  },
  {
    id: 'inv-005',
    title: '50x Query Regression From a Silently Dropped Index',
    summary: 'A 50x latency regression appeared hours after a database migration that "succeeded." Bits traced the slow query to a missing index, then found the migration that dropped it — and the silent CREATE INDEX failure caused by a column name typo.',
    category: 'Database',
    services: ['user-service', 'postgres-primary', 'search-api'],
    timeToResolution: '4 min',
    monitorType: 'APM',
    tags: ['postgresql', 'slow-query', 'index', 'migration'],
    featured: false,
    writeup: `## The Problem

The search-api latency monitor fires: p95 has jumped from 120ms to 6.2 seconds. APM traces show the bottleneck is a single database query in the \`user-service\`. The query itself hasn't changed — it's been running for months. No recent code deployments to user-service. The database CPU and I/O metrics look normal.

### Why This Is Hard

When a query suddenly gets slow but the code hasn't changed, SREs typically investigate the database: lock contention, vacuum issues, connection exhaustion, hardware problems. The actual cause — a missing index dropped by a migration — is hidden behind two layers of indirection: (1) the migration "succeeded" according to the pipeline because the runner was configured with \`on_error: continue\`, and (2) the DROP INDEX was intentional (part of a rename), so reviewing the migration script doesn't immediately raise alarm unless you notice the subsequent CREATE INDEX failed. The migration ran hours ago, further separating cause from effect.

## What Bits Did

Bits was triggered by the APM latency monitor and autonomously:

1. **Isolated the slow span**: \`pg.query\` executing \`SELECT * FROM users WHERE organization_id = $1 AND status = $2\` on a 12.4M-row table — regression from 8ms to 4,100ms
2. **Compared query execution plans**: current plan shows \`Seq Scan\` (sequential scan of all 12.4M rows) vs. expected \`Index Scan\` using \`idx_users_org_status\`
3. **Searched for the missing index** and found that \`idx_users_org_status\` no longer exists in the database
4. **Traced the index removal** to migration \`20260208_rename_user_indexes\` executed at 15:12 UTC — the exact timestamp where the latency regression began
5. **Identified the silent failure**: the migration contained \`DROP INDEX idx_users_org_status\` (succeeded) followed by \`CREATE INDEX idx_users_org_id_status ON users (org_id, status)\` (failed — column is \`organization_id\`, not \`org_id\`). The migration runner logged the error but continued due to \`on_error: continue\`

## What Bits Delivered

### Root Cause

Migration \`20260208_rename_user_indexes\` dropped \`idx_users_org_status\` but failed to create its replacement due to a column name typo (\`org_id\` vs. \`organization_id\`). The migration runner's \`on_error: continue\` setting swallowed the failure. The query fell back to sequential scan on 12.4M rows.

### Evidence

- Query regression: 8ms → 4,100ms (512x) on \`SELECT ... WHERE organization_id = $1 AND status = $2\`
- \`EXPLAIN ANALYZE\` confirms: \`Seq Scan on users (cost=0.00..487231.00 rows=12400000)\`
- Missing index: \`idx_users_org_status\` no longer exists
- Migration log: \`ERROR: column "org_id" does not exist\` — \`1 of 2 statements succeeded (on_error: continue)\`
- 3 downstream services impacted: search-api, admin-dashboard, user-sync

### Impact Assessment

search-api effectively unusable for ~35 minutes with p95 at 6.2 seconds (SLO: 500ms). Approximately 4,200 search requests affected across 3 downstream services.

## The Value

**Without Bits**, the SRE would have investigated the database server first: CPU, I/O, connections, lock contention, recent vacuum activity. These would all look normal. Eventually, running \`EXPLAIN ANALYZE\` would reveal the sequential scan, but connecting "missing index" to "a migration that succeeded hours ago with a typo in the CREATE statement" requires checking migration logs, reading the SQL, and spotting that \`org_id\` ≠ \`organization_id\`.

**Bits delivered the full chain — slow query → missing index → failed migration → specific typo — in 4 minutes.** The fix was a one-line SQL command to create the correct index, and query times returned to baseline in seconds.`,
  },
  {
    id: 'inv-006',
    title: 'Three Services Down From CoreDNS CPU Throttling',
    summary: 'Three different services failed with three different error messages in the same 30-second window. Bits identified they were all one incident: CoreDNS CPU throttling from a batch job spike was causing DNS resolution timeouts that manifested differently in each service.',
    category: 'Infrastructure',
    services: ['coredns', 'auth-service', 'catalog-api', 'notification-service'],
    timeToResolution: '6 min',
    monitorType: 'Metric',
    tags: ['dns', 'coredns', 'kubernetes', 'cpu-throttle'],
    featured: false,
    writeup: `## The Problem

Three monitors fire within 30 seconds of each other:

- \`auth-service\`: \`ETIMEDOUT\` connecting to the identity provider
- \`catalog-api\`: \`502 Bad Gateway\` from the product database
- \`notification-service\`: \`ECONNREFUSED\` on the email relay

Three different services, three different error types, three different upstream dependencies. This looks like three separate incidents. Three on-call engineers get paged.

### Why This Is Hard

The natural response to simultaneous but apparently unrelated failures is to investigate each independently. Each team looks at their own service's upstream dependency and finds it healthy — the identity provider is fine, the product database is fine, the email relay is fine. The shared infrastructure layer causing the failure (DNS) is invisible in application-level diagnostics. DNS resolution happens in milliseconds normally, so it's never the first suspect. And the trigger — a batch job that increased DNS query volume 3x — is a completely unrelated workload that no team would think to check.

## What Bits Did

Bits was triggered by the metric monitors and autonomously:

1. **Correlated the timing**: all three services started failing within the same 30-second window — despite different error messages and different upstream dependencies, this simultaneity suggested a shared root cause
2. **Analyzed APM traces** across all three services and found that 100% of failing requests had the failure occur during the DNS resolution phase of the outbound connection
3. **Checked CoreDNS metrics**: CPU utilization at 200m/200m (100% of limit, throttled). DNS resolution p99 jumped from 2ms to 8,300ms. Bimodal latency: cache hits in <5ms, cache misses queuing behind throttled CPU
4. **Identified the trigger**: the \`data-enrichment-hourly\` batch job started at 10:00 UTC, generating ~15,000 DNS queries/second (3x the normal cluster baseline)
5. **Traced the underlying cause**: CoreDNS CPU limits were set 8 months ago at 200m for a much smaller cluster. The cluster had grown 3x since, but CoreDNS resources were never updated

## What Bits Delivered

### Root Cause

CoreDNS CPU limit of 200m (set 8 months ago) was insufficient for current cluster scale. A batch job generating 3x normal DNS query volume pushed CoreDNS to its limit, throttling all DNS resolution and causing connection timeouts in any service performing hostname lookups.

### Evidence

- Three services failing simultaneously with different error types — all at the DNS resolution phase
- CoreDNS CPU at 200m/200m (100% throttled)
- DNS p99: 8,300ms (baseline: 2ms)
- Batch job \`data-enrichment-hourly\` generating 15,000 queries/sec (3x normal)
- CoreDNS limits unchanged for 8 months despite 3x cluster growth

### Impact Assessment

4,291 failed requests across 3 services over ~12 minutes. Three separate teams paged for what was one incident.

## The Value

**Without Bits**, three teams would have investigated three incidents independently. Each team would have checked their own upstream dependency (healthy), checked their own service (healthy), and potentially escalated to the infrastructure team — a process that could easily take 30-45 minutes per team, with significant duplication.

**Bits identified that three incidents were actually one** by correlating the simultaneous timing and tracing all three failures to the DNS resolution layer. Instead of three parallel 30-minute investigations, the infrastructure team got a single, clear diagnosis in 6 minutes: increase CoreDNS resources and add DNS caching for the batch job.`,
  },
  {
    id: 'inv-007',
    title: 'N+1 Query Hidden Behind a Feature Flag Rollout',
    summary: 'A feature flag gradually rolled to 50% of users introduced a code path that replaced one batch SQL query with 48 individual queries. Bits identified the N+1 pattern by comparing trace flamegraphs between flagged and unflagged requests, pinpointing the exact function and line of code.',
    category: 'Latency Degradation',
    services: ['product-service', 'postgres-replica'],
    timeToResolution: '5 min',
    monitorType: 'APM',
    tags: ['n-plus-one', 'feature-flag', 'sql', 'latency'],
    featured: true,
    writeup: `## The Problem

The APM latency monitor fires on \`product-service\`: p95 for \`GET /api/products\` has jumped from 120ms to 1,840ms. But the latency graph doesn't show a clean step-function — it shows a bimodal distribution. Some requests are fast (120ms), others are slow (1,840ms). No recent deployments. Database metrics look normal.

### Why This Is Hard

Bimodal latency distributions are confusing during triage. The SRE sees that "some requests are slow" but can't immediately tell why. The database isn't overloaded. The code hasn't changed recently. The feature flag that's causing the split was ramped hours ago and wasn't flagged as risky. Identifying an N+1 query pattern requires comparing individual trace flamegraphs between fast and slow requests, counting the database spans, and tracing back to the specific code path — a tedious manual process when you're trying to triage under pressure.

## What Bits Did

Bits was triggered by the APM latency monitor and autonomously:

1. **Detected the bimodal pattern**: separated fast requests (~120ms) from slow requests (~1,840ms) and looked for the discriminating factor
2. **Identified the feature flag**: 100% of slow requests had \`enhanced-product-cards: true\` in their span tags. 100% of fast requests had the flag disabled
3. **Compared trace flamegraphs**: fast requests had 2 \`pg.query\` spans (1 listing + 1 batch enrichment). Slow requests had **49** \`pg.query\` spans (1 listing + 48 individual enrichment queries)
4. **Pinpointed the code**: \`controllers/products.py\` line 89-92 — the feature flag code path calls \`enrich_product(product.id)\` in a loop instead of using the batch \`enrich_products()\` method
5. **Assessed secondary risk**: database connection pool utilization at 78% (baseline: 22%) — trending toward exhaustion under sustained traffic

## What Bits Delivered

### Root Cause

\`enhanced-product-cards\` feature flag activates a code path in \`ProductListingController.get_products()\` (\`controllers/products.py:89\`) that calls \`enrich_product()\` per item instead of \`enrich_products()\` in batch. This turns 1 batch query into 48 individual queries per request (N+1 pattern).

### Evidence

- Bimodal latency: 120ms (unflagged) vs. 1,840ms (flagged) — 15x difference
- Flagged traces: 49 \`pg.query\` spans. Unflagged: 2 \`pg.query\` spans
- Feature flag ramped to 50% at 09:00 UTC — latency increase correlates exactly
- DB connection pool at 78% (baseline: 22%) — secondary cascading risk
- Source: \`controllers/products.py\` line 92: \`product.enrichment = enrich_product(product.id)\`

### Impact Assessment

~14,000 product listing page loads affected over 35 minutes (50% of traffic). Database connection pool trending toward exhaustion, which would have impacted other services sharing the same database.

## The Value

**Without Bits**, the SRE would have seen a latency spike, checked the database (looks fine), checked recent deploys (none), and potentially spent 15-20 minutes before thinking to check feature flag state and compare individual traces. The N+1 pattern requires counting spans in a flamegraph — not something you do in the first 5 minutes of an incident.

**Bits identified the bimodal split, traced it to the feature flag, and delivered the exact function and line number in 5 minutes.** The team paused the flag rollout immediately, then shipped a fix using the batch method before re-enabling.`,
  },
  {
    id: 'inv-008',
    title: 'Global Auth Outage From Expired mTLS Certificate',
    summary: 'A 100% authentication failure across all regions looked catastrophic but had a simple root cause: an expired internal certificate. Bits cut through 50,000+ log lines to find the x509 error, then traced back to a cert-manager renewal failure caused by stale DNS credentials.',
    category: 'Error Rate Spike',
    services: ['auth-proxy', 'identity-provider', 'cert-manager'],
    timeToResolution: '3 min',
    monitorType: 'Log',
    tags: ['tls', 'certificate', 'mTLS', 'multi-region', 'auth-failure'],
    featured: false,
    writeup: `## The Problem

A log anomaly monitor fires: \`auth-proxy\` error rate has spiked to 100% across all three production regions simultaneously. Every authenticated API call returns \`401 Unauthorized\`. This is a full authentication outage.

### Why This Is Hard

During a multi-region authentication outage, the adrenaline is high and the investigation surface is massive. The SRE's instinct is to check: recent deploys (none), database connectivity (fine), identity provider health (healthy), network connectivity (normal). Certificate expiry — especially on internal certificates that auto-renew — is almost never the first hypothesis. The relevant error (\`x509: certificate has expired\`) is buried in verbose TLS debug logs among 50,000+ log entries. And the reason the auto-renewal failed (stale DNS credentials from a routine rotation 5 days ago) requires tracing through cert-manager logs that nobody is monitoring.

## What Bits Did

Bits was triggered by the log anomaly monitor and autonomously:

1. **Recognized the multi-region pattern**: simultaneous failure across us-east-1, eu-west-1, and ap-southeast-1 → shared dependency, not region-specific
2. **Analyzed auth-proxy logs** and extracted the critical error from 50,000+ entries: \`x509: certificate has expired or is not yet valid: current time 2026-03-15T00:00:12Z is after 2026-03-15T00:00:00Z\`
3. **Inspected certificate metadata**: issued 2025-12-15, expires 2026-03-15 (90-day validity), issuer \`internal-ca.corp\`
4. **Traced the renewal failure**: cert-manager logs from 3 days prior showed \`ACME challenge failed: dns01: DNS provider returned 403 Forbidden — invalid credentials\`
5. **Identified the root cause**: DNS provider credentials were rotated on March 10 (routine security rotation), but the new credentials were not propagated to cert-manager configuration

## What Bits Delivered

### Root Cause

Internal mTLS certificate expired at 00:00 UTC on March 15. Automated renewal via cert-manager had been failing for 3 days due to stale DNS provider credentials (rotated on March 10, not updated in cert-manager config). The \`403 Forbidden\` renewal failures were logged but not monitored.

### Evidence

- \`x509: certificate has expired\` errors across all 3 regions simultaneously
- Certificate: issued 2025-12-15, expired 2026-03-15 (90-day validity)
- cert-manager log: \`ACME challenge failed: dns01: 403 Forbidden — invalid credentials\` (since March 12)
- DNS credentials rotated March 10, not propagated to cert-manager
- 34,891 failed requests (401 Unauthorized) in the alert window

### Impact Assessment

Complete authentication outage across all three production regions. 34,891 API requests failed. All authenticated functionality unavailable for approximately 14 minutes.

## The Value

**Without Bits**, the SRE would cycle through the standard checklist: deploys, database, identity provider, network. None would show an issue. Searching through 50,000+ TLS debug log lines for the certificate error, then tracing back through cert-manager logs to find the renewal failure, then connecting that to the DNS credential rotation from 5 days ago — this chain typically takes 20-45 minutes to assemble manually during a high-pressure multi-region outage.

**Bits cut through the log noise, identified the expired certificate, and delivered the full causal chain (DNS credential rotation → cert-manager failure → expired cert → auth outage) in 3 minutes.** The on-call renewed the certificate manually using the updated credentials and auth was restored.`,
  },
]
