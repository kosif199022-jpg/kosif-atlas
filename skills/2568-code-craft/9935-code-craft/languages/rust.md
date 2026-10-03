# Rust — code-craft reference

~50 rules across three buckets. Sources: *The Rust Programming Language* (2024 ed.), Rust API Guidelines, *Effective Rust* (Drysdale), *Rust for Rustaceans* (Gjengset), Clippy `pedantic`/`nursery`/`cargo`, `tracing` docs, Tokio shared-state docs, Niko Matsakis on async mutexes, *without.boats* on `Pin`/async, This Week in Rust 2024–2025. Stable assumed: 1.65+ (`let-else`), 1.75+ (`async fn` in traits), Rust 2024 edition with let-chains stable in 1.88.

Loaded by `code-craft` when the user asks about Rust or pastes Rust code for review. Framework-specific patterns (Axum, Tokio runtime tuning, Actix) live under `frameworks/`.

---

## A — Tactical (day-to-day patterns)

### A1. Take `&str`, not `&String`
**Rule.** Read-only string params take `&str`.
**Reason.** Accepts string literals, `String`, and slices via deref; `&String` forces callers to own a `String`.
```rust
// wrong
fn greet(name: &String) { println!("hi {name}"); }
// right
fn greet(name: &str) { println!("hi {name}"); }
```

### A2. Take `&[T]`, not `&Vec<T>`
**Rule.** Slice params take `&[T]`.
**Reason.** Accepts `Vec<T>`, arrays, other slices. Clippy `ptr_arg`.
```rust
// wrong
fn sum(xs: &Vec<i32>) -> i32 { xs.iter().sum() }
// right
fn sum(xs: &[i32]) -> i32 { xs.iter().sum() }
```

### A3. Accept borrowed, return owned
**Rule.** Default to `&str`/`&[T]` in, `String`/`Vec<T>` out; reach for `Cow<'_, str>` only when both shapes are real.
**Reason.** Borrowed inputs maximize call-site flexibility; owned returns avoid lifetime entanglement.
```rust
fn shout(s: &str) -> String { s.to_uppercase() }
```

### A4. Elide lifetimes when you can
**Rule.** Don't name lifetimes the elision rules already handle.
**Reason.** Named lifetimes add noise without changing semantics in the elidable cases.
```rust
// wrong
fn first<'a>(s: &'a str) -> &'a str { &s[..1] }
// right
fn first(s: &str) -> &str { &s[..1] }
```

### A5. Don't fight the borrow checker with clones
**Rule.** Before reaching for `.clone()`, restructure scopes, return owned data, or use `Rc`/`Arc` if shared ownership is the real model.
**Reason.** Spurious clones hide design problems and tank performance.
```rust
// wrong
let copy = vec.clone(); for _ in &copy { use_with(&vec); }
// right: scope the immutable borrow
{ let view = &vec; for _ in view { /* … */ } }
```

### A6. `Result<T, E>` over panics in libraries
**Rule.** Library functions return `Result` for any plausibly-recoverable failure; panic only on broken invariants.
**Reason.** Panics aren't in the type system; `panic = "abort"` makes them fatal.
```rust
// wrong
fn parse(s: &str) -> u32 { s.parse().unwrap() }
// right
fn parse(s: &str) -> Result<u32, std::num::ParseIntError> { s.parse() }
```

### A7. `?` for error propagation
**Rule.** Use `?` to bubble errors; avoid manual `match err => return Err(err)`.
**Reason.** `?` calls `From::from` automatically and reads as one character.
```rust
fn read_n(p: &Path) -> io::Result<usize> {
    let s = std::fs::read_to_string(p)?;
    Ok(s.len())
}
```

### A8. Pick the right divergence macro
**Rule.** `panic!` for caller-broken invariants; `unreachable!` for branches the type system can't prove dead; `todo!` while drafting; `unimplemented!` for intentionally-unsupported trait methods.
**Reason.** Each carries different intent in review and stack traces.
```rust
match shape { Shape::Square => 4, Shape::Triangle => 3,
    _ => unreachable!("variants exhausted at type level") }
```

### A9. Exhaustive matches; use `_` deliberately
**Rule.** Match every variant; use `_` only when you actively don't care about future variants.
**Reason.** Exhaustive arms turn enum additions into compile errors.
```rust
match status { Ok => 0, Pending => 1, Failed => 2 }
```

