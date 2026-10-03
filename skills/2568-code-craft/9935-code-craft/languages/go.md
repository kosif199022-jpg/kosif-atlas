# Go — code-craft reference

~60 rules across three buckets. Sources: *Effective Go*, Go Code Review Comments, Uber Go Style Guide, Go Proverbs (Rob Pike), Go release notes 1.21–1.24, Dave Cheney's blog, Mat Ryer talks, Carlana Johnson on generics. Stable assumed: Go 1.21+ (`slog`, `slices`, `maps`, `cmp`, `sync.OnceFunc`), 1.22+ (loop variable scoping, `for range n`, method-aware `ServeMux`).

Loaded by `code-craft` when the user asks about Go or pastes Go code for review. Framework-specific patterns (Echo, Gin, Chi, gRPC, Lambda) live under `frameworks/` — Lambda specifically lives in `frameworks/aws-lambda-sam.md`.

---

## A — Tactical (day-to-day patterns)

### A1. Standard project layout
**Rule.** Binaries under `cmd/<name>/main.go`; private packages under `internal/`; `go.mod` at module root.
**Reason.** `internal/` is enforced by the toolchain — packages outside the module can't import it. `cmd/` keeps `main` thin.
```
myapp/
  go.mod
  cmd/server/main.go
  internal/users/users.go
  internal/http/server.go
```

### A2. Short, lowercase package names
**Rule.** One word, lowercase, no underscores or camelCase. The package name is part of every identifier callers type.
**Reason.** `users.New()` reads; `user_service.New()` doesn't. Stutter (`users.UsersRepo`) is the symptom of a bad package name.
```go
// wrong: package user_service; type UserServiceRepo struct{}
// right: package users;        type Repo struct{}
```

### A3. MixedCaps, never underscores
**Rule.** Exported `MixedCaps`, unexported `mixedCaps`. Underscore is reserved for the blank identifier.
**Reason.** Go's idiom; `gofmt` won't fix it but reviewers will.
```go
// wrong
var max_retries = 3
// right
var maxRetries = 3
```

### A4. Short, consistent receiver names
**Rule.** One- or two-letter receiver, same across every method on the type. Never `this` or `self`.
**Reason.** Receivers are noise; consistency is a reading aid.
```go
// wrong
func (this *Server) Start() {}
func (s *Server) Stop() {}
// right
func (s *Server) Start() {}
func (s *Server) Stop() {}
```

### A5. Errors are values, returned last
**Rule.** Return `error` as the last result; no exceptions; check immediately.
**Reason.** Errors compose; flat `if err != nil { return ..., err }` reads top-to-bottom.
```go
f, err := os.Open(path)
if err != nil {
    return nil, err
}
defer f.Close()
```

### A6. Sentinel errors with `errors.Is`
**Rule.** Define sentinels as `var ErrX = errors.New("...")`; compare with `errors.Is`, never `==`.
**Reason.** Wrapping (`%w`) hides the sentinel from `==`; `errors.Is` walks the chain.
```go
var ErrNotFound = errors.New("not found")
if errors.Is(err, ErrNotFound) { /* ... */ }
```

### A7. Wrap with `%w` for context
**Rule.** Add context with `fmt.Errorf("loading %s: %w", path, err)`; never lose the wrapped error.
**Reason.** Callers can still `errors.Is`/`As`; you've added the breadcrumb.
```go
// wrong
return fmt.Errorf("loading %s: %v", path, err)
// right
return fmt.Errorf("loading %s: %w", path, err)
```

### A8. `errors.As` for typed extraction
**Rule.** Extract typed errors with `errors.As(err, &target)`, not type assertions.
**Reason.** Works through wrapping; type assertions fail on `%w`.
```go
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    log.Printf("op=%s path=%s", pathErr.Op, pathErr.Path)
}
```

