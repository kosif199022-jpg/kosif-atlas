# WSTG Category Reference

Full reference for the 12 OWASP WSTG testing categories. Numbered IDs are the
stable v4.2 canonical set (the citable standard). Where the owasp.org **latest**
(v5.0 work-in-progress) adds draft tests, they are flagged `[latest]` — cite them
as draft, verify the current ID at the live source before quoting.

For each category: **purpose**, the full test list, **look-for** (highest-value
checks), **fix** (defensive guidance for self-review), and **tools**.

Live source of truth: <https://owasp.org/www-project-web-security-testing-guide/latest/>
· Repo: <https://github.com/OWASP/wstg>

---

## WSTG-INFO — Information Gathering

**Purpose:** Recon. Learn what the target exposes before active testing — surface, tech stack, entry points.

- INFO-01 Conduct Search Engine Discovery and Reconnaissance for Information Leakage
- INFO-02 Fingerprint Web Server
- INFO-03 Review Webserver Metafiles for Information Leakage
- INFO-04 Enumerate Applications on Webserver
- INFO-05 Review Webpage Content for Information Leakage
- INFO-06 Identify Application Entry Points
- INFO-07 Map Execution Paths Through Application
- INFO-08 Fingerprint Web Application Framework
- INFO-09 Fingerprint Web Application
- INFO-10 Map Application Architecture

**Look-for:** secrets in JS bundles / source maps / HTML comments; `.git`, `.env`, `robots.txt`, `sitemap.xml`, `security.txt`; verbose `Server`/`X-Powered-By` headers; staging/admin hosts via cert transparency & subdomain enum.
**Fix:** strip comments/source maps from prod builds; suppress version banners; gate non-prod hosts; never ship secrets to the client bundle.
**Tools:** Google dorks, `nmap`, `whatweb`, Wappalyzer, `gobuster`/`ffuf`, `gau`, `subfinder`, crt.sh, Burp Suite spider.

---

## WSTG-CONF — Configuration and Deployment Management Testing

**Purpose:** Find weaknesses in how the app/platform is configured and deployed.

- CONF-01 Test Network Infrastructure Configuration
- CONF-02 Test Application Platform Configuration
- CONF-03 Test File Extensions Handling for Sensitive Information
- CONF-04 Review Old Backup and Unreferenced Files for Sensitive Information
- CONF-05 Enumerate Infrastructure and Application Admin Interfaces
- CONF-06 Test HTTP Methods
- CONF-07 Test HTTP Strict Transport Security
- CONF-08 Test RIA Cross Domain Policy
- CONF-09 Test File Permission
- CONF-10 Test for Subdomain Takeover
- CONF-11 Test Cloud Storage
- CONF-12 Testing for Content Security Policy
- CONF-13 Test Path Confusion
- CONF-14 Test Other HTTP Security Header Misconfigurations

**Look-for:** dangling DNS → subdomain takeover; world-readable cloud buckets; `.bak`/`.old`/`~` files; enabled `PUT`/`DELETE`/`TRACE`; missing/weak HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; default admin consoles exposed.
**Fix:** least-privilege bucket/file perms; remove backups from web root; allowlist HTTP methods; ship a strict CSP (no `unsafe-inline`/`unsafe-eval`, nonces/hashes); `Strict-Transport-Security` with preload; delete dangling DNS records.
**Tools:** `nmap`, `nikto`, `testssl.sh`, securityheaders.com, CSP Evaluator, cloud bucket scanners, `subjack`.

---

## WSTG-IDNT — Identity Management Testing

**Purpose:** Test how identities, roles, and accounts are defined and provisioned.

- IDNT-01 Test Role Definitions
- IDNT-02 Test User Registration Process
- IDNT-03 Test Account Provisioning Process
- IDNT-04 Testing for Account Enumeration and Guessable User Account
- IDNT-05 Testing for Weak or Unenforced Username Policy