### A10. `if let` chains in Rust 2024
**Rule.** Chain `if let` and bool tests with `&&` (Rust 2024, stable in 1.88) instead of nesting.
**Reason.** Reads top-to-bottom; same scoping as a single `if let`.
```rust
if let Some(user) = lookup(id) && user.is_active && let Ok(quota) = user.quota() {
    serve(user, quota);
}
```

### A11. `let-else` for early returns
**Rule.** Extract-or-bail with `let Some(x) = opt else { return ...; };`.
**Reason.** Happy-path binding stays in outer scope; the diverging arm reads as a guard clause.
```rust
let Some(user) = lookup(id) else { return Err(NotFound); };
serve(user);
```

### A12. Iterators over indexed loops
**Rule.** Prefer `.iter()` / `.map()` / `.filter()` / `.fold()` over `for i in 0..v.len()`.
**Reason.** Skips bounds checks, composes, reads as a transformation. Clippy `needless_range_loop`.
```rust
// wrong
let mut out = Vec::new();
for i in 0..xs.len() { out.push(xs[i] * 2); }
// right
let out: Vec<_> = xs.iter().map(|x| x * 2).collect();
```

### A13. Annotate `collect()`
**Rule.** Tell `collect()` the target type via binding (`let v: Vec<_> = ...`) or turbofish (`.collect::<Vec<_>>()`).
**Reason.** Inference often fails or picks the wrong container.
```rust
let v: Vec<i32> = (0..5).collect();
let s = (0..5).collect::<HashSet<_>>();
```

### A14. `Cow<'_, str>` for either-borrowed-or-owned
**Rule.** Return `Cow<'_, str>` when the function sometimes mutates and sometimes returns input untouched.
**Reason.** Skips allocation in the identity case while still expressing the owned-modified path.
```rust
fn normalize(s: &str) -> Cow<'_, str> {
    if s.contains(' ') { Cow::Owned(s.replace(' ', "_")) } else { Cow::Borrowed(s) }
}
```

### A15. `usize` for indices and lengths
**Rule.** Use `usize` for collection indices/sizes; reserve `u32`/`u64` for protocol/wire types.
**Reason.** Indexing requires `usize`; mixing forces `as` casts that can truncate on 32-bit targets.
```rust
fn at(v: &[u8], i: usize) -> Option<&u8> { v.get(i) }
```

### A16. `NonZeroU32` for non-zero invariants
**Rule.** When a value is guaranteed non-zero, use `NonZeroU32`/`NonZeroUsize`.
**Reason.** Niche optimization (`Option<NonZeroU32>` is one word) and prevents silent zero bugs.
```rust
fn page_size(n: NonZeroU32) -> usize { n.get() as usize }
```

### A17. `pub(crate)` and `pub(super)` for internals
**Rule.** Default private; widen to `pub(crate)` for cross-module-but-internal items; use `pub` only at the API boundary.
**Reason.** Keeps the public surface small and refactor-friendly.
```rust
pub(crate) fn helper() {}
```

### A18. Conventional naming
**Rule.** `snake_case` fns/vars/modules, `CamelCase` types/traits/enum-variants, `SCREAMING_SNAKE_CASE` for `const`/`static`.
**Reason.** API Guidelines and rustc lints (`non_snake_case`, `non_camel_case_types`) enforce it.
```rust
const MAX_RETRIES: u32 = 3;
struct UserSession { /* … */ }
fn open_session() {}
```

### A19. Doc comments with runnable examples
**Rule.** Every public item gets `///` docs with an example fenced in ```` ```rust ```` and run by `cargo test --doc`.
**Reason.** Doc-tests stay in sync with the API; failing examples surface in CI.
```rust
/// Doubles the input.
///
/// ```
/// assert_eq!(mycrate::double(2), 4);
/// ```
pub fn double(x: i32) -> i32 { x * 2 }
```

### A20. Test layout: unit in `#[cfg(test)]`, integration in `tests/`
**Rule.** Unit tests live in `mod tests { ... }` next to the code; integration tests live in `tests/*.rs`. Use `#[should_panic]` to test assertions.
**Reason.** Unit tests can reach `pub(crate)` internals; integration tests verify the public API.
```rust
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn doubles() { assert_eq!(double(2), 4); }
    #[test] #[should_panic] fn fails() { panic!("expected"); }
}
```

---

## B — Modern idioms (2021/2024 editions, recent stable)