### A9. Multi-error joins
**Rule.** `errors.Join(err1, err2)` (1.20+) when multiple independent failures need to surface together.
**Reason.** Standard, `Is`/`As`-aware, replaces ad-hoc `multierror` packages for most cases.
```go
return errors.Join(closeDB(), closeCache())
```

### A10. Defer cleanup at acquisition
**Rule.** Pair `Open`/`Lock`/`Begin` with `defer Close`/`Unlock`/`Rollback` on the next line.
**Reason.** Cleanup can't drift away from acquisition; panic-safe.
```go
f, err := os.Open(p)
if err != nil { return err }
defer f.Close()
```

### A11. Check deferred close errors when they matter
**Rule.** For writers and DB transactions, capture the deferred close error.
**Reason.** A failed `Close` on a writer can mean lost data.
```go
defer func() {
    if cerr := f.Close(); cerr != nil && err == nil {
        err = cerr
    }
}()
```

### A12. Context first, never stored
**Rule.** `ctx context.Context` is always the first parameter. Don't store it in a struct (rare exceptions: long-lived request scopes).
**Reason.** Storing a context defeats cancellation propagation and confuses lifetime.
```go
// wrong
type Svc struct{ ctx context.Context }
// right
func (s *Svc) Do(ctx context.Context, id string) error { /* ... */ }
```

### A13. Cancel every derived context
**Rule.** Pair `WithCancel` / `WithTimeout` / `WithDeadline` with `defer cancel()` immediately.
**Reason.** Leaks goroutines and timers if you forget; `go vet` catches some, not all.
```go
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
defer cancel()
```

### A14. Goroutines need a stop story
**Rule.** Don't `go` something without knowing how it ends — `<-ctx.Done()`, channel close, or `WaitGroup`.
**Reason.** Untracked goroutines leak forever and hold references.
```go
// wrong
go work()
// right
var wg sync.WaitGroup
wg.Add(1)
go func() { defer wg.Done(); work(ctx) }()
```

### A15. Channel direction in signatures
**Rule.** Constrain channels in parameters: `<-chan T` for receive-only, `chan<- T` for send-only.
**Reason.** Compiler enforces the protocol; signature documents intent.
```go
func consume(in <-chan Msg) { for m := range in { use(m) } }
func produce(out chan<- Msg) { out <- Msg{} }
```

### A16. Close from sender side only
**Rule.** Only the sender closes. Never close from receiver; never close twice.
**Reason.** Closing a channel a sender still uses panics; receivers detect close via `v, ok := <-ch`.
```go
go func() { defer close(out); for _, x := range in { out <- x } }()
```

### A17. Mutex over RWMutex by default
**Rule.** Use `sync.Mutex`; reach for `sync.RWMutex` only with measured read-heavy contention.
**Reason.** RWMutex is heavier per-op and easy to misuse; cargo-culting it loses on most workloads.
```go
type Cache struct {
    mu sync.Mutex // protects items
    items map[string]int
}
```

### A18. Document what each mutex protects
**Rule.** Place the mutex above the fields it protects, with a one-line comment.
**Reason.** Readers know the locking contract without spelunking.
```go
type Server struct {
    mu       sync.Mutex // protects conns
    conns    map[ID]*Conn
}
```

