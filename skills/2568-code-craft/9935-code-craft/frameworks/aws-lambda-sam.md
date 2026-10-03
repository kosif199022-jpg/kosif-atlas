# AWS Lambda + SAM — code-craft reference

~58 rules across three buckets. AWS Lambda deployed via SAM. TypeScript/Node.js focus (Node 20+); Python and Go noted where idioms diverge. Covers SAM CLI, `template.yaml`, Powertools, event sources. Cloudflare Workers is a separate file — don't conflate runtimes.

Sources: [docs.aws.amazon.com/lambda](https://docs.aws.amazon.com/lambda/latest/dg/), [docs.aws.amazon.com/serverless-application-model](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/), [Lambda Powertools TypeScript](https://docs.powertools.aws.dev/lambda/typescript/latest/), [AWS Compute Blog](https://aws.amazon.com/blogs/compute/), Yan Cui (theburningmonk.com, Production-Ready Serverless), James Beswick + Eric Johnson (AWS Serverless DevRel) talks 2023–2025.

Loaded by `code-craft` when the user asks about AWS Lambda, SAM, `template.yaml`, or pastes Lambda code for review.

---

## A — Tactical (day-to-day patterns)

### A1. Async handler signature
**Rule.** Always `export const handler = async (event, context) => { ... }`; never callback-style.
**Reason.** Node 20+ runtime expects a Promise; callbacks leak the event loop and miss unhandled rejections.
```ts
// wrong
exports.handler = (e, ctx, cb) => cb(null, { ok: true });
// right
export const handler = async (e: APIGatewayProxyEventV2) => ({ statusCode: 200, body: '{}' });
```

### A2. Type events with `@types/aws-lambda`
**Rule.** Pick the matching handler type: `APIGatewayProxyHandlerV2`, `SQSHandler`, `SNSHandler`, `S3Handler`, `EventBridgeHandler`, `DynamoDBStreamHandler`, `ScheduledHandler`.
**Reason.** Free type-safety on `event.Records[].body`, `requestContext.http.method`, etc.
```ts
import type { SQSHandler } from 'aws-lambda';
export const handler: SQSHandler = async (e) => { for (const r of e.Records) {/* r.body typed */} };
```

### A3. Initialize clients at module scope
**Rule.** Construct SDK clients, DB pools, and parsed env config OUTSIDE the handler so they reuse across warm invokes.
**Reason.** Module code runs once per cold start; handler body runs every invocation.
```ts
const ddb = new DynamoDBClient({});
export const handler = async (e) => ddb.send(new GetItemCommand({ ... }));
```

### A4. AWS SDK v3 only
**Rule.** Modular v3 packages (`@aws-sdk/client-dynamodb`); never `require('aws-sdk')` (v2).
**Reason.** v2 entered end-of-support Sept 2025; v3 is tree-shakable and native-Promise.
```ts
// wrong: const AWS = require('aws-sdk');
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
```

### A5. Validate env at module load
**Rule.** Wrap `process.env` in a typed `env.ts` validated by Zod at import time.
**Reason.** Misconfig fails as an init error you can alarm on, not a 500 deep in a handler.
```ts
import { z } from 'zod';
export const env = z.object({ TABLE: z.string(), AWS_REGION: z.string() }).parse(process.env);
```

### A6. Structured JSON logs via Powertools
**Rule.** `Logger` from `@aws-lambda-powertools/logger`; never `console.log('user ' + id)`.
**Reason.** CloudWatch Insights queries by JSON field; raw strings force regex hacks.
```ts
const logger = new Logger({ serviceName: 'orders' });
logger.info('order created', { orderId, userId });
```

### A7. Tracer for X-Ray spans
**Rule.** Use `@aws-lambda-powertools/tracer` and `Tracing: Active` in SAM.
**Reason.** Auto-instruments SDK calls and wraps cold start, handler, and async hops in one decorator.
```ts
const tracer = new Tracer({ serviceName: 'orders' });
const ddb = tracer.captureAWSv3Client(new DynamoDBClient({}));
```

### A8. Custom metrics via EMF
**Rule.** Emit metrics with `@aws-lambda-powertools/metrics` (Embedded Metric Format), not `cloudwatch.putMetricData`.
**Reason.** EMF piggybacks on log lines — zero extra API calls, zero extra latency.
```ts
metrics.addMetric('OrdersCreated', MetricUnit.Count, 1);
metrics.publishStoredMetrics();
```

### A9. Idempotency for at-least-once events
**Rule.** Wrap SQS/EventBridge/SNS handlers with `@aws-lambda-powertools/idempotency` backed by DynamoDB.
**Reason.** All async sources are at-least-once; without a key-scoped lock, retries double-charge cards.
```ts
export const handler = makeIdempotent(rawHandler, { persistenceStore: new DynamoDBPersistenceLayer({ tableName: 'idempotency' }) });
```

### A10. Match upstream timeouts
**Rule.** API Gateway maxes at 29s — don't set 30s+ for sync HTTP handlers.
**Reason.** Gateway returns 504 at 29s while Lambda keeps running and billing.
```yaml
Globals:
  Function: { Timeout: 10 }
```

### A11. Wire `AbortController` to remaining time
**Rule.** Pass an `AbortController` to fetch/SDK calls with deadline = `context.getRemainingTimeInMillis() - buffer`.
**Reason.** Without it, slow upstreams burn the full Lambda timeout instead of failing fast.
```ts
const ac = new AbortController();
setTimeout(() => ac.abort(), context.getRemainingTimeInMillis() - 1000);
await fetch(url, { signal: ac.signal });
```

### A12. Memory: 512–1024 MB starting point
**Rule.** Default new TS handlers to `MemorySize: 1024`; tune with AWS Lambda Power Tuning.
**Reason.** CPU scales linearly with memory; 128 MB is CPU-starved and often **more** expensive end-to-end for TS.

### A13. arm64 by default
**Rule.** Set `Architectures: [arm64]` on every function unless a native dep blocks it.
**Reason.** Graviton2 is ~20% cheaper per ms and frequently faster on Node/Python.

### A14. esbuild bundling via SAM
**Rule.** `BuildMethod: esbuild` with `Minify: true`, `Sourcemap: true`, `External: ['@aws-sdk/*']`.
**Reason.** Smaller zips = faster cold start; SDK is pre-installed on Node runtimes since Node 18.
```yaml
Metadata: { BuildMethod: esbuild, BuildProperties: { Minify: true, Target: es2022, External: ['@aws-sdk/*'] } }
```

### A15. SAM policy templates over hand-rolled JSON
**Rule.** Prefer `Policies: - DynamoDBCrudPolicy: { TableName: !Ref Orders }` over inline IAM.
**Reason.** Templates are audited, scope to one resource, and survive resource renames.
```yaml
Policies:
  - DynamoDBCrudPolicy: { TableName: !Ref OrdersTable }
  - S3ReadPolicy: { BucketName: !Ref AssetsBucket }
```

### A16. Events block, not console wiring
**Rule.** Declare every trigger in `Events:` (Api, HttpApi, Schedule, Sqs, EventBridgeRule, S3, DynamoDB).
**Reason.** Console-clicked triggers are invisible to source control and clobbered on next deploy.
```yaml
Events:
  Schedule: { Type: Schedule, Properties: { Schedule: 'rate(5 minutes)' } }
  Queue:    { Type: SQS,      Properties: { Queue: !GetAtt Q.Arn, BatchSize: 10 } }
```

### A17. Prefer HTTP API over REST API
**Rule.** Use `HttpApi` event type unless you need WAF, API keys, usage plans, or private endpoints.
**Reason.** ~70% cheaper, lower latency, simpler CORS/JWT — REST API is for legacy/enterprise gaps.
```yaml
Events:
  Get: { Type: HttpApi, Properties: { Path: /orders, Method: GET } }
```

### A18. `sam build --use-container`
**Rule.** Build inside the official Lambda container image, not on host Node.
**Reason.** Host Node version drift produces "works on my machine" — container matches the runtime.
```bash
sam build --use-container
sam local invoke OrdersFn -e events/api-get.json
sam deploy --config-env staging
```

### A19. `samconfig.toml` per environment
**Rule.** Store deploy params per env; deploy with `--config-env staging`.
**Reason.** Stops "I forgot the --parameter-overrides" deploys to prod with staging config.
```toml
[staging.deploy.parameters]
stack_name = "orders-staging"
parameter_overrides = "Stage=staging LogLevel=DEBUG"
```

### A20. One stack per stage, distinct names
**Rule.** Deploy `orders-staging` and `orders-prod` as separate stacks.
**Reason.** Rollback, drift detection, and IAM blast radius are per-stack — sharing collapses safety boundaries.

### A21. Local invoke with checked-in events
**Rule.** Keep payloads in `events/<source>-<case>.json`; invoke via `sam local invoke -e events/...json`.
**Reason.** Versioned fixtures make repro deterministic; ad-hoc payloads get lost.

### A22. CORS on HTTP API in `template.yaml`
**Rule.** Configure CORS via `HttpApi` `CorsConfiguration:`, not by hand-coding headers.
**Reason.** Centralized, applies to OPTIONS preflight, survives handler rewrites.
```yaml
Globals:
  HttpApi:
    CorsConfiguration: { AllowOrigins: ['https://app.io'], AllowMethods: [GET, POST], AllowHeaders: [content-type, authorization] }
```

### A23. Return the right shape for HTTP events
**Rule.** API Gateway / HTTP API handlers must return `{ statusCode, headers, body: JSON.stringify(...) }`.
**Reason.** Proxy integration parses that exact shape; anything else returns 502 "malformed Lambda response".
```ts
return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true }) };
```

### A24. Throw on async sources to trigger retry
**Rule.** For SQS/SNS/EventBridge handlers, throw on failure — don't return `{ statusCode: 500 }`.
**Reason.** Async sources retry on rejection; HTTP-shaped responses are gateway-only.

### A25. Validate at the boundary with Zod
**Rule.** Parse the event payload with Zod (or `@aws-lambda-powertools/parser`) and reject early with 400.
**Reason.** Untrusted input causes obscure failures deep in business logic.
```ts
const parsed = Body.safeParse(JSON.parse(event.body ?? '{}'));
if (!parsed.success) return { statusCode: 400, body: JSON.stringify(parsed.error.flatten()) };
```

---

## B — Modern Lambda + SAM idioms

### B1. Powertools as the default toolkit
**Rule.** Standardize on `@aws-lambda-powertools/{logger,tracer,metrics,idempotency,parser,parameters}`.
**Reason.** AWS-maintained, observability-first; replaces a grab-bag of npm libs with one cohesive layer.

### B2. Middy for cross-cutting concerns
**Rule.** Compose middleware with `middy(handler).use(httpJsonBodyParser()).use(httpErrorHandler()).use(cors())`.
**Reason.** Clean cross-cutting layers (parsing, errors, CORS, validation) without polluting handlers.
```ts
export const handler = middy(rawHandler).use(httpJsonBodyParser()).use(httpErrorHandler());
```

### B3. Cached SSM/Secrets via Powertools Parameters
**Rule.** Use `getParameter('/app/db', { maxAge: 300 })` from `@aws-lambda-powertools/parameters/ssm`.
**Reason.** Built-in TTL cache across warm invocations; avoids hammering SSM (50ms per request).
```ts
import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
const dbUrl = await getParameter('/orders/db-url', { maxAge: 300 });
```

### B4. Partial batch failure for SQS/Kinesis/DDB Streams
**Rule.** Return `{ batchItemFailures: [{ itemIdentifier }] }` and set `FunctionResponseTypes: [ReportBatchItemFailures]`.
**Reason.** One bad message no longer fails the whole batch — only failed records redrive.
```yaml
Events:
  Q: { Type: SQS, Properties: { Queue: !GetAtt Q.Arn, FunctionResponseTypes: [ReportBatchItemFailures] } }
```

### B5. DLQ on every async function
**Rule.** Add `DeadLetterQueue:` to every async-invoked function and SQS source; alarm on depth.
**Reason.** No DLQ = silent data loss after retries exhaust; no alarm = silent DLQ.
```yaml
DeadLetterQueue: { Type: SQS, TargetArn: !GetAtt OrdersDLQ.Arn }
```

### B6. Filter at the source
**Rule.** Apply `FilterCriteria` on SQS/EventBridge/Kinesis sources so Lambda only fires on relevant payloads.
**Reason.** Stops paying invocation fees for messages you'd discard at the top of the handler.
```yaml
Properties:
  FilterCriteria: { Filters: [{ Pattern: '{"body":{"type":["order.created"]}}' }] }
```

### B7. SnapStart vs Provisioned Concurrency
**Rule.** Java → SnapStart (free, snapshot-based init). Node/Python/Go → Provisioned Concurrency only on cold-start-sensitive sync paths.
**Reason.** SnapStart is JVM-only; PC has hourly cost so reserve it for user-facing tail-latency hotspots.
```yaml
Properties:
  AutoPublishAlias: live
  ProvisionedConcurrencyConfig: { ProvisionedConcurrentExecutions: 5 }
```

### B8. RDS Proxy for Lambda → Postgres/MySQL
**Rule.** Front RDS with RDS Proxy; never instantiate `pg.Pool` per Lambda cold start.
**Reason.** Each cold start opens a new TCP/TLS connection — at scale you exhaust the DB connection cap.

### B9. DynamoDB single-table where it fits
**Rule.** Model access patterns first; one table with composite `PK`/`SK` and GSIs for alternates.
**Reason.** Cheaper, faster, avoids `BatchGet` across N tables — Houlihan's canonical pattern.

### B10. EventBridge Pipes for shape-shift
**Rule.** Use Pipes (source → filter → enrich → target) for simple transforms; Lambda only when logic needs code.
**Reason.** Removes a hop, removes a function, removes a bill — Pipes are the modern "glue" primitive.

### B11. Step Functions for orchestration
**Rule.** When work spans retries, parallelism, or minutes/hours, use Step Functions — not Lambda chained via SNS/SQS.
**Reason.** State machines give visual debugging, replay, and built-in retry/backoff.

### B12. Lambda Function URL for tiny HTTP
**Rule.** Use `FunctionUrlConfig:` for one-off webhooks/health checks instead of API Gateway.
**Reason.** Free, lower latency, IAM-or-none auth — skips a service tier when you don't need its features.
```yaml
FunctionUrlConfig: { AuthType: NONE, Cors: { AllowOrigins: ['*'] } }
```

### B13. SAM for serverless, CDK for complex infra
**Rule.** Stay in SAM when the stack is mostly Lambda/API/Queue/Table; move to CDK when conditional logic and multi-stack refs dominate.
**Reason.** SAM is declarative and short; CDK is imperative TS — match the tool to the stack's complexity.

### B14. `aws-sdk-client-mock` for unit tests
**Rule.** Mock SDK calls with `aws-sdk-client-mock` and a fake context via `aws-lambda-mock-context`.
**Reason.** Jest/Vitest mocks of v3 commands are awkward; this lib is purpose-built.
```ts
const ddbMock = mockClient(DynamoDBClient);
ddbMock.on(GetItemCommand).resolves({ Item: { ... } });
```

### B15. `sam sync --code` for dev iteration
**Rule.** Use `sam sync --code --stack-name dev --watch` while iterating; full `sam deploy` only on infra changes.
**Reason.** `--code` skips CFN updates and pushes function code in seconds.
```bash
sam sync --code --stack-name orders-dev --watch
```

### B16. Tracing: Active globally
**Rule.** Set `Tracing: Active` in `Globals.Function`; grant `AWSXRayDaemonWriteAccess`.
**Reason.** Without it, downstream latency is invisible and "why is this slow" becomes guesswork.

### B17. Lambda Web Adapter for Express/Fastify/Hono
**Rule.** Wrap an existing HTTP app with the Lambda Web Adapter layer (`public.ecr.aws/awsguru/aws-lambda-adapter`).
**Reason.** Run Hono/Express/Fastify on Lambda without rewriting handlers — the adapter does HTTP-in/HTTP-out.

### B18. Bun via custom runtime / layer
**Rule.** For startup-sensitive paths, deploy as a container image with the Bun runtime or community Bun layer.
**Reason.** Bun's startup is ~5–10× faster than Node for small handlers; tradeoff is ecosystem maturity.

### B19. KMS-encrypt env vars or fetch from Secrets
**Rule.** Set `KmsKeyArn:` to encrypt env vars, or pull from Secrets Manager / SSM at cold start.
**Reason.** Plaintext env vars are visible to anyone with `lambda:GetFunctionConfiguration`.

### B20. Reserved concurrency only on critical paths
**Rule.** Reserve concurrency on user-facing endpoints; leave bulk/async functions unreserved.
**Reason.** Reserved concurrency CAPS account-wide free pool — over-reserving starves new functions.

### B21. VPC Lambda only when necessary
**Rule.** Don't put Lambda in a VPC unless it must reach private resources; prefer VPC endpoints for AWS APIs.
**Reason.** ENI-based VPC cold start is much improved post-Hyperplane but still adds setup cost and NAT $$.

### B22. Custom authorizers with cache TTL
**Rule.** REQUEST/TOKEN authorizers should set `AuthorizerResultTtlInSeconds` to 60–300s.
**Reason.** Without TTL, the authorizer Lambda fires every request — multiplying invocations and cold starts.

### B23. `MaxBatchingWindow` for low-rate SQS
**Rule.** Set `MaximumBatchingWindowInSeconds: 5` on sparse SQS sources; `BatchSize: 10` is the cap per invoke.
**Reason.** Default `0` fires Lambda per message — wasted invocations on low-rate queues.

### B24. `AWS_REGION` from env, never hardcoded
**Rule.** Read region from `process.env.AWS_REGION`; don't hardcode `us-east-1`.
**Reason.** Hardcoded region breaks multi-region deploys and DR; env var is always set by Lambda.

### B25. `DeletionPolicy: Retain` on stateful resources
**Rule.** Set `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` on DynamoDB, S3, RDS in prod.
**Reason.** Default is `Delete` — stack delete or replace silently nukes production data.
```yaml
OrdersTable: { Type: AWS::DynamoDB::Table, DeletionPolicy: Retain, UpdateReplacePolicy: Retain }
```

### B26. Layers for heavy shared deps
**Rule.** Put `sharp`, `puppeteer-core`, big SDKs into Lambda Layers; reference via `Layers:`.
**Reason.** Code-package cap is 250 MB unzipped — layers share across functions and keep you under it.

### B27. Container image when layers won't fit
**Rule.** Use `PackageType: Image` with a `Dockerfile` for ML / PDF / heavy binary workloads up to 10 GB.
**Reason.** Beyond layer limits, container images are the supported path with same cold-start profile in 2024+.

---

## D — Anti-patterns / smells

### D1. AWS SDK v2 in new code
**Rule.** Don't `require('aws-sdk')` in new functions.
**Reason.** v2 is end-of-support Sept 2025; stuck on Node 16/18, no maintenance.
```ts
// wrong
const AWS = require('aws-sdk');
// right
import { S3Client } from '@aws-sdk/client-s3';
```

### D2. SDK clients constructed in handler
**Rule.** Never `new DynamoDBClient({})` inside the handler body.
**Reason.** Re-builds connection pool every invoke; defeats Lambda's reuse model.
```ts
// wrong
export const handler = async () => { const ddb = new DynamoDBClient({}); ... };
```

### D3. Fire-and-forget Promises not returned
**Rule.** Don't `someAsync()` without `await` and without including in the returned Promise.
**Reason.** Lambda freezes the runtime when the handler resolves; pending work may never complete.
```ts
// wrong
export const handler = async () => { logToS3(event); return ok; };
// right: await logToS3(event); return ok;
```

### D4. `console.log` everywhere
**Rule.** Don't `console.log('user', user)` in production handlers.
**Reason.** No JSON, no requestId, no level — Insights queries become regex archaeology.

### D5. Default 3-second timeout
**Rule.** Don't leave `Timeout: 3` (CFN default) on a handler doing real I/O.
**Reason.** Quietly truncates real work; you see truncated executions, not obvious errors.

### D6. 128 MB on TypeScript handlers
**Rule.** Don't ship TS Lambda at `MemorySize: 128`.
**Reason.** CPU is throttled below 1 vCPU; bumping to 1024 MB often LOWERS bill — runtime drops faster than $/ms rises.

### D7. `x86_64` left as default
**Rule.** Don't accept default architecture without thinking.
**Reason.** arm64 Graviton is ~20% cheaper, ~10–20% faster on most TS/Python workloads.

### D8. Hand-rolled IAM JSON for common cases
**Rule.** Don't write inline `Statement:` blocks when `DynamoDBCrudPolicy` exists.
**Reason.** Reinventing audited templates leaks excessive permissions.

### D9. `Resource: '*'`
**Rule.** Never `Resource: '*'` in IAM policies; scope by ARN.
**Reason.** Cross-resource blast radius; passes audit only by exception.
```yaml
# wrong: Resource: '*'
# right: Resource: !GetAtt OrdersTable.Arn
```

### D10. Bundling `aws-sdk` v2 from `node_modules`
**Rule.** Don't ship v2 in your zip.
**Reason.** It's already on the runtime — bundling adds 50+ MB and slows cold start.

### D11. Bundling `@aws-sdk/*` redundantly per function
**Rule.** Across many small functions, share the SDK in a Layer.
**Reason.** 50 functions × 5 MB SDK = 250 MB of duplication and 50 cold-start parses.

### D12. Logging request bodies/headers raw
**Rule.** Never `logger.info('event', { event })` with auth headers / PII / payment data.
**Reason.** CloudWatch Logs is durable and replicated — leaks are a breach with regulatory cost.

### D13. Plaintext secrets in `template.yaml` env
**Rule.** Don't put `STRIPE_KEY: sk_live_...` in source.
**Reason.** Visible to anyone with `lambda:GetFunctionConfiguration`; commit-history leaks. Use Secrets Manager.

### D14. Lambda polling SQS from another Lambda
**Rule.** Never `sqs.receiveMessage` from inside a Lambda — use the Event Source Mapping.
**Reason.** ESM is free, scales automatically, handles long-polling and partial failures.

### D15. Single `SendMessage` in a loop
**Rule.** Use `SendMessageBatch` (10 messages) when sending many SQS messages.
**Reason.** 10× fewer round trips; same throughput cap, dramatically lower latency.

### D16. Ignoring `UnprocessedItems`
**Rule.** Always retry the `UnprocessedItems` returned by `BatchGetItem` / `BatchWriteItem`.
**Reason.** DynamoDB partial-failure protocol — silent data loss otherwise.
```ts
let res = await ddb.send(new BatchWriteCommand({ RequestItems }));
while (Object.keys(res.UnprocessedItems ?? {}).length) res = await ddb.send(new BatchWriteCommand({ RequestItems: res.UnprocessedItems }));
```

### D17. `Scan` in production
**Rule.** Don't `ScanCommand` a production DynamoDB table.
**Reason.** Reads every item, bills RCU for every item, doesn't scale. Almost always means a missing GSI.

### D18. Lambda calling Lambda synchronously
**Rule.** Don't `lambda.invoke({ InvocationType: 'RequestResponse' })` to compose business logic.
**Reason.** Doubles cost, couples timeouts, hides failures. Use Step Functions or async invoke.

### D19. CPU work over 15 minutes
**Rule.** Don't run a Lambda that takes >15 min — that's the hard cap.
**Reason.** Hard timeout, not negotiable. Move to Fargate / Batch / EC2.

### D20. Uncaught error in handler
**Rule.** Don't allow an uncaught rejection inside the handler.
**Reason.** Logged differently across runtimes, may miss alarms, skews metrics.

### D21. Returning a `Response` object for API Gateway
**Rule.** Don't `return new Response('ok')` for an API Gateway event.
**Reason.** Gateway expects `{ statusCode, headers, body }` — `Response` works on Workers, not Lambda proxy integration.

### D22. Missing `content-type` on JSON responses
**Rule.** Don't return JSON without `headers: { 'content-type': 'application/json' }`.
**Reason.** Browsers/fetch/axios handle missing content-type inconsistently — hours of "why is body a string" debugging.

### D23. No CORS configured
**Rule.** Don't ship browser-facing HTTP API without `CorsConfiguration:`.
**Reason.** Browser preflight fails; "CORS error" is the #1 wasted day in serverless launches.

### D24. No DLQ on async / SQS sources
**Rule.** Don't deploy async-invoked / SQS / EventBridge functions without a DLQ.
**Reason.** AWS retries up to 2 times for async — after that, message is silently dropped.

### D25. DLQ depth alarm missing
**Rule.** Don't ship a DLQ without a CloudWatch alarm on `ApproximateNumberOfMessagesVisible > 0`.
**Reason.** A DLQ no one watches is just a slower form of message loss.

### D26. Hardcoded region
**Rule.** Don't `new S3Client({ region: 'us-east-1' })` literal.
**Reason.** Breaks multi-region failover; `process.env.AWS_REGION` is always set by Lambda.

### D27. `ReservedConcurrentExecutions: 0`
**Rule.** Never deploy `ReservedConcurrentExecutions: 0` (kills the function).
**Reason.** Setting to zero is the documented way to disable a function; easily left in by accident.

### D28. `sam build` without `--use-container`
**Rule.** Don't build on host Node and ship; build inside the Lambda container image.
**Reason.** Host vs runtime Node mismatch causes native-binding and tsx/swc surprises.

### D29. Console-edited stack
**Rule.** Don't edit deployed function config in the AWS console.
**Reason.** Drift from `template.yaml`; next `sam deploy` silently reverts your fix.

### D30. `DeletionPolicy: Delete` on prod data
**Rule.** Don't leave default `DeletionPolicy` on DynamoDB tables, S3 buckets, RDS in prod.
**Reason.** Stack delete or replace = data gone. Set `Retain` and `UpdateReplacePolicy: Retain`.

### D31. Per-developer + prod stacks on same account
**Rule.** Don't share an AWS account between per-dev stacks and prod.
**Reason.** IAM role conflicts, log namespace pollution, one bad `sam delete` can hit prod.

### D32. Layer arch mismatched with function arch
**Rule.** Don't attach an `x86_64`-built layer to an `arm64` function.
**Reason.** Native binaries (`sharp`, `bcrypt`) fail at runtime; set `BuildArchitecture: arm64`.
```yaml
Metadata: { BuildArchitecture: arm64 }
```

### D33. Logging entire event objects
**Rule.** Don't `console.log(JSON.stringify(event))` blindly.
**Reason.** Massive CloudWatch ingest cost on busy functions, and PII leaks.

### D34. Idempotency missing on SQS handlers
**Rule.** Don't process SQS messages without an idempotency key check.
**Reason.** SQS is at-least-once — visibility-timeout retries duplicate emails / charges.

### D35. `MaxBatchingWindow: 0` on low-rate SQS
**Rule.** Don't leave `MaximumBatchingWindowInSeconds: 0` on a low-rate queue.
**Reason.** Fires Lambda per message — wasted invocations and cold starts. Tune to 1–10s.

### D36. Single-region default for global product
**Rule.** Don't ship a global product as `us-east-1`-only without a DR plan.
**Reason.** Single-region is fine for v1, but DR is hard to retrofit — design the multi-region path early.

### D37. AssumeRole open to any account
**Rule.** Don't allow `sts:AssumeRole` from `Principal: '*'` or `AWS: '*'`.
**Reason.** Anyone in any AWS account can pop your role. Scope to specific principals.

### D38. Tracing off, then debugging latency
**Rule.** Don't try to debug "why slow" without `Tracing: Active`.
**Reason.** Without X-Ray you're guessing at downstream call durations.

### D39. Sample events not in repo
**Rule.** Don't keep `sam local invoke` payloads in chat history or `~/scratch`.
**Reason.** Test reproducibility dies; check `events/*.json` into the repo.

### D40. Custom domain without renewal monitoring
**Rule.** Don't attach an ACM cert to API Gateway without an expiry alarm.
**Reason.** ACM auto-renews only DNS-validated certs while CNAMEs resolve; otherwise expiry takes prod down.

---

## Sources

- AWS Lambda Developer Guide: <https://docs.aws.amazon.com/lambda/latest/dg/>
- AWS SAM Developer Guide: <https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/>
- Lambda Powertools (TypeScript): <https://docs.powertools.aws.dev/lambda/typescript/latest/>
- AWS Compute Blog (Serverless): <https://aws.amazon.com/blogs/compute/category/compute/aws-lambda/>
- AWS SDK for JavaScript v3: <https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/>
- AWS Lambda Power Tuning: <https://github.com/alexcasalboni/aws-lambda-power-tuning>
- AWS Lambda Web Adapter: <https://github.com/awslabs/aws-lambda-web-adapter>
- Yan Cui, Production-Ready Serverless: <https://theburningmonk.com>
- James Beswick, Eric Johnson (AWS Serverless DevRel) talks 2023–2025
- AWS re:Invent 2024 SVS sessions (SVS401, SVS402, SVS406)