### B1. Newtype for nominal typing
**Rule.** Wrap primitive/foreign types in a tuple struct when domain meaning matters.
**Reason.** `UserId(Uuid)` and `OrderId(Uuid)` aren't interchangeable at the type level.
```rust
pub struct UserId(pub Uuid);
pub struct OrderId(pub Uuid);
fn fetch_user(id: UserId) -> User { /* … */ }
```

### B2. Typed builders for many-optional-field constructors
**Rule.** With more than ~3 optional fields, use a builder; reach for `bon` (function/method-aware, typestate) or `derive_builder`.
**Reason.** `bon`'s typestate prevents missing-required-field bugs at compile time.
*Source:* `bon` v2 docs.
```rust
#[derive(bon::Builder)]
struct HttpRequest { url: String, #[builder(default)] timeout_ms: u64 }
let r = HttpRequest::builder().url("/x".into()).build();
```

### B3. Implement `From`, get `Into` free
**Rule.** Implement `From<Inner> for Outer` (never `Into`); use `TryFrom`/`TryInto` for fallible conversions.
**Reason.** Blanket impl gives `Into` automatically; the reverse direction is a coherence violation. API Guidelines `C-CONV`.
```rust
impl From<u32> for UserId { fn from(n: u32) -> Self { UserId(n.into()) } }
let id: UserId = 42u32.into();
```

### B4. `impl Trait` arg vs return; static vs dynamic dispatch
**Rule.** `impl Trait` in args = monomorphized; in return = "some unnamed concrete type". Use `Box<dyn Trait>` only for heterogeneous values or true trait objects.
**Reason.** `impl Trait` is zero-cost; `dyn` adds vtable indirection but allows mixed types in one collection.
```rust
fn sum(it: impl Iterator<Item = i32>) -> i32 { it.sum() }
fn make() -> impl Iterator<Item = i32> { 0..10 }
fn boxed() -> Box<dyn Iterator<Item = i32>> { Box::new(0..10) }
```

### B5. `&dyn Trait` when you don't own the value
**Rule.** Pass `&dyn Trait` for object-safe traits when the value lives elsewhere; use `Box<dyn Trait>` only for owned trait objects.
**Reason.** Avoids forcing a heap allocation just to dispatch dynamically.
```rust
fn render(w: &mut dyn std::io::Write, s: &str) -> io::Result<()> { w.write_all(s.as_bytes()) }
```

### B6. Sealed traits for closed-set public APIs
**Rule.** When a public trait must only be implemented by your crate, seal it via a private supertrait users can't name.
**Reason.** Lets you add methods in semver-minor releases without breaking downstream impls.
*Source:* `rust-lang.github.io/api-guidelines/future-proofing.html`.
```rust
mod private { pub trait Sealed {} }
pub trait MyKind: private::Sealed { fn kind(&self) -> &str; }
impl private::Sealed for Foo {}
impl MyKind for Foo { fn kind(&self) -> &str { "foo" } }
```

### B7. Crate-local `Result` alias
**Rule.** `pub type Result<T> = std::result::Result<T, MyError>;` when one error type dominates a module/crate.
**Reason.** Cuts signature noise; idiomatic in `std::io`, `std::fmt`, `serde_json`. Skip if multiple error types coexist.
*Source:* API Guidelines `C-GOOD-ERR`.
```rust
pub type Result<T> = std::result::Result<T, MyError>;
fn load(p: &Path) -> Result<Config> { /* … */ }
```

### B8. `thiserror` for library error enums
**Rule.** Library errors are enums derived with `thiserror`, using `#[from]` for transparent conversions and `#[source]` to chain.
**Reason.** Typed enum the caller can match on, with no boilerplate.
*Source:* dtolnay's split — `thiserror` for libraries, `anyhow` for binaries.
```rust
#[derive(thiserror::Error, Debug)]
pub enum LoadError {
    #[error("io")] Io(#[from] std::io::Error),
    #[error("bad config: {0}")] Bad(String),
}
```

### B9. `anyhow` + `Context` for application code
**Rule.** Binaries return `anyhow::Result<T>`; chain context with `.context("loading {path}")`. Don't use `anyhow` in library public APIs.
**Reason.** `main` doesn't need a typed error; it needs human-readable context for the operator.
*Source:* `anyhow` README.
```rust
use anyhow::{Context, Result};
fn run() -> Result<()> {
    std::fs::read("cfg.toml").context("reading cfg.toml")?;
    Ok(())
}
```