### A19. `omitempty` deliberately
**Rule.** Add `,omitempty` only when the zero value should be absent from output; don't sprinkle it.
**Reason.** `omitempty` hides false bools, zero ints, empty strings — sometimes that's wrong.
```go
type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email,omitempty"` // optional
}
```

### A20. `len(s) == 0`, not `s == nil`
**Rule.** Test slice/map emptiness with `len(x) == 0`; nil slices already have length zero.
**Reason.** Conflating nil and empty slice is a recurring bug magnet.
```go
// wrong
if s == nil || len(s) == 0 { ... }
// right
if len(s) == 0 { ... }
```

### A21. Pre-size slices and maps
**Rule.** `make([]T, 0, n)` / `make(map[K]V, n)` when `n` is known.
**Reason.** Avoids reallocation churn; one-line perf win.
```go
out := make([]int, 0, len(in))
for _, x := range in { out = append(out, x*2) }
```

### A22. Map presence check
**Rule.** Use the two-value form when missing-vs-zero matters: `v, ok := m[k]`.
**Reason.** A missing key returns the zero value; `ok` disambiguates.
```go
if v, ok := cache[id]; ok { return v }
```

### A23. `strings.Builder` for concatenation
**Rule.** Build strings in loops with `strings.Builder`; `bytes.Buffer` for bytes.
**Reason.** `+=` re-allocates each round; Builder writes to a growable slice.
```go
var b strings.Builder
for _, p := range parts { b.WriteString(p) }
return b.String()
```

### A24. Time: UTC, IsZero, typed durations
**Rule.** Store/transmit as `time.Now().UTC()`; check absence with `t.IsZero()`; durations are `time.Duration`, not `int`.
**Reason.** Timezones and untyped seconds are perennial bug sources.
```go
const timeout = 5 * time.Second
if user.LastSeen.IsZero() { /* never seen */ }
```

### A25. `net/http.ServeMux` with method routing (1.22+)
**Rule.** For new code, the stdlib mux now does method+pattern routing — start there before reaching for a router.
**Reason.** One less dependency; sufficient for most apps.
```go
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("POST /users", createUser)
```

### A26. Never `ListenAndServe` without timeouts
**Rule.** Always configure `http.Server` with `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`.
**Reason.** Default zero means "no timeout" — Slowloris, stuck conns, leaked memory.
```go
srv := &http.Server{
    Addr: ":8080", Handler: mux,
    ReadHeaderTimeout: 5 * time.Second,
    ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second,
    IdleTimeout: 120 * time.Second,
}
```

### A27. Graceful shutdown via signal context
**Rule.** Use `signal.NotifyContext` + `srv.Shutdown(ctx)` for clean stops.
**Reason.** Drains in-flight requests; avoids data loss on SIGTERM.
```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
go srv.ListenAndServe()
<-ctx.Done()
srv.Shutdown(context.Background())
```

### A28. Table-driven tests with `t.Run`
**Rule.** Subtests via `t.Run(name, ...)`; share a slice of cases; `t.Parallel()` per case when independent.
**Reason.** Targeted `-run`, parallel speedup, clean failure attribution.
```go
for _, tc := range cases {
    tc := tc
    t.Run(tc.name, func(t *testing.T) {
        t.Parallel()
        if got := f(tc.in); got != tc.want { t.Errorf("got %v want %v", got, tc.want) }
    })
}
```

### A29. `t.Cleanup` over manual teardown
**Rule.** Register cleanup with `t.Cleanup(...)` next to setup; don't track teardown manually.
**Reason.** Runs even on `t.Fatal`; co-located with what it cleans.
```go
db := openTestDB(t)
t.Cleanup(func() { db.Close() })
```

### A30. Run `-race` in CI
**Rule.** `go test -race ./...` baseline; treat data races as bugs.
**Reason.** Race detector catches what code review can't.

---

## B — Modern Go idioms

### B1. Generics only when types add value
**Rule.** Use `[T any]` for genuinely type-parametric code (collections, container algorithms); resist the urge to genericize where one type would do.
**Reason.** Generics inflate cognitive load and binary size; "interface" or concrete type is often clearer.
```go
func Map[T, U any](xs []T, f func(T) U) []U {
    out := make([]U, len(xs))
    for i, x := range xs { out[i] = f(x) }
    return out
}
```

### B2. Constraints for ordered/numeric ops
**Rule.** Use approximation (`~`) and `cmp.Ordered` (1.21+) when you need comparison or arithmetic.
**Reason.** `~int` accepts user-defined types whose underlying is `int`.
```go
func Max[T cmp.Ordered](a, b T) T { if a > b { return a }; return b }
```

### B3. `slices` and `maps` packages
**Rule.** Reach for `slices.Contains`, `slices.Sort`, `slices.SortFunc`, `slices.Concat`, `maps.Keys`, `maps.Values` (1.21+) over hand-rolling.
**Reason.** Standard, generic, well-tested; deletes lines of code.
```go
slices.SortFunc(users, func(a, b User) int { return cmp.Compare(a.Name, b.Name) })
if slices.Contains(allowed, role) { /* ... */ }
```

### B4. `cmp.Or` for zero-value defaults
**Rule.** Collapse fallback chains with `cmp.Or(a, b, c)` (1.22+).
**Reason.** Returns the first non-zero value; replaces nested ternaries.
```go
host := cmp.Or(os.Getenv("HOST"), cfg.Host, "localhost")
```

### B5. Typed atomics
**Rule.** Use `atomic.Int64`, `atomic.Bool`, `atomic.Pointer[T]` (1.19+) over the package-level functions.
**Reason.** Methods document intent; no manual `unsafe` casts; can't mix with non-atomic accesses by accident.
```go
var hits atomic.Int64
hits.Add(1)
```

### B6. `errgroup` for concurrent fan-out
**Rule.** `errgroup.WithContext` for parallel work with first-error cancellation; `g.SetLimit(n)` for bounded concurrency.
**Reason.** Beats hand-rolled `sync.WaitGroup` + error channel; cancels siblings on first failure.
```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(8)
for _, u := range urls {
    g.Go(func() error { return fetch(ctx, u) })
}
return g.Wait()
```

### B7. `context.WithCancelCause`
**Rule.** When you need to know *why* a context cancelled, use `WithCancelCause` (1.20+) and `context.Cause(ctx)`.
**Reason.** Plain `Err()` returns only `context.Canceled`; cause carries diagnostic detail.
```go
ctx, cancel := context.WithCancelCause(parent)
cancel(fmt.Errorf("upstream 503"))
log.Println(context.Cause(ctx))
```

### B8. `slog` for structured logs
**Rule.** New code uses `log/slog` (1.21+); JSON handler in production, attributes as key/value pairs.
**Reason.** Structured fields, levels, handlers, contextable; replaces `log` and most third-party loggers.
```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.Info("served", "method", r.Method, "path", r.URL.Path, "ms", elapsed.Milliseconds())
```

### B9. Logger via context or struct field
**Rule.** Pass `*slog.Logger` as a struct field for long-lived components; through context for request-scoped attributes.
**Reason.** Avoids global state and the `log` package's hidden default.
```go
type Server struct{ log *slog.Logger }
reqLog := s.log.With("rid", reqID)
```

### B10. Single shared `*http.Client`
**Rule.** Construct one `&http.Client{Timeout: ...}` per process; never `http.DefaultClient` for outbound work.
**Reason.** `DefaultClient` has no timeout (hangs forever) and is shared globally.
```go
var httpClient = &http.Client{Timeout: 10 * time.Second}
```

### B11. Always close response bodies
**Rule.** `defer resp.Body.Close()` immediately after the err check; drain on early return for keep-alive reuse.
**Reason.** Otherwise the connection leaks and can't be pooled.
```go
resp, err := httpClient.Do(req)
if err != nil { return err }
defer resp.Body.Close()
```

### B12. `httptest` for handler tests
**Rule.** `httptest.NewRecorder` for unit-testing handlers; `httptest.NewServer` for full-stack integration.
**Reason.** No real network, no port conflicts, fast; tests serve as living docs.
```go
rr := httptest.NewRecorder()
handler.ServeHTTP(rr, httptest.NewRequest("GET", "/x", nil))
if rr.Code != 200 { t.Fatalf("got %d", rr.Code) }
```

### B13. `t.TempDir()` for filesystem tests
**Rule.** Use `t.TempDir()`; never `os.MkdirTemp` + manual cleanup in tests.
**Reason.** Auto-cleaned, unique per test, plays with parallel tests.
```go
dir := t.TempDir()
os.WriteFile(filepath.Join(dir, "x"), data, 0o600)
```

### B14. Build tags for opt-in suites
**Rule.** Gate slow/integration tests with `//go:build integration`; default `go test ./...` stays fast.
**Reason.** Devs run unit tests every save; integration runs in CI lane.
```go
//go:build integration

package users_test
```