**Look-for:** login/registration/reset responses that differ for valid vs invalid users (enumeration); self-registration granting elevated roles; predictable usernames; orphaned/over-privileged provisioned accounts.
**Fix:** uniform responses + timing for existing/non-existing accounts; server-side role assignment only; enforce username policy; review the deprovisioning path.
**Tools:** Burp Intruder/Repeater, custom scripts.

---

## WSTG-ATHN — Authentication Testing

**Purpose:** Verify the authentication mechanism resists bypass and weak-credential attacks.

- ATHN-01 Testing for Credentials Transported over an Encrypted Channel
- ATHN-02 Testing for Default Credentials
- ATHN-03 Testing for Weak Lock Out Mechanism
- ATHN-04 Testing for Bypassing Authentication Schema
- ATHN-05 Testing for Vulnerable Remember Password
- ATHN-06 Testing for Browser Cache Weakness
- ATHN-07 Testing for Weak Password Policy
- ATHN-08 Testing for Weak Security Question Answer
- ATHN-09 Testing for Weak Password Change or Reset Functionalities
- ATHN-10 Testing for Weaker Authentication in Alternative Channel
- ATHN-11 Testing Multi-Factor Authentication (MFA)

**Look-for:** creds over HTTP; default/leftover accounts; no rate-limit/lockout (credential stuffing); forced-browsing past login; predictable reset tokens; MFA that can be skipped, brute-forced (no OTP rate limit), or bypassed at a sibling endpoint (mobile/API).
**Fix:** TLS everywhere; remove defaults; rate-limit + lockout with backoff; signed, single-use, short-lived reset tokens tied to the user; enforce MFA on every auth path including alternative channels; align password policy with current NIST 800-63B guidance.
**Tools:** Burp Suite, `hydra` (authorized only), token analysis.

---

## WSTG-ATHZ — Authorization Testing

**Purpose:** Confirm users cannot act outside their granted privileges.

- ATHZ-01 Testing Directory Traversal File Include
- ATHZ-02 Testing for Bypassing Authorization Schema
- ATHZ-03 Testing for Privilege Escalation
- ATHZ-04 Testing for Insecure Direct Object References
- ATHZ-05 Testing for OAuth Weaknesses `[latest]`

**Look-for:** IDOR — swap an object ID and access another user's data; `../` path traversal; horizontal/vertical priv-esc via tampered role/param; OAuth flaws (open `redirect_uri`, missing `state`/PKCE, token leakage, scope upgrade).
**Fix:** enforce object-level authorization server-side on every request (never trust client-supplied IDs); deny-by-default; canonicalize + sandbox file paths; OAuth: exact `redirect_uri` match, `state` + PKCE, validate `aud`/scope.
**Tools:** Burp (Autorize / Auth Analyzer extensions), two test accounts, manual ID tampering.

---

## WSTG-SESS — Session Management Testing

**Purpose:** Test how sessions are created, maintained, and destroyed.

- SESS-01 Testing for Session Management Schema
- SESS-02 Testing for Cookies Attributes
- SESS-03 Testing for Session Fixation
- SESS-04 Testing for Exposed Session Variables
- SESS-05 Testing for Cross Site Request Forgery
- SESS-06 Testing for Logout Functionality
- SESS-07 Testing Session Timeout
- SESS-08 Testing for Session Puzzling
- SESS-09 Testing for Session Hijacking
- SESS-10 Testing JSON Web Tokens
- SESS-11 Testing for Concurrent Sessions

**Look-for:** cookies missing `HttpOnly`/`Secure`/`SameSite`; session ID not rotated on login (fixation); no CSRF protection on state-changing requests; session valid after logout/timeout; JWT issues — `alg:none`, weak HMAC secret, `kid` injection, no expiry/audience check.
**Fix:** rotate session ID on privilege change; `HttpOnly; Secure; SameSite=Lax|Strict`; anti-CSRF tokens or `SameSite` + origin checks; server-side invalidation on logout; idle + absolute timeouts; for JWT pin the algorithm, verify signature/`exp`/`aud`/`iss`, rotate strong keys.
**Tools:** Burp Suite, jwt_tool, jwt.io (decode only — never paste prod secrets into web tools).