### B10. `tracing` over `log`; `#[instrument]` async fns
**Rule.** Use `tracing` for new code; structured fields beat `format!`. Annotate async fns with `#[tracing::instrument(skip(big_arg))]`.
**Reason.** `tracing` has spans (begin/end, nesting, async-aware) and structured fields `log` lacks; spans correlate work across `.await`.
*Source:* `tracing` crate docs.
```rust
#[tracing::instrument(skip(db))]
async fn fetch_user(db: &Db, id: UserId) -> Result<User> { /* … */ }
```

### B11. `Send + 'static` for spawned futures
**Rule.** Futures handed to `tokio::spawn` (or any executor) are `Send + 'static`; shared data is `Send + Sync`.
**Reason.** Tasks move between worker threads, so non-`Send` state can't cross `.await`. `'static` bans borrowed caller-frame refs.
```rust
let handle = tokio::spawn(async move { do_work(arc_state).await });
```

### B12. `Arc<T>` shared; mutex sparingly
**Rule.** `Arc<T>` for read-only sharing; `Arc<Mutex<T>>` only when shared mutation is required, and prefer message-passing or `RwLock` for read-heavy.
**Reason.** Mutex contention serializes async tasks; channels and actors scale better.
```rust
let state = Arc::new(AppState::new());
let s2 = state.clone();
tokio::spawn(async move { use_state(s2).await });
```

### B13. `std::sync::Mutex` is fine in async — usually
**Rule.** Use `std::sync::Mutex` for short, sync critical sections in async code; switch to `tokio::sync::Mutex` only when you must hold the guard across an `.await`.
**Reason.** The async mutex is slower and only buys awaiting-while-locked, which is rarely actually required.
*Source:* Niko Matsakis / Tokio shared-state docs.
```rust
let mut g = state.lock().unwrap(); g.counter += 1; drop(g);
fetch().await;
```

### B14. `#[non_exhaustive]` on public enums and config structs
**Rule.** Mark public error enums and option structs `#[non_exhaustive]` so adding variants/fields stays semver-compatible.
**Reason.** Forces downstream `match`es to include `_ =>` and prevents struct-literal construction across crates.
*Source:* API Guidelines `C-FUTURE-PROOFING`.
```rust
#[non_exhaustive]
pub enum LoadError { Io(io::Error), Parse(String) }
```

### B15. `#[must_use]` on result-returning items
**Rule.** Annotate `#[must_use]` on functions/types whose return value indicates work done (results, builders, futures).
**Reason.** Compiler warns when callers drop the value, catching ignored errors and abandoned builders.
```rust
#[must_use = "this Result may be an error"]
pub fn save(&self) -> Result<()> { /* … */ }
```

### B16. `serde` derives + container attributes
**Rule.** Use `#[derive(Serialize, Deserialize)]` plus `#[serde(rename_all = "camelCase")]`, `#[serde(skip_serializing_if = "Option::is_none")]`, `#[serde(default)]`.
**Reason.** Encodes wire conventions declaratively while keeping Rust naming idiomatic.
```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct User { user_id: u64, #[serde(skip_serializing_if = "Option::is_none")] email: Option<String> }
```

### B17. `async fn` over hand-rolled `Future`
**Rule.** Write `async fn` (or `-> impl Future`); only hand-roll `Future` impls for pinning tricks the compiler can't generate.
**Reason.** The desugaring is `Pin`-safe and tracks `Send`/`Sync` automatically.
*Source:* without.boats on `Pin`/async desugaring.
```rust
async fn fetch(url: &str) -> Result<Bytes> {
    reqwest::get(url).await?.bytes().await.map_err(Into::into)
}
```

### B18. Workspace features and `default-features = false`
**Rule.** Opt out of unwanted defaults: `tokio = { version = "1", default-features = false, features = ["rt"] }`. Features unify across the workspace.
**Reason.** A single dep pulling `tokio = ["full"]` enables everything for every crate in the build.
```toml
[dependencies]
serde = { version = "1", default-features = false, features = ["derive"] }
```

### B19. Const generics for fixed-size arrays
**Rule.** Parameterize over array length with `<const N: usize>` instead of `&[T]` when size is part of the contract.
**Reason.** Keeps stack allocation, proves sizes statically, removes runtime length checks.
```rust
fn dot<const N: usize>(a: [f32; N], b: [f32; N]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}
```

