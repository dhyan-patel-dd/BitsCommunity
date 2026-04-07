/**
 * Curated investigation examples for the Library section.
 * Each entry showcases a real-world scenario where Bits AI SRE
 * helped solve a complex problem, with a detailed writeup.
 */

export const investigationCategories = [
  'Incident Response',
  'Performance Degradation',
  'Deployment Failure',
  'Infrastructure',
  'Database',
  'Networking',
]

export const categoryColors = {
  'Incident Response':      { bg: 'bg-red-500/12',    text: 'text-red-400',    border: 'border-red-500/25' },
  'Performance Degradation': { bg: 'bg-orange-500/12', text: 'text-orange-400', border: 'border-orange-500/25' },
  'Deployment Failure':      { bg: 'bg-yellow-500/12', text: 'text-yellow-400', border: 'border-yellow-500/25' },
  'Infrastructure':          { bg: 'bg-blue-500/12',   text: 'text-blue-400',   border: 'border-blue-500/25' },
  'Database':                { bg: 'bg-emerald-500/12',text: 'text-emerald-400',border: 'border-emerald-500/25' },
  'Networking':              { bg: 'bg-purple-500/12', text: 'text-purple-400', border: 'border-purple-500/25' },
}

export const categoryIcons = {
  'Incident Response':       '🚨',
  'Performance Degradation': '📉',
  'Deployment Failure':      '🚀',
  'Infrastructure':          '🏗️',
  'Database':                '🗄️',
  'Networking':              '🌐',
}

