# Application Security Attack Surfaces

Select sections based on the current project's entry points, trust boundaries, and deployment model. A listed concern
becomes a finding only when evidence supports a reachable failure and meaningful impact.

## Identity, permissions, and API exposure

- Trace unauthenticated and low-privilege access to sensitive routes, alternate HTTP methods, server actions, RPC,
  subscriptions, exports, legacy endpoints, and administrative operations.
- Check ownership, tenant scoping, role boundaries, and field-level read/write permissions. Follow user-supplied IDs and
  bulk operations through the actual query and response serialization.
- Inspect login, recovery, invitation acceptance, session rotation and revocation, token validation, and sensitive
  account changes. Verify issuer, audience, expiry, signature, and replay controls where the protocol requires them.
- Look for mass assignment, excessive response data, client-controlled identity or tenant context, and secrets or
  privileged operations mistakenly shipped to clients. Confirm intentional public access before flagging it.

## Browser and frontend boundaries

- Follow untrusted text, HTML, Markdown, URLs, and files into rendering sinks. Account for context-specific escaping,
  sanitization, dangerous DOM operations, and scriptable URL schemes, including persisted content and previews.
- For cookie-authenticated state changes, verify CSRF defenses and method semantics. Inspect cookie attributes and
  session exposure in URLs, client storage, logs, and browser bundles according to the actual authentication design.
- Inspect cross-origin trust: credentialed CORS, `postMessage` origin and sender checks, iframe interactions, and
  redirects used by authentication or other sensitive flows. CORS limits browser reads, not direct API callers.
- Assess clickjacking and content security policy where relevant to a concrete sensitive surface. A missing header alone
  does not establish an exploit. Check framework-provided escaping before reporting XSS.

## Injection and interpreter boundaries

- Trace attacker-controlled values into SQL or NoSQL queries, shell commands and arguments, templates, XML parsers,
  deserialization, dynamic evaluation, and unsafe regular expressions. Identify the actual interpreter and escaping or
  parameterization guarantees instead of treating all string concatenation as exploitable.
- Inspect schema validation, ambiguous or duplicate parameters, type coercion, and alternate encodings when they can
  change authorization or sink behavior. Validation is not a substitute for sink-specific safety.
- If the project gives an AI model privileged tools, check whether untrusted content can induce unauthorized actions or
  disclose protected data through those tools. Model instructions do not enforce application permissions.

## Files, uploads, and local execution

- Trace paths through canonicalization, directory boundaries, symlinks, archive extraction, reads, writes, and deletion.
  Establish whether attacker-controlled paths cross an intended filesystem or privilege boundary.
- Review upload type and size checks, processing libraries, executable or active content, serving origin, storage
  permissions, and download authorization. Filename extensions and client-supplied MIME types are not sufficient proof
  of file contents.
- For CLIs and workers, inspect untrusted configuration, environment variables, working directories, executable lookup,
  subprocess arguments, temporary files, and credential storage in the context of who controls them and who executes the
  command. Require a trust boundary or protected asset before claiming an exploit.

## Outbound requests and integrations

- Review URL fetchers, previews, importers, proxies, and callbacks for SSRF. Trace scheme and destination checks through
  redirects and resolution, and consider internal services and metadata endpoints when reachable in the deployment.
- Verify webhook authenticity, replay handling, and authorization of side effects. Treat data from external APIs and
  events as untrusted inputs to local operations.
- Check whether credentials or sensitive headers can be forwarded to a user-controlled destination, including after a
  redirect. Assess authentication callback destinations against the actual protocol and configuration.

## Business logic and resource limits

- Inspect state transitions, concurrent requests, retries, and replay around payments, credits, invitations, one-time
  tokens, and other scarce or privileged actions that exist in the product.
- Follow limits to the operation they protect. Consider bypasses through alternate routes, identities, batch requests,
  or workers, and expensive parsing, uploads, queries, exports, and third-party charges.
- Verify bounded work, timeouts, pagination, and concurrency where attacker-controlled inputs can cause material
  resource exhaustion. Establish an attainable abuse path without performing live load tests.
- Connect automation of sensitive workflows to the concrete technical control. Content policy and moderation choices can
  be noted as related trust-and-safety concerns without duplicating the finding.

## Data protection, configuration, and supply chain

- Check sensitive data exposure through responses, caches shared across users or tenants, logs, errors, generated
  assets, storage policies, debug endpoints, and deployed defaults. Identify whether configuration is for development or
  actually reachable in the reviewed deployment.
- Inspect secret handling and cryptographic use, including password storage, token randomness, key lifecycle, and
  transport validation. Redact values in evidence and avoid treating public client configuration as a secret.
- Use installed versions and vendor advisories to assess dependency vulnerabilities. Separate affected version matches
  from reachable vulnerable functionality and verify claimed fixed versions before recommending an upgrade.
- Review build, update, plugin, or artifact trust when in scope, especially when untrusted contributions can influence
  code executed with privileged credentials. Do not infer runtime safety from a clean dependency scan.

## Errors, failures, and security observability

- Inspect failure paths for fail-open authorization, partial state changes, unsafe retries, leaked internals, and limits
  bypassed when dependencies or validation fail. Include cleanup and transaction boundaries where they affect impact.
- Verify useful records for relevant authentication failures, denied access, privileged changes, and abuse controls.
  Consider alerting and response only where supported by the project's operations.
- Keep credentials and sensitive payloads out of logs. Missing telemetry is normally a detection or hardening gap;
  describe concrete consequences rather than claiming it directly grants access.

## OWASP and implementation references

Use authoritative sources to resolve relevant questions and identify the edition when citing category IDs. These
references guide coverage; checking selected categories does not constitute a complete standard assessment.

- [OWASP Top 10:2025](https://owasp.org/Top10/2025/) groups common web application risks, including access control,
  configuration, supply chain, cryptography, injection, design, authentication, integrity, logging, and failure
  handling.
- [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) adds API-specific prompts
  for object, property, and function authorization, sensitive workflows, resource use, endpoint inventory, and
  integrations.
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
  provides detailed control requirements when the review needs a verification criterion.

Use documentation for the project's actual framework and version to verify default protections and configuration
semantics. If sources cannot be checked, keep version-sensitive conclusions qualified rather than inventing a guarantee.