### B20. Clippy `-D warnings` baseline
**Rule.** CI runs `cargo clippy --all-targets --all-features -- -D warnings`; opt into `pedantic`/`nursery` selectively.
**Reason.** Catches `&Vec<T>` args, dead lifetimes, range-loops, and most smells in this file.
```toml
[lints.clippy]
pedantic = { level = "warn", priority = -1 }
```

### B21. Pin + `Box::pin` for trait-object futures
**Rule.** When returning a `dyn Future` from a function, pin-box it: `Box::pin(async move { ... })`.
**Reason.** `Future` requires pinning; this is the standard idiom when an `async fn` body won't fit the API shape.
```rust
fn boxed_fut() -> Pin<Box<dyn Future<Output = i32> + Send>> {
    Box::pin(async { 42 })
}
```

---

## D — Anti-patterns / smells

### D1. `.unwrap()` / `.expect()` in production paths
**Smell.** Calling `.unwrap()` on `Result`/`Option` outside tests, examples, or proven-infallible cases.
**Why bad.** Turns recoverable errors into crashes. If you really mean it, use `.expect("invariant: ...")` with justification, or `let-else`.
```rust
// wrong
let cfg = std::fs::read_to_string("c.toml").unwrap();
// right
let cfg = std::fs::read_to_string("c.toml").context("reading c.toml")?;
```

### D2. `panic!` from a library
**Smell.** A library function panicking on bad-but-recoverable input.
**Why bad.** Callers can't catch it through types. Return `Result`.
```rust
// wrong
pub fn parse(s: &str) -> Cfg { Cfg::from_str(s).expect("bad cfg") }
// right
pub fn parse(s: &str) -> Result<Cfg, ParseError> { Cfg::from_str(s) }
```

### D3. Cloning to silence the borrow checker
**Smell.** `x.clone()` sprinkled to dodge borrow errors.
**Why bad.** Doubles memory traffic; usually means the call graph wants a different ownership model.
```rust
// wrong
fn rename(items: Vec<String>) -> Vec<String> { items.clone().into_iter().map(...).collect() }
// right: items is already owned
fn rename(items: Vec<String>) -> Vec<String> { items.into_iter().map(...).collect() }
```

### D4. Returning `&String`
**Smell.** `fn name(&self) -> &String`.
**Why bad.** Leaks storage type; `&str` is strictly more general and equally cheap.
```rust
// wrong
fn name(&self) -> &String { &self.name }
// right
fn name(&self) -> &str { &self.name }
```

### D5. Index-loop `for i in 0..v.len()`
**Smell.** Manual index iteration when an iterator works.
**Why bad.** Bounds-check noise, easy off-by-one, obscures the transformation. Clippy `needless_range_loop`.
```rust
// wrong
for i in 0..xs.len() { total += xs[i]; }
// right
let total: i32 = xs.iter().sum();
```

### D6. `match` on `bool`
**Smell.** `match b { true => …, false => … }`.
**Why bad.** `if`/`else` is the canonical form. Clippy `match_bool`.
```rust
// wrong
match ready { true => go(), false => wait() }
// right
if ready { go() } else { wait() }
```

### D7. Nested `Result<Result<T, E1>, E2>`
**Smell.** Stacking `Result`s instead of unifying via `From`.
**Why bad.** Forces double-`?` and unreadable signatures. One enum with `#[from]` impls flattens it.
```rust
// wrong
fn run() -> Result<Result<u32, ParseError>, IoError> { /* … */ }
// right
fn run() -> Result<u32, AppError> { /* … */ } // From<IoError>, From<ParseError>
```

### D8. `Box<dyn Trait>` when generics fit
**Smell.** Reaching for `Box<dyn Trait>` for a single-call-site abstraction the compiler could monomorphize.
**Why bad.** Heap allocation and vtable indirection for no polymorphism gain. Use `impl Trait` or `<T: Trait>`.
```rust
// wrong
fn run(cb: Box<dyn Fn(i32) -> i32>) -> i32 { cb(2) }
// right
fn run(cb: impl Fn(i32) -> i32) -> i32 { cb(2) }
```

### D9. `Arc<Mutex<T>>` as the default shared-state shape
**Smell.** Reflexively wrapping every shared resource in `Arc<Mutex<_>>`.
**Why bad.** Serializes contention; an actor (mpsc channel) or `Arc<RwLock<T>>` (read-heavy) is often correct. Mutex is last resort.
```rust
let (tx, mut rx) = mpsc::channel(100);
tokio::spawn(async move { while let Some(cmd) = rx.recv().await { state.handle(cmd) } });
```