### B15. `embed` for shipping assets
**Rule.** Use `//go:embed` + `embed.FS` to ship templates, migrations, static files in the binary.
**Reason.** Single artifact deploys; no path-relative-to-cwd surprises.
```go
//go:embed migrations/*.sql
var migrations embed.FS
```

### B16. Small interfaces, composed
**Rule.** Define interfaces with one or two methods; compose larger ones (`io.ReadCloser = Reader + Closer`).
**Reason.** Small interfaces are easy to satisfy and test; "the bigger the interface, the weaker the abstraction" (Pike).
```go
type Storer interface { Store(ctx context.Context, k string, v []byte) error }
```

### B17. Accept interfaces, return structs
**Rule.** Functions take interfaces (max flexibility) and return concrete types (max info).
**Reason.** Callers compose with what they have; receivers see the real shape. Source: Jack Lindamood, "Accept interfaces, return structs."
```go
// wrong
func NewService() Service { return svcImpl{} }
// right
func NewService(db Storer) *Service { return &Service{db: db} }
```

### B18. Define interfaces at the consumer
**Rule.** The package that *uses* the abstraction defines the interface; the provider just exposes a struct that satisfies it.
**Reason.** Reduces coupling — providers don't depend on a shared interface module.
```go
// users package consumes a Mailer; users defines the interface.
package users
type Mailer interface { Send(ctx context.Context, to, body string) error }
```