---

## WSTG-INPV — Input Validation Testing

**Purpose:** The injection chapter — does untrusted input reach an interpreter or sink unsafely?

- INPV-01 Testing for Reflected Cross Site Scripting
- INPV-02 Testing for Stored Cross Site Scripting
- INPV-03 Testing for HTTP Verb Tampering
- INPV-04 Testing for HTTP Parameter Pollution
- INPV-05 Testing for SQL Injection
- INPV-06 Testing for LDAP Injection
- INPV-07 Testing for XML Injection
- INPV-08 Testing for SSI Injection
- INPV-09 Testing for XPath Injection
- INPV-10 Testing for IMAP SMTP Injection
- INPV-11 Testing for Code Injection
- INPV-12 Testing for Command Injection
- INPV-13 Testing for Format String Injection
- INPV-14 Testing for Incubated Vulnerabilities
- INPV-15 Testing for HTTP Splitting Smuggling
- INPV-16 Testing for HTTP Incoming Requests
- INPV-17 Testing for Host Header Injection
- INPV-18 Testing for Server-Side Template Injection
- INPV-19 Testing for Server-Side Request Forgery
- INPV-20 Testing for Mass Assignment
- CSV Injection `[latest]`

**Look-for:** XSS (reflected/stored/DOM — see CLNT-01 for DOM); SQLi (error-based, boolean/time-blind, UNION); SSTI (`{{7*7}}` → 49); SSRF reaching internal/metadata endpoints (`169.254.169.254`); command injection; mass assignment of privileged fields (`isAdmin`, `role`); Host-header poisoning of reset links/cache.
**Fix:** parameterized queries / prepared statements (never string-concat SQL); context-aware output encoding + CSP for XSS; sandbox or avoid template engines on user input; SSRF — allowlist egress, block link-local/metadata, resolve-then-validate; bind only explicit DTO fields (block mass assignment); validate `Host` against an allowlist.
**Tools:** Burp Suite + Active Scan, `sqlmap` (authorized), tplmap, XSS Hunter, `ffuf`. See [PAYLOADS.md](PAYLOADS.md).

---

## WSTG-ERRH — Testing for Error Handling

**Purpose:** Check whether errors leak internals.

- ERRH-01 Testing for Improper Error Handling
- ERRH-02 Testing for Stack Traces

**Look-for:** stack traces, SQL errors, framework debug pages, internal paths/IPs in responses; differing error behavior that aids enumeration.
**Fix:** generic error pages in prod; disable debug mode; log details server-side only; consistent status codes.
**Tools:** Burp, manual fuzzing with malformed input.

---

## WSTG-CRYP — Testing for Weak Cryptography

**Purpose:** Test transport and at-rest crypto strength.

- CRYP-01 Testing for Weak Transport Layer Security
- CRYP-02 Testing for Padding Oracle
- CRYP-03 Testing for Sensitive Information Sent Via Unencrypted Channels
- CRYP-04 Testing for Weak Cryptographic Primitives

**Look-for:** TLS < 1.2, weak ciphers/renegotiation, expired/mismatched certs; padding-oracle behavior; sensitive data over HTTP or in URLs/logs; MD5/SHA1/ECB, hard-coded keys, custom crypto.
**Fix:** TLS 1.2+ (prefer 1.3), modern cipher suites, HSTS; authenticated encryption (AES-GCM); vetted libraries only; rotate/manage keys via a KMS; never roll your own crypto.
**Tools:** `testssl.sh`, `sslyze`, SSL Labs, `nmap --script ssl-enum-ciphers`.

---

## WSTG-BUSL — Business Logic Testing

**Purpose:** Find flaws in the application's logic that automated scanners miss. Requires understanding the workflow.