### D10. Awaiting in a hot loop instead of `join_all`
**Smell.** `for x in inputs { result.push(fetch(x).await); }` when fetches are independent.
**Why bad.** Serializes work that could run concurrently. Use `futures::future::try_join_all` or `JoinSet`.
```rust
// wrong
for u in urls { results.push(fetch(u).await?); }
// right
let results: Vec<_> = futures::future::try_join_all(urls.into_iter().map(fetch)).await?;
```

### D11. Holding a `MutexGuard` across `.await`
**Smell.** Locking and then awaiting while still holding the guard.
**Why bad.** With `std::sync::Mutex` it makes the future `!Send` (compile error on `tokio::spawn`); any mutex risks deadlock if another task on the same thread needs the lock. Lock, mutate, drop, then await.
*Source:* Tokio shared-state tutorial; Niko Matsakis async-mutex post.
```rust
// wrong
let mut g = m.lock().unwrap(); g.x += 1; fetch().await; // !Send
// right
{ let mut g = m.lock().unwrap(); g.x += 1; }
fetch().await;
```

### D12. `.collect::<Vec<_>>()` mid-chain
**Smell.** Eagerly collecting into `Vec` only to immediately iterate it again.
**Why bad.** Allocates and walks twice. Keep iterators lazy until the final consumer.
```rust
// wrong
let v: Vec<_> = xs.iter().map(f).collect();
let n = v.iter().filter(|x| x.ok()).count();
// right
let n = xs.iter().map(f).filter(|x| x.ok()).count();
```

### D13. Manual `Display` / `Debug` when derive works
**Smell.** Hand-writing `impl Debug` that prints field-by-field.
**Why bad.** `#[derive(Debug)]` does it correctly and stays in sync. Hand-roll only when format genuinely differs.
```rust
#[derive(Debug)]
struct User { id: u64, name: String }
```

### D14. `String` when `&str` was fine
**Smell.** Allocating a `String` when borrowing would do; mixing `String::from("lit")` and `"lit".to_string()` arbitrarily.
**Why bad.** Wasted heap allocations per call. The two `String`-construction forms are equivalent — pick one for consistency.
```rust
// wrong
fn greet(name: String) { println!("hi {name}"); }
// right
fn greet(name: &str) { println!("hi {name}"); }
```

### D15. `unsafe` without `// SAFETY:`
**Smell.** An `unsafe { ... }` block with no comment justifying invariants.
**Why bad.** Reviewers can't verify correctness. Clippy `undocumented_unsafe_blocks` enforces this.
```rust
// SAFETY: ptr came from Box::into_raw above, is non-null and unique here.
unsafe { Box::from_raw(ptr) };
```

### D16. `as` casts that may truncate
**Smell.** `let n = big_u64 as u32;`
**Why bad.** Silent wraparound. Use `try_into` (or document with `// truncation:`). Clippy `cast_possible_truncation`.
```rust
// wrong
let n = total as u32;
// right
let n = u32::try_from(total).map_err(|_| Overflow)?;
```

### D17. `f64` for money
**Smell.** Storing currency in `f64`/`f32`.
**Why bad.** Binary floats can't represent `0.1` exactly; rounding errors accumulate. Use `rust_decimal::Decimal` or integer minor units.
```rust
// wrong
let price: f64 = 0.1 + 0.2; // 0.30000000000000004
// right
use rust_decimal::Decimal; let price = Decimal::new(30, 2);
```

### D18. Returning `Vec<T>` when `impl Iterator` composes
**Smell.** Collecting into `Vec<T>` inside a helper callers will iterate again.
**Why bad.** Forces an allocation; `impl Iterator<Item = T>` lets callers chain, take, or short-circuit lazily.
```rust
// wrong
fn ids(users: &[User]) -> Vec<u64> { users.iter().map(|u| u.id).collect() }
// right
fn ids(users: &[User]) -> impl Iterator<Item = u64> + '_ { users.iter().map(|u| u.id) }
```

### D19. `Mutex<()>` as a memory barrier
**Smell.** Empty mutex used purely to serialize unrelated work.
**Why bad.** Misuses sync primitives. Use atomics, `OnceLock`/`OnceCell`, or a real channel.
```rust
// wrong
static GUARD: Mutex<()> = Mutex::new(());
// right
static INIT: OnceLock<Resource> = OnceLock::new();
```