### B19. `sync.OnceFunc` / `OnceValue` / `OnceValues`
**Rule.** For lazy init returning a value, prefer the typed `sync.OnceValue` (1.21+) over manual `sync.Once` + variable.
**Reason.** No package-level mutable result; thread-safe by construction.
```go
var loadConfig = sync.OnceValue(func() *Config { return mustLoad() })
```

### B20. `context.AfterFunc` for cancellation hooks
**Rule.** Register cleanup on cancellation with `context.AfterFunc(ctx, fn)` (1.21+).
**Reason.** Cleaner than spawning a goroutine waiting on `<-ctx.Done()`.
```go
stop := context.AfterFunc(ctx, func() { conn.Close() })
defer stop()
```

### B21. `for range n` for counted loops
**Rule.** `for i := range 10` (1.22+) reads cleaner than `for i := 0; i < 10; i++` when index is the only state.
**Reason.** Less ceremony; same compile output.
```go
for i := range 10 { spawn(i) }
```

### B22. Loop variable scoping (1.22+)
**Rule.** Since 1.22, the `range` variable is per-iteration — safe to capture in goroutines without `v := v`.
**Reason.** Removes a long-standing footgun. Source: Go 1.22 release notes.
```go
for _, v := range items {
    go func() { use(v) }() // safe in 1.22+
}
```

### B23. `gofmt`/`goimports` on save
**Rule.** Format on save in editors; pre-commit hook in CI; never PR unformatted code.
**Reason.** Eliminates formatting bikeshedding; tooling assumes it.

### B24. `go vet` + `staticcheck` + `golangci-lint`
**Rule.** All three in CI; warnings fail the build.
**Reason.** `vet` catches obvious bugs (printf mismatches, lost cancel funcs); `staticcheck` covers idiom; `golangci-lint` aggregates.

### B25. `go mod tidy` in CI
**Rule.** CI runs `go mod tidy` and fails if `go.mod`/`go.sum` change. Commit `go.sum`.
**Reason.** Prevents drift and unverified modules.

### B26. Workspaces for multi-module repos
**Rule.** `go.work` (1.18+) for local cross-module development; commit `go.work.sum`, gitignore `go.work` if you want CI to not use it.
**Reason.** Avoids `replace` directives during development.
```
go work init ./api ./worker ./shared
```