export const investigations = [
  {
    id: 'inv-001',
    title: 'Cascading Latency Spike Traced to Misconfigured Connection Pool',
    summary: 'A 10x latency spike across three microservices was caused by a single service exhausting its database connection pool after a config change went unnoticed during deployment.',
    category: 'Performance Degradation',
    services: ['checkout-service', 'inventory-api', 'postgres-primary'],
    timeToResolution: '7 min',
    monitorType: 'APM',
    tags: ['latency', 'connection-pool', 'cascading-failure', 'microservices'],
    featured: true,
    writeup: `## The Alert

An alert fired at 2:47 AM: \`checkout-service p99 latency > 5s\`. Within minutes, downstream alerts triggered for \`inventory-api\` and the Postgres primary.

## What Bits Found

Bits immediately correlated the three firing monitors and identified a shared dependency: all impacted services routed through \`checkout-service\` for inventory checks. Bits traced the root cause to a **connection pool misconfiguration** deployed 4 hours earlier.

### Key Evidence Surfaced

1. **APM trace analysis** — Bits identified that 94% of slow traces had a common span: \`pg.query\` on \`checkout-service\`, with wait times averaging 4.2s (up from 12ms baseline).
2. **Recent deployment diff** — Bits flagged a config change in the 6:43 PM deploy: \`max_pool_size\` was reduced from 50 to 5 in the connection pool config, buried in a YAML file that also contained unrelated feature flag changes.
3. **Resource correlation** — Postgres \`active_connections\` metric showed the pool was fully saturated, with 100+ queued requests backing up.

## The Fix

The on-call engineer reverted \`max_pool_size\` to 50. Latency returned to baseline within 3 minutes of the config rollback.

## Why Bits Made the Difference

Without Bits, the on-call would have started with the Postgres alerts (the loudest signal) and likely investigated database-level issues first — slow queries, lock contention, disk I/O. The actual root cause (a config value change in a different service's deployment) would have taken significantly longer to surface manually.

Bits' ability to correlate the **deployment timeline with APM traces and infrastructure metrics** simultaneously compressed what could have been a 1-2 hour investigation into minutes.`,
  },
  {
    id: 'inv-002',
    title: 'Memory Leak in Node.js Service Caught Before Customer Impact',
    summary: 'Bits identified a gradual memory leak in a payment processing service by correlating anomaly detection with recent code changes, enabling a fix before any customer-facing errors occurred.',
    category: 'Incident Response',
    services: ['payment-processor', 'redis-cache'],
    timeToResolution: '5 min',
    monitorType: 'Anomaly',
    tags: ['memory-leak', 'node.js', 'anomaly-detection', 'proactive'],
    featured: true,
    writeup: `## The Alert

An anomaly monitor detected \`payment-processor\` memory usage trending 3 standard deviations above its weekly baseline. No customer-facing errors had occurred yet — the service was at 78% memory utilization and climbing.

## What Bits Found

Bits analyzed the anomaly in context and identified a **memory leak introduced 2 days earlier** in a PR that modified the event listener cleanup logic.

### Key Evidence Surfaced

1. **Memory trend analysis** — Bits charted the memory growth pattern: a steady 2% per hour increase starting exactly at the timestamp of deploy \`v2.14.3\`, with no corresponding increase in request volume.
2. **Code change correlation** — Bits flagged the deploy diff, specifically a change to \`EventEmitter\` listeners in the payment webhook handler. The new code attached listeners on each request but never called \`removeListener()\` on completion.
3. **Garbage collection metrics** — GC pause times had increased 4x, confirming growing heap pressure. Bits surfaced the \`process.memoryUsage.heapUsed\` metric alongside the GC data.
4. **Projected impact** — Based on the growth rate, Bits estimated OOM kill within ~11 hours, well before the next business day.

## The Fix

The team pushed a hotfix adding proper listener cleanup in the webhook handler. Memory usage stabilized within one GC cycle.

## Why Bits Made the Difference

This was a **proactive catch** — no customers were affected. Traditional alerting would have fired only at 90% memory (the threshold alert), by which point the service would have been minutes from OOM. Bits' correlation of the anomaly with the specific code change gave the team both the "what" and the "why" in a single investigation, enabling a targeted fix instead of a broad rollback.`,
  },
  {
    id: 'inv-003',
    title: 'Failed Canary Deployment Caused Silent Data Corruption',
    summary: 'A canary deployment passed health checks but introduced a serialization bug that corrupted 0.3% of order records. Bits identified the corruption pattern by cross-referencing log anomalies with the deploy timeline.',
    category: 'Deployment Failure',
    services: ['order-service', 'kafka-pipeline', 'dynamo-orders'],
    timeToResolution: '8 min',
    monitorType: 'Log',
    tags: ['canary', 'data-corruption', 'serialization', 'kafka'],
    featured: false,
    writeup: `## The Alert

A log anomaly monitor detected a 15x spike in \`JSON parse error\` log lines from the \`kafka-pipeline\` consumer group processing order events.

## What Bits Found

Bits traced the malformed messages back to the \`order-service\` canary that had been promoted to full traffic 2 hours earlier. The canary had passed all health checks, but a subtle serialization change was producing invalid payloads for a specific order type.

### Key Evidence Surfaced

1. **Log pattern analysis** — Bits grouped the parse errors and identified that 100% of failures involved orders with a \`gift_wrap\` field — a recently added optional field. The serialization produced \`"gift_wrap": undefined\` (invalid JSON) instead of omitting the field.
2. **Deploy timeline correlation** — The error spike started exactly 14 minutes after canary promotion, matching the lag time for the Kafka consumer to process the backlog.
3. **Blast radius assessment** — Bits queried DynamoDB metrics and estimated 847 order records were affected (0.3% of daily volume), providing a precise scope for the data remediation effort.
4. **Health check gap** — Bits noted that the canary health checks only validated the \`/health\` endpoint and p99 latency — no payload validation was in the check suite.

## The Fix

The team rolled back to the previous version, published a corrected serialization fix, and ran a backfill job for the 847 affected orders using the raw Kafka messages (which were still in retention).

## Why Bits Made the Difference

The canary "passed" — traditional deployment safety checks saw green. Bits caught the issue because it wasn't looking at deployment health checks; it was looking at **downstream effects across the entire pipeline**. The correlation of log anomalies → specific payload field → deploy timeline → blast radius gave the team everything they needed to act confidently and quickly.`,
  },
  {
    id: 'inv-004',
    title: 'Kubernetes Node Pressure Caused Intermittent Pod Evictions',
    summary: 'Intermittent 503 errors were caused by pod evictions due to memory pressure on a subset of nodes. Bits correlated the eviction events with node-level metrics and identified an oversized DaemonSet as the root cause.',
    category: 'Infrastructure',
    services: ['k8s-cluster-prod', 'monitoring-daemonset', 'api-gateway'],
    timeToResolution: '6 min',
    monitorType: 'Infrastructure',
    tags: ['kubernetes', 'pod-eviction', 'daemonset', 'memory-pressure', 'node-pressure'],
    featured: true,
    writeup: `## The Alert

Intermittent \`503 Service Unavailable\` errors on the API gateway, firing and recovering every 10-15 minutes. Traditional monitors kept auto-resolving, making it look like transient noise.

## What Bits Found

Bits identified a pattern: the 503s correlated with **Kubernetes pod eviction events** on 3 specific nodes. The evictions were caused by memory pressure from an updated \`monitoring-daemonset\` that had doubled its memory footprint after a version bump.

### Key Evidence Surfaced

1. **Event correlation** — Bits linked the 503 windows to \`kubectl\` eviction events (\`Evicted\` reason) on nodes \`ip-10-0-4-17\`, \`ip-10-0-4-23\`, and \`ip-10-0-4-31\`. Each 503 window aligned exactly with an eviction → reschedule cycle.
2. **Node memory breakdown** — On the affected nodes, the \`monitoring-daemonset\` was consuming 1.8 GB per pod (up from 900 MB before its v3.2 update 3 days prior). This left insufficient allocatable memory for application pods.
3. **Why only 3 nodes** — Bits identified that these were the only nodes running the \`m5.large\` instance type (8 GB RAM). All \`m5.xlarge\` nodes (16 GB) had sufficient headroom.
4. **DaemonSet change diff** — The version bump from v3.1 → v3.2 of the monitoring agent included a new in-memory cache feature enabled by default, accounting for the memory increase.

## The Fix

The team set explicit memory limits on the DaemonSet and disabled the in-memory cache feature for the smaller nodes. Long-term, they migrated the \`m5.large\` nodes to \`m5.xlarge\`.

## Why Bits Made the Difference

Intermittent issues that auto-resolve are notoriously hard to debug — they often get dismissed as "transient." Bits' persistence in correlating the timing pattern across Kubernetes events, node metrics, and the DaemonSet update history turned a frustrating intermittent problem into a clear, actionable diagnosis.`,
  },
  {
    id: 'inv-005',
    title: 'Slow Query Regression After PostgreSQL Index Was Silently Dropped',
    summary: 'A 50x query time regression was caused by a missing index that was accidentally dropped during a migration. Bits identified the missing index by comparing query plans before and after the migration deployment.',
    category: 'Database',
    services: ['user-service', 'postgres-replica', 'search-api'],
    timeToResolution: '4 min',
    monitorType: 'APM',
    tags: ['postgresql', 'slow-query', 'index', 'migration', 'query-plan'],
    featured: false,
    writeup: `## The Alert

The \`search-api\` p95 latency jumped from 120ms to 6.2s. The monitor escalated when the latency persisted beyond the 5-minute evaluation window.

## What Bits Found

Bits traced the slow responses to a single PostgreSQL query in \`user-service\` that had regressed from 8ms to 4.1s. The regression was caused by a **dropped index** — a migration script intended to rename an index instead dropped the old one and failed to create the replacement due to a syntax error that was silently swallowed.

### Key Evidence Surfaced

1. **APM drill-down** — Bits isolated the slow span: \`SELECT * FROM users WHERE org_id = $1 AND status = $2\` — a query that hit the \`users\` table with 12M rows. Without the composite index, it was doing a sequential scan.
2. **Migration timeline** — Bits identified that migration \`20260208_rename_user_indexes\` ran at 3:12 PM, and the latency regression started at 3:12 PM. The migration contained a \`DROP INDEX\` followed by a \`CREATE INDEX\` with a typo in the column name, which failed silently because the migration tool was configured with \`ON ERROR CONTINUE\`.
3. **Query plan comparison** — Bits compared the current \`EXPLAIN ANALYZE\` output (Seq Scan, 4.1s) with the expected plan (Index Scan, 8ms), confirming the missing index as the root cause.
4. **Blast radius** — 3 downstream services depended on this query path, all showing elevated latency.

## The Fix

The team manually created the correct composite index (\`org_id, status\`). Query times returned to baseline within seconds of index creation.

## Why Bits Made the Difference

The migration had "succeeded" according to the deployment pipeline — the syntax error was swallowed. Without Bits correlating the exact migration timestamp with the query plan regression, the team would have been investigating the database server itself (CPU, I/O, connections) rather than looking at a migration script from hours earlier. Bits turned a needle-in-a-haystack problem into a direct pointer to the failing migration line.`,
  },
  {
    id: 'inv-006',
    title: 'DNS Resolution Failures Caused Intermittent Timeouts Across Services',
    summary: 'Sporadic timeouts across multiple unrelated services were traced to CoreDNS pod resource limits being hit during a traffic spike. Bits correlated the timeout pattern across services and identified DNS as the common dependency.',
    category: 'Networking',
    services: ['coredns', 'auth-service', 'catalog-api', 'notification-service'],
    timeToResolution: '6 min',
    monitorType: 'Infrastructure',
    tags: ['dns', 'coredns', 'kubernetes', 'timeout', 'resource-limits'],
    featured: false,
    writeup: `## The Alert

Multiple monitors fired simultaneously: \`auth-service\` connection timeouts, \`catalog-api\` upstream errors, and \`notification-service\` delivery failures. The alerts appeared unrelated — three different services, three different error types.

## What Bits Found

Bits identified the **common denominator**: all three services were failing on DNS resolution. CoreDNS pods were CPU-throttled, causing resolution timeouts that manifested as different error types in each service.

### Key Evidence Surfaced

1. **Cross-service correlation** — Bits noticed all three services started failing within the same 30-second window. Despite different error messages (\`ETIMEDOUT\`, \`502 Bad Gateway\`, \`connection refused\`), Bits identified that each failure occurred during the DNS resolution phase of the request lifecycle.
2. **CoreDNS metrics** — CoreDNS pods were hitting their CPU limit (200m), causing request queuing. DNS resolution p99 jumped from 2ms to 8.3s. The \`coredns_dns_request_duration_seconds\` histogram showed a bimodal distribution: fast (cache hit) or very slow (queued).
3. **Traffic spike trigger** — A batch job kicked off at the same time, generating 15k DNS queries/second (3x normal). The batch job was resolving external hostnames for a data enrichment pipeline.
4. **Why now** — CoreDNS CPU limits had been set 8 months ago for a much smaller cluster. The cluster had since grown 3x, but the CoreDNS resource allocation was never updated.

## The Fix

Immediate: increased CoreDNS CPU limits from 200m to 1000m and added 2 additional replicas. Longer-term: implemented ndots optimization and added DNS caching at the application level for the batch job.

## Why Bits Made the Difference

Three different teams would have investigated three different incidents independently. Bits' cross-service correlation identified that these were **one incident with three symptoms**, and the shared DNS dependency was the unifying explanation. This saved three parallel investigations and pointed directly to infrastructure-level remediation.`,
  },
  {
    id: 'inv-007',
    title: 'Rate Limiter Misconfiguration Blocked Legitimate Traffic After Scaling Event',
    summary: 'After an auto-scaling event added new pods, a rate limiter using per-pod counters caused legitimate requests to be rejected. Bits identified the rate limiter as the bottleneck by tracing 429 responses to the scaling event timeline.',
    category: 'Incident Response',
    services: ['api-gateway', 'rate-limiter', 'redis-cluster'],
    timeToResolution: '5 min',
    monitorType: 'APM',
    tags: ['rate-limiting', 'auto-scaling', 'false-positive', '429-errors'],
    featured: false,
    writeup: `## The Alert

The \`api-gateway\` monitor detected a spike in 429 (Too Many Requests) responses — 23% of all requests were being rate-limited during a period of normal customer traffic.

## What Bits Found

Bits traced the 429 spike to a **rate limiter misconfiguration** that was exposed by a Kubernetes auto-scaling event. The rate limiter was using per-pod in-memory counters instead of the shared Redis backend, meaning each new pod started with a fresh counter window while existing pods had accumulated counts.

### Key Evidence Surfaced

1. **Scaling event correlation** — An HPA event scaled the API gateway from 8 to 14 pods at 10:23 AM. The 429 rate jumped from 0.1% to 23% exactly 2 minutes later (the rate limiter window reset interval).
2. **Per-pod breakdown** — Bits broke down 429 responses by pod. The original 8 pods were serving normally. The 6 new pods were rejecting traffic at 40%+ rates. This asymmetry immediately pointed to a per-pod state issue rather than a global rate limit being hit.
3. **Configuration analysis** — The rate limiter was configured with \`strategy: local\` instead of \`strategy: redis\`. With \`local\`, each pod maintains its own counter. After scaling, the load balancer distributed traffic evenly, but the per-pod limits were set assuming the original pod count — each new pod's limit was too low for the traffic it received.
4. **Customer impact** — Bits estimated 12,400 legitimate requests were rejected, primarily affecting the mobile app (which retried with backoff, causing a secondary traffic spike).

## The Fix

Switched the rate limiter strategy from \`local\` to \`redis\` to use shared counters. Adjusted per-pod limits to account for dynamic scaling. Added a monitor for rate limiter rejection ratio by pod.

## Why Bits Made the Difference

The initial instinct was to investigate whether the traffic spike itself was malicious (a DDoS or bot attack). Bits' per-pod breakdown immediately disproved this theory — the traffic was legitimate, and the asymmetry between old and new pods pointed directly to the scaling + rate limiter interaction. Without this breakdown, the team would have likely spent time analyzing traffic patterns instead of the rate limiter configuration.`,
  },
  {
    id: 'inv-008',
    title: 'Certificate Expiry Caused Cascading Auth Failures Across Regions',
    summary: 'An expired internal TLS certificate caused authentication failures that propagated across three regions. Bits identified the cert expiry by correlating mTLS handshake errors with the certificate metadata timeline.',
    category: 'Networking',
    services: ['auth-proxy', 'service-mesh', 'cert-manager'],
    timeToResolution: '3 min',
    monitorType: 'Log',
    tags: ['tls', 'certificate', 'mTLS', 'multi-region', 'auth-failure'],
    featured: true,
    writeup: `## The Alert

Critical alert: authentication success rate dropped to 0% across all three production regions simultaneously. Every authenticated API call was failing with \`401 Unauthorized\`.

## What Bits Found

Bits identified that the root cause was an **expired internal mTLS certificate** used by the auth-proxy to communicate with the identity provider. The certificate had a 90-day rotation policy but the automated renewal had silently failed 3 days prior.

### Key Evidence Surfaced

1. **Global correlation** — Bits immediately recognized the simultaneous failure across regions as a shared-dependency issue rather than a region-specific outage. The common link: all regions used the same internal CA for mTLS.
2. **Log pattern extraction** — Auth-proxy logs contained \`x509: certificate has expired or is not yet valid\` errors, but these were buried in verbose TLS debug logs. Bits extracted and highlighted this specific error line from 50k+ log entries.
3. **Certificate timeline** — Bits identified the cert was issued 90 days ago (\`Not After: 2026-03-15T00:00:00Z\`), and the cert-manager renewal job had failed 3 days prior with \`error: ACME challenge timeout\`. The failure was logged but not monitored.
4. **Why auto-renewal failed** — The ACME challenge required DNS validation, but a recent DNS provider migration changed the API credentials. Cert-manager was still using the old credentials.

## The Fix

Manual certificate renewal using the updated DNS credentials. Follow-up: added monitoring for cert-manager renewal failures, set up alerts for certificates expiring within 14 days, and updated the DNS credentials in cert-manager config.

## Why Bits Made the Difference

During a critical incident, the instinct is to check application code, database connectivity, and recent deploys. Certificate expiry — especially on internal certs — is rarely the first hypothesis. Bits' ability to parse TLS error logs, correlate the certificate's \`Not After\` timestamp, and trace back to the failed renewal job gave the team the full causal chain in minutes. The rapid resolution was possible only because Bits eliminated the "hypothesis cycling" that typically extends multi-region auth failures to 45+ minutes.`,
  },
]
