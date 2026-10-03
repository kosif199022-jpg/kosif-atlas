# Security

Source: https://v20.angular.dev/best-practices/security

Covers Angular's built-in protections against common web vulnerabilities. Does not cover authentication/authorization.

Report vulnerabilities: https://bughunters.google.com/report

---

## Best Practices

1. **Keep current with the latest Angular library releases** — Check the [changelog](https://github.com/angular/angular/blob/main/CHANGELOG.md) for security-related updates.
2. **Don't alter your copy of Angular** — Customized versions fall behind and may miss security fixes. Contribute via pull request instead.
3. **Avoid APIs marked "Security Risk"** — See [Trusting safe values](#trusting-safe-values).

---

## Preventing Cross-Site Scripting (XSS)

XSS allows attackers to inject malicious code into the DOM to steal data or impersonate users.

### Angular's XSS Security Model

- Angular treats all values as **untrusted by default**.
- Values inserted via template binding or interpolation are **sanitized and escaped**.
- Templates are considered **trusted by default** and treated as executable code.
- **Never create templates by concatenating user input** — this enables code injection.
- Always use the **default AOT template compiler** in production.
- Use **Content Security Policy** and **Trusted Types** for additional defense-in-depth.

### Security Contexts

Angular defines these security contexts for sanitization:

| Security Context | Usage |
|---|---|
| HTML | Binding to `innerHtml` |
| Style | Binding CSS into the `style` property |
| URL | URL properties like `<a href>` |
| Resource URL | URLs loaded and executed as code, e.g. `<script src>` |

Angular sanitizes HTML and URLs. Resource URLs cannot be sanitized (they contain arbitrary code).

### Sanitization Example

Interpolated content is always escaped (HTML not interpreted). Binding to `[innerHTML]` is sanitized:

```ts
// Angular automatically sanitizes this — removes <script>, keeps <b>
htmlSnippet = 'Template <script>alert("0wned")</script> <b>Syntax</b>';
```

### Direct DOM API Usage

Built-in browser DOM APIs (`document`, `ElementRef`, third-party libs) do NOT auto-sanitize. Use Angular templates wherever possible. When unavoidable:

```ts
DomSanitizer.sanitize(SecurityContext, value)
```

### Trusting Safe Values

When you've verified a value is safe, bypass sanitization via `DomSanitizer`:

```ts
private sanitizer = inject(DomSanitizer);

// Available methods:
sanitizer.bypassSecurityTrustHtml(value)
sanitizer.bypassSecurityTrustScript(value)
sanitizer.bypassSecurityTrustStyle(value)
sanitizer.bypassSecurityTrustUrl(value)
sanitizer.bypassSecurityTrustResourceUrl(value)
```

Example:
```ts
this.trustedUrl = this.sanitizer.bypassSecurityTrustUrl('javascript:alert("Hi there")');
this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + id);
```

If you need to convert user input into a trusted value, always do it in a component method.

---

## Content Security Policy (CSP)

Minimal CSP for a new Angular app:

```
default-src 'self';
style-src 'self' 'nonce-randomNonceGoesHere';
script-src 'self' 'nonce-randomNonceGoesHere';
```

Nonce must be **unique per request** and unpredictable. Ways to provide nonce to Angular:

1. Set `autoCsp: true` in workspace config.
2. Set `ngCspNonce="randomNonceGoesHere"` attribute on root app element.
3. Provide via `CSP_NONCE` injection token:
   ```ts
   bootstrapApplication(AppComponent, {
     providers: [{ provide: CSP_NONCE, useValue: globalThis.myRandomNonceValue }]
   });
   ```

If nonces aren't possible, add `'unsafe-inline'` to `style-src`.

---

## Enforcing Trusted Types

[Trusted Types](https://w3c.github.io/trusted-types/dist/spec/) prevents XSS by enforcing safer coding practices. Angular policies for HTTP headers:

| Policy | When Required |
|---|---|
| `angular` | Always required when Trusted Types enforced |
| `angular#bundler` | When using lazy chunk files |
| `angular#unsafe-bypass` | When using `bypassSecurityTrust*` methods |
| `angular#unsafe-jit` | When using JIT compiler |
| `angular#unsafe-upgrade` | When using `@angular/upgrade` (AngularJS hybrid) |

Example headers:
```
# Standard
Content-Security-Policy: trusted-types angular; require-trusted-types-for 'script';

# With bypass methods
Content-Security-Policy: trusted-types angular angular#unsafe-bypass; require-trusted-types-for 'script';

# With JIT
Content-Security-Policy: trusted-types angular angular#unsafe-jit; require-trusted-types-for 'script';

# With lazy loading
Content-Security-Policy: trusted-types angular angular#bundler; require-trusted-types-for 'script';
```

Configure in: production infrastructure, `angular.json` (`ng serve`), and `karma.config.js` (`ng test`).

---

## Use the AOT Template Compiler

- **AOT compiler** is the default in Angular CLI — prevents **template injection** vulnerabilities.
- **JIT compiler** compiles templates in the browser at runtime — Angular trusts template code, so dynamically generating templates (especially with user data) circumvents Angular's built-in protections. This is a **security anti-pattern**.

---

## Server-Side XSS Protection

- HTML built on the server is vulnerable to injection attacks.
- **Never create Angular templates on the server side** — high risk of template injection.
- Use a server-side templating language that auto-escapes values.

---

## HTTP-Level Vulnerabilities

### Cross-Site Request Forgery (CSRF/XSRF)

Angular's `HttpClient` supports XSRF protection by default:
- Reads token from `XSRF-TOKEN` cookie
- Sets it as `X-XSRF-TOKEN` header on all mutating requests (POST, etc.)
- Does NOT protect GET/HEAD requests or absolute URLs (by design — CSRF only matters for state-changing requests)

Server must:
1. Set a `XSRF-TOKEN` JavaScript-readable session cookie on page load or first GET
2. Verify the `X-XSRF-TOKEN` header on eligible requests

**Custom cookie/header names:**
```ts
provideHttpClient(
  withXsrfConfiguration({
    cookieName: 'CUSTOM_XSRF_TOKEN',
    headerName: 'X-Custom-Xsrf-Header',
  }),
)
```

**Disable XSRF protection:**
```ts
provideHttpClient(withNoXsrfProtection())
```

### Cross-Site Script Inclusion (XSSI)

JSON vulnerability — attacker can read JSON API data via `<script>` tags. Servers prevent this by prefixing JSON with `")]}',\n"`. Angular's `HttpClient` automatically strips this prefix.

---

## Auditing Angular Applications

Angular-specific APIs that should be audited in security reviews — specifically the `bypassSecurityTrust*` methods — are marked as security sensitive in the documentation.