---

## D — Anti-patterns / smells

### D1. Underscored package names
**Smell.** `package my_pkg` or `package userService`.
**Why bad.** Goes against `gofmt`-blessed style; readers have to check capitalization.
```go
// wrong
package user_service
// right
package users
```

### D2. Stutter in identifiers
**Smell.** `http.HTTPHandler`, `user.UserService`.
**Why bad.** The package name already says it; duplicates noise at every call site.
```go
// wrong
package http; type HTTPHandler struct{}
// right
package http; type Handler struct{}
```

### D3. Returning `interface{}` to "be flexible"
**Smell.** `func New() interface{}` so the caller can plug things in.
**Why bad.** Callers immediately type-assert; you've replaced static checking with runtime panic risk.
```go
// wrong
func New() any { return &server{} }
// right
func New() *Server { return &Server{} }
```

### D4. Five-method interfaces
**Smell.** `interface { A(); B(); C(); D(); E() }`.
**Why bad.** Hard to mock, hard to satisfy, signals an under-decomposed dependency. Split or rethink.
```go
// wrong
type Store interface { Get(); Put(); Del(); List(); Watch() }
// right: split per call site's needs
type Getter interface { Get(ctx context.Context, k string) ([]byte, error) }
```

### D5. `ctx` not first or stored in struct
**Smell.** `func Do(id string, ctx context.Context)`; `type S struct{ ctx context.Context }`.
**Why bad.** Breaks convention; context loses its scope.
```go
// wrong
func Do(id string, ctx context.Context) {}
// right
func Do(ctx context.Context, id string) {}
```

### D6. Goroutine without lifetime
**Smell.** `go work()` with no `WaitGroup`, no context, no channel.
**Why bad.** Leaks; holds references; never observable from caller.
```go
// wrong
go work()
// right
g.Go(func() error { return work(ctx) })
```

### D7. `time.Sleep` for waiting
**Smell.** `time.Sleep(retryInterval)` in production loops.
**Why bad.** Ignores cancellation, can't be interrupted on shutdown.
```go
// wrong
time.Sleep(5 * time.Second)
// right
select { case <-ctx.Done(): return ctx.Err(); case <-time.After(5*time.Second): }
```

### D8. Mutex copied by value
**Smell.** Passing a struct containing `sync.Mutex` by value, or `func(m sync.Mutex)`.
**Why bad.** Each copy locks a different mutex — no synchronization. `go vet` catches some.
```go
// wrong
func use(m sync.Mutex) {}
// right
func use(m *sync.Mutex) {}
```

### D9. Typed-nil error
**Smell.** Returning `*MyError` typed nil from a func declared `error`.
**Why bad.** Interface holds `(*MyError)(nil)` which is non-nil at the interface level — `if err != nil` lies.
```go
// wrong
func do() error { var e *MyError; return e }
// right
func do() error { return nil }
```

### D10. Ignoring err's content
**Smell.** `return err` with no context for ten layers of stack.
**Why bad.** "no such file" tells you nothing about which file or operation.
```go
// wrong
return err
// right
return fmt.Errorf("opening config %s: %w", path, err)
```

### D11. `panic` for control flow
**Smell.** Throwing panics across package boundaries to "skip" work.
**Why bad.** Goroutine-killing; not in the type system; only `recover` at handler boundary.
```go
// wrong
if !ok { panic("bad input") }
// right
if !ok { return ErrBadInput }
```

### D12. `init()` doing real work
**Smell.** `init()` opens DBs, reads config, makes network calls.
**Why bad.** Imports become side-effecting; tests can't avoid it; failures abort startup with little context.
```go
// wrong
func init() { db = mustConnect() }
// right
func New(ctx context.Context) (*Service, error) { /* explicit */ }
```

### D13. Global mutable state
**Smell.** `var Cache = map[string]X{}` at package level.
**Why bad.** Tests share state; concurrent tests race; can't run two instances.
```go
// wrong
var Counter int
// right
type Server struct{ counter atomic.Int64 }
```