- BUSL-01 Test Business Logic Data Validation
- BUSL-02 Test Ability to Forge Requests
- BUSL-03 Test Integrity Checks
- BUSL-04 Test for Process Timing
- BUSL-05 Test Number of Times a Function Can Be Used Limits
- BUSL-06 Testing for the Circumvention of Work Flows
- BUSL-07 Test Defenses Against Application Misuse
- BUSL-08 Test Upload of Unexpected File Types
- BUSL-09 Test Upload of Malicious Files
- BUSL-10 Test Payment Functionality

**Look-for:** skipping required workflow steps; replaying/forging requests; negative quantities or price tampering at checkout; race conditions (double-spend, coupon reuse); using a function past its intended limit; uploading executable/oversized/polyglot files.
**Fix:** enforce state machine + server-side invariants for every step; idempotency keys + locking for money/inventory; re-validate price/totals server-side; validate upload type by content (magic bytes) not extension, store outside web root, scan, randomize names.
**Tools:** mostly manual + Burp; Turbo Intruder for race conditions.

---

## WSTG-CLNT — Client-side Testing

**Purpose:** Vulnerabilities executing in the browser.

- CLNT-01 Testing for DOM Based Cross Site Scripting
- CLNT-02 Testing for JavaScript Execution
- CLNT-03 Testing for HTML Injection
- CLNT-04 Testing for Client-Side URL Redirect
- CLNT-05 Testing for CSS Injection
- CLNT-06 Testing for Client-Side Resource Manipulation
- CLNT-07 Test Cross Origin Resource Sharing
- CLNT-08 Testing for Cross Site Flashing
- CLNT-09 Testing for Clickjacking
- CLNT-10 Testing WebSockets
- CLNT-11 Test Web Messaging
- CLNT-12 Test Browser Storage
- CLNT-13 Testing for Cross Site Script Inclusion
- CLNT-14 Testing for Reverse Tabnabbing
- Client-side Template Injection `[latest]`

**Look-for:** DOM XSS via `innerHTML`/`document.write`/`eval`/`location` sinks; open redirects; permissive CORS (`Access-Control-Allow-Origin: *` with credentials, or reflected origin); missing frame protection (clickjacking); `postMessage` without origin check; secrets in `localStorage`; `target=_blank` without `rel=noopener` (reverse tabnabbing).
**Fix:** use safe DOM APIs (`textContent`), Trusted Types, sanitize with DOMPurify; strict CORS allowlist (never reflect origin with credentials); `X-Frame-Options: DENY` or `frame-ancestors`; validate `event.origin` in message handlers; `rel="noopener noreferrer"`; keep secrets out of web storage.
**Tools:** browser DevTools, DOM Invader (Burp), `postMessage-tracker`.

---

## WSTG-APIT — API Testing

**Purpose:** REST/GraphQL-specific weaknesses (overlaps OWASP API Security Top 10).

- APIT-01 API Reconnaissance
- APIT-02 API Broken Object Level Authorization
- APIT-99 Testing GraphQL
- Broken Function Level Authorization (BFLA) `[latest]`
- Excessive Data Exposure `[latest]`

**Look-for:** BOLA/IDOR on object IDs (the #1 API risk); BFLA — reaching admin endpoints/verbs as a normal user; endpoints returning more fields than the UI uses; GraphQL introspection enabled, batching/alias abuse, deep-nested query DoS; missing rate limits.
**Fix:** per-object + per-function authorization checks server-side; return only needed fields (explicit DTOs, never raw ORM objects); disable introspection in prod; query depth/complexity limits + rate limiting; document and test every endpoint.
**Tools:** Postman, Burp, `kiterunner`, GraphQL: GraphiQL, InQL, `clairvoyance`, `graphw00f`.

---

## Cross-references

- **OWASP API Security Top 10** complements WSTG-APIT for API-heavy targets.
- **OWASP ASVS** = the verification-requirements companion; map findings to ASVS levels for a maturity view.
- **OWASP Top 10** = the awareness list; WSTG is the *how-to-test* methodology behind it.