### D20. Raw pointers in safe code
**Smell.** Reaching for `*const T`/`*mut T` when references work.
**Why bad.** Drops borrow checking and aliasing guarantees for no benefit. Raw pointers belong in FFI / justified `unsafe` interiors.
```rust
// wrong
fn first(p: *const u8) -> u8 { unsafe { *p } }
// right
fn first(s: &[u8]) -> u8 { s[0] }
```

### D21. Copying large structs by value
**Smell.** Functions take `BigConfig` by value just to read a field.
**Why bad.** Forces a move/copy of every field. Take `&BigConfig`; use owned only when consuming or storing.
```rust
// wrong
fn host(c: BigConfig) -> String { c.host }
// right
fn host(c: &BigConfig) -> &str { &c.host }
```

### D22. `block_on` inside async code
**Smell.** Calling `Runtime::block_on` (or `Handle::block_on`) from code already on a Tokio worker.
**Why bad.** Deadlocks the worker. Use `.await`; for sync bridges use `tokio::task::spawn_blocking`.
```rust
// wrong
async fn outer() { rt.block_on(async { /* … */ }); }
// right
async fn outer() { inner().await; }
```

### D23. Re-implementing parsers `serde` or `nom` would handle
**Smell.** Hand-rolled `from_str` for structured config.
**Why bad.** You'll re-derive escape rules, error positions, and unicode pitfalls poorly. `serde` for declarative formats; `nom`/`winnow`/`pest` for DSLs.
```rust
#[derive(Deserialize)] struct Cfg { host: String, port: u16 }
let cfg: Cfg = toml::from_str(&text)?;
```

### D24. `build.rs` doing network I/O
**Smell.** Build script that fetches URLs or contacts arbitrary hosts.
**Why bad.** Breaks reproducible builds, fails offline, surprises supply-chain reviewers. Vendor inputs or generate at release time.
```rust
// wrong: build.rs hits crates.io / vendor index
// right: vendor the artifact into the repo or generate during a release step
```

### D25. Public API leaking internal types
**Smell.** `pub fn parse() -> InternalAst` where `InternalAst` is meant to be internal.
**Why bad.** Couples downstream code to internal representation; you can't refactor without semver-major.
```rust
// wrong
pub fn parse(s: &str) -> InternalAst { /* … */ }
// right
pub struct Ast(InternalAst);
pub fn parse(s: &str) -> Ast { Ast(/* … */) }
```

### D26. Boolean-fest signatures
**Smell.** `fn render(x: T, sorted: bool, dedupe: bool, escape: bool)`.
**Why bad.** Call sites become `render(t, true, false, true)` — unreadable, breaks on argument addition. Use an options struct.
```rust
// wrong
render(items, true, false, true);
// right
render(items, RenderOpts { sorted: true, dedupe: false, escape: true });
```

---

## Sources

- **The Rust Programming Language** (2024 edition) — ownership, lifetimes, error handling, `let-else`, `if let` chains.
- **Rust API Guidelines** (`rust-lang.github.io/api-guidelines`) — naming, `C-CONV`, `C-FUTURE-PROOFING`, `C-GOOD-ERR`, sealed traits.
- **Effective Rust** — Drysdale (`From`/`Into`, error types, traits as interfaces, `unsafe` discipline).
- **Rust for Rustaceans** — Gjengset (newtype, sealed traits, async/`Send` bounds, workspace feature unification).
- **Clippy lint groups** — `pedantic`, `nursery`, `cargo`: `ptr_arg`, `needless_range_loop`, `match_bool`, `cast_possible_truncation`, `undocumented_unsafe_blocks`.
- **`tracing` crate docs** — spans, `#[instrument]`, structured fields vs `log`-style messages.
- **Tokio shared-state tutorial** + **Niko Matsakis on async mutexes** — `std::sync::Mutex` is fine in async; never hold a guard across `.await`.
- **without.boats** — `Pin`, async desugaring, why hand-rolled `Future`s are usually wrong.
- **Rust 1.88 release notes** — let-chains stabilized in the 2024 edition.
- **`anyhow` / `thiserror`** (dtolnay) — the split: `thiserror` for libraries, `anyhow` for binaries.
- **`bon` crate** — modern typestate builder; superset of `derive_builder`'s use cases.
- **This Week in Rust 2024–2025** — ecosystem trend signals.