### D14. `os.Exit` outside `main`
**Smell.** Library code calling `os.Exit(1)` on error.
**Why bad.** Bypasses defers; callers can't recover or test.

### D15. `fmt.Println` for logs
**Smell.** Using `fmt.Println` or `log.Println` in services.
**Why bad.** No level, no structure, no handler routing. Use `slog`.
```go
// wrong
fmt.Println("user logged in", id)
// right
logger.Info("login", "user_id", id)
```

### D16. `panic` on missing env at import
**Smell.** Package-level `var key = mustEnv("API_KEY")`.
**Why bad.** Fails at import, before main can log helpfully or skip in tests.
```go
// wrong
var key = mustEnv("API_KEY")
// right: read in New(...)
```

### D17. Redundant nil-and-len check
**Smell.** `if s == nil || len(s) == 0 {`.
**Why bad.** A nil slice already has `len == 0`. The first half is dead code.
```go
// wrong
if s == nil || len(s) == 0 {}
// right
if len(s) == 0 {}
```

### D18. Silent slice mutation
**Smell.** Functions that sort, dedupe, or rewrite a passed slice without saying so.
**Why bad.** Aliased slices everywhere mutate unexpectedly.
```go
// wrong
func Normalize(xs []string) []string { sort.Strings(xs); return xs }
// right: copy, or document
```

### D19. RWMutex cargo-culted
**Smell.** Using `sync.RWMutex` everywhere because "reads are common."
**Why bad.** RWMutex is heavier; without measurement, plain Mutex usually wins.

### D20. `%v` on `Stringer` types
**Smell.** `fmt.Sprintf("%v", t)` on a type with a `String()` method.
**Why bad.** `%s` is clearer and direct; `%v` invites accidental struct dumping.

### D21. `any` parameters
**Smell.** Functions with `any` (or `interface{}`) parameters and runtime type switches.
**Why bad.** Signals types should be sharper; reintroduces dynamic typing.

### D22. `map[string]any` for stable APIs
**Smell.** Marshaling/unmarshaling JSON via `map[string]any` for documented payloads.
**Why bad.** Loses type safety and self-documentation. Define the struct.
```go
// wrong
var m map[string]any
// right
type CreateUser struct{ Name, Email string }
```

### D23. Ignoring err with `_`
**Smell.** `_ = doIt()` with no comment.
**Why bad.** A future reader can't tell if you considered the error or forgot.
```go
// wrong
_ = file.Close()
// right
_ = file.Close() // best-effort: file is read-only, close errors are benign
```

### D24. `defer` in hot loops
**Smell.** `for _, x := range many { f, _ := os.Open(x); defer f.Close(); ... }`.
**Why bad.** Each `defer` allocates and executes only on function return — file descriptor pile-up. Extract a function or close manually.
```go
// right
for _, x := range many {
    func() { f, _ := os.Open(x); defer f.Close(); /* use */ }()
}
```

### D25. Receiver type inconsistency
**Smell.** Half the methods use `(s Server)`, half use `(s *Server)`.
**Why bad.** Confuses callers; method set differs; copying-vs-pointing intent unclear. Pick one (usually pointer if any method needs it).

### D26. Panicking `String()`
**Smell.** `func (x X) String() string { ...; panic(...) }`.
**Why bad.** Used in `fmt`, `slog`, debuggers — panic surprises debugging tools.

### D27. `time.Sleep` in tests waiting for goroutines
**Smell.** `go work(); time.Sleep(100 * time.Millisecond); assert(...)`.
**Why bad.** Flaky on CI; slow when not. Synchronize with channels, `WaitGroup`, or `errgroup`.
```go
// wrong
go work(); time.Sleep(100 * time.Millisecond)
// right
done := make(chan struct{}); go func(){ work(); close(done) }(); <-done
```

### D28. Unprotected goroutines in handlers
**Smell.** `go func() { /* might panic */ }()` inside a handler with no `recover`.
**Why bad.** Panic in goroutine kills the whole server.
```go
// right
go func() {
    defer func() { if r := recover(); r != nil { logger.Error("panic", "v", r) } }()
    work()
}()
```

### D29. Reading `r.Body` without limits
**Smell.** `io.ReadAll(r.Body)` on user-supplied requests.
**Why bad.** Memory bomb; one slow client can OOM the server. Use `http.MaxBytesReader`.
```go
// right
r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
```

### D30. Swallowing `ctx.Err()` in loops
**Smell.** Long loop ignores `<-ctx.Done()`.
**Why bad.** Cancellation never takes effect; goroutine outlives caller.
```go
for _, x := range items {
    if err := ctx.Err(); err != nil { return err }
    process(x)
}
```

### D31. `recover` to "log and continue"
**Smell.** Wrapping every function in recover-and-resume.
**Why bad.** Hides bugs; leaves invariants broken; only recover at trust boundaries (HTTP handlers, top of goroutines).

### D32. `pkg/` directory in apps
**Smell.** Putting application code under `pkg/` in a service repo.
**Why bad.** `pkg/` signals "public library API" — for a service, use `internal/`. Source: ongoing community debate; see Russ Cox & Dave Cheney commentary, but consensus for *applications* favors `internal/`.
```
// service repo: prefer internal/
internal/users/
internal/billing/
```

### D33. Empty `t.Errorf` formatting for diffs
**Smell.** `t.Errorf("got %v want %v", got, want)` for big structs.
**Why bad.** Failure prints two unreadable blobs side by side. `cmp.Diff` shows the delta.
```go
// right
if diff := cmp.Diff(want, got); diff != "" {
    t.Errorf("mismatch (-want +got):\n%s", diff)
}
```

### D34. `t.Parallel` on shared global state
**Smell.** Adding `t.Parallel()` to tests that touch package-level vars or the filesystem at fixed paths.
**Why bad.** Races, flakes. Either remove the global or skip parallelism.

### D35. Stale `vendor/` directory
**Smell.** `vendor/` committed but never refreshed; `go.mod` drifts.
**Why bad.** Builds use stale code; security patches missed. Either commit to vendoring (refresh in CI) or drop it.

### D36. Module path mismatch
**Smell.** `module example.com/foo` but repo lives at `github.com/me/foo`.
**Why bad.** `go get github.com/me/foo` fails for consumers.

---

## Sources

- **Effective Go** (`go.dev/doc/effective_go`) — naming, formatting, errors, concurrency, interfaces.
- **Go Code Review Comments** (`go.dev/wiki/CodeReviewComments`) — receiver names, error strings, package names, doc comments.
- **Uber Go Style Guide** (`github.com/uber-go/guide`) — error wrapping, mutex placement, slice initialization, `time` handling.
- **Go Proverbs** — Pike: "Don't communicate by sharing memory; share memory by communicating", "The bigger the interface, the weaker the abstraction", "A little copying is better than a little dependency".
- **Go release notes 1.21–1.24** — `slog`, `slices`, `maps`, `cmp`, `sync.OnceValue`, `context.AfterFunc`, `context.WithCancelCause`, method-aware `ServeMux`, loop variable scoping, `for range n`.
- **Dave Cheney** — error handling, `errors.Is`/`As` patterns, "Don't just check errors, handle them gracefully", package design.
- **Mat Ryer** — "How I write HTTP services in Go" series; `http.Handler` patterns; server struct.
- **Carlana Johnson** — "When To Use Generics" — generics where the type parameter genuinely abstracts behavior.
- **Jack Lindamood** — "Accept interfaces, return structs"; consumer-side interface definition.
- **`golang.org/x/sync/errgroup`** docs — concurrent fan-out with bounded concurrency.
- **`go vet`, `staticcheck`, `golangci-lint`** — tooling baseline; treat warnings as errors.
