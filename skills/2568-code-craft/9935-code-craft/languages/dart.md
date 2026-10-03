# Dart 3 — code-craft reference

~55 rules across three buckets. Dart 3.x with sound null safety assumed; records, patterns, sealed classes, class modifiers (3.0+), extension types (3.3+), `Isolate.run` (2.19+) are baseline.

Sources: [dart.dev/docs](https://dart.dev/), [Effective Dart](https://dart.dev/effective-dart), [Dart 3 announcement](https://medium.com/dartlang/announcing-dart-3-53f065a10635), [class modifiers spec](https://dart.dev/language/class-modifiers), [patterns docs](https://dart.dev/language/patterns), [extension types](https://dart.dev/language/extension-types), Remi Rousselet on Riverpod/freezed, Andrea Bizzotto's Code With Andrea (2024–2025), `package:lints`, `package:freezed`, `package:test`.

Loaded by `code-craft` when the user asks about Dart or pastes Dart code. Flutter-specific patterns live in `frameworks/flutter.md` and reference these rules.

---

## A — Tactical (day-to-day patterns)

### A1. snake_case files, camelCase symbols
**Rule.** Files and folders are `snake_case.dart`; classes/typedefs/enums are `UpperCamelCase`; variables/functions/parameters are `lowerCamelCase`; libraries and import prefixes are `lowercase_with_underscores`.
**Reason.** Effective Dart's identifier rules; analyzer lints (`file_names`, `camel_case_types`) flag deviations and `dart format` won't save you.
```dart
// wrong: UserProfile.dart, user_name (var), userprofile (class)
// right
// file: user_profile.dart
class UserProfile { final String userName; UserProfile(this.userName); }
```

### A2. SCREAMING_SNAKE only for true constants
**Rule.** Use `lowerCamelCase` even for `const`/`static const`. Reserve `SCREAMING_SNAKE_CASE` for nothing in idiomatic Dart.
**Reason.** Effective Dart explicitly prefers camelCase for constants; `constant_identifier_names` lint enforces it.
```dart
// wrong
const MAX_RETRIES = 3;
// right
const maxRetries = 3;
```

### A3. lib/, test/, bin/, example/
**Rule.** Public API in `lib/<package>.dart` re-exporting from `lib/src/`; private code under `lib/src/`; CLI entry points in `bin/`; tests in `test/` mirroring source layout.
**Reason.** Pub conventions: anything outside `lib/src/` is importable by consumers; `lib/src/` is "private by convention" enforced by `implementation_imports` lint.
```text
my_pkg/
  lib/my_pkg.dart        // export 'src/foo.dart' show Foo;
  lib/src/foo.dart
  bin/my_pkg.dart        // void main() {}
  test/foo_test.dart
```

### A4. Imports: dart:, package:, then relative
**Rule.** Order import groups `dart:` → `package:` → relative; alphabetize within each; separate groups by blank line.
**Reason.** `directives_ordering` lint; predictable order makes diffs and merges trivial.
```dart
import 'dart:async';

import 'package:meta/meta.dart';

import '../models/user.dart';
```

### A5. Package imports inside lib/
**Rule.** Inside your own `lib/` use `package:my_app/...` for cross-folder imports; never `../../foo.dart`.
**Reason.** Relative imports going up break IDE refactors and confuse the analyzer about library identity. Mixing both forms creates two distinct library views of the same file (`avoid_relative_lib_imports`).
```dart
// wrong
import '../../models/user.dart';
// right
import 'package:my_app/models/user.dart';
```

### A6. final over var, const when you can
**Rule.** Default to `final`; upgrade to `const` for compile-time constants; use `var` only when reassignment is real.
**Reason.** `prefer_final_locals`, `prefer_const_constructors`. `const` enables canonicalization and Flutter's tree-rebuild optimizations.
```dart
// wrong
var name = 'Ada';
var pi = 3.14;
// right
final name = 'Ada';
const pi = 3.14;
```

### A7. Sound null safety operators
**Rule.** Express absence with `?` (nullable type), default with `??`/`??=`, navigate with `?.`, assert non-null with `!` only when you can prove it.
**Reason.** Sound null safety means the compiler trusts the type system; `!` is an unchecked promise that throws at runtime if wrong.
```dart
String greet(String? name) => 'Hello ${name ?? 'stranger'}';
final length = name?.length;     // null-safe
final forced = name!;            // throws if null — only when proven
```

### A8. late for "initialized later, never null"
**Rule.** Use `late` for non-nullable fields that are populated after construction (DI, lifecycle); use `late final` for "compute once, then immutable".
**Reason.** `late` defers initialization without making the field nullable, which would force `!` everywhere downstream.
```dart
class Repo {
  late final Database db;        // set in init()
  Future<void> init() async { db = await Database.open(); }
}
```

### A9. Required vs optional named parameters
**Rule.** Use `{required ...}` for required named parameters; give optional named parameters defaults; positional optional `[...]` only for very short trailing optionals.
**Reason.** Named arguments document call sites; required-named is checked at compile time.
```dart
// wrong
User make(String name, [int? age, bool admin = false]);
// right
User make({required String name, int? age, bool admin = false});
```

### A10. Type public APIs, infer locals
**Rule.** Annotate parameters and return types of public functions; let inference handle local `final`/`var`.
**Reason.** Public types are the contract; locals are noise. `always_declare_return_types`, `omit_local_variable_types`.
```dart
// right
List<User> activeUsers(List<User> all) {
  final now = DateTime.now();
  return all.where((u) => u.lastSeen.isAfter(now.subtract(const Duration(days: 30)))).toList();
}
```

### A11. Avoid dynamic and bare Object?
**Rule.** Reach for generics, sealed classes, or records before `dynamic`/`Object?`.
**Reason.** `dynamic` opts out of type checking and silently allows any call; analyzer can't help. `avoid_dynamic_calls`.
```dart
// wrong
dynamic parse(dynamic raw) => raw['id'];
// right
T parse<T>(Map<String, Object?> raw, T Function(Map<String, Object?>) f) => f(raw);
```

### A12. String interpolation
**Rule.** Use `'$x'` and `'${expr}'`, not `'foo' + x.toString()`.
**Reason.** Faster, fewer allocations, easier to read; `prefer_interpolation_to_compose_strings`.
```dart
// wrong
final s = 'user ' + user.name + ' (' + user.id.toString() + ')';
// right
final s = 'user ${user.name} (${user.id})';
```

### A13. Typed collection literals
**Rule.** Prefer `<int>[]`, `<String, int>{}`, `<String>{}` to `List<int>()`/`Map()`/`Set()`; use spread, collection-if, collection-for.
**Reason.** Literals are concise, const-able, and inference-friendly; constructor forms are deprecated for core collections.
```dart
final ids = <int>[1, 2, ...other];
final filtered = [for (final u in users) if (u.active) u.id];
```

### A14. async/await over raw .then
**Rule.** Write asynchronous code with `async`/`await`; reserve `.then`/`.catchError` for adapter glue.
**Reason.** `await` linearizes control flow; stack traces and `try`/`catch` work; `.then` chains hide errors.
```dart
// wrong
Future<User> load(int id) => api.get(id).then((j) => User.fromJson(j));
// right
Future<User> load(int id) async => User.fromJson(await api.get(id));
```

### A15. Stream consumption with await for
**Rule.** Iterate finite streams with `await for`; for infinite streams use `.listen` and store the subscription so you can `cancel()`.
**Reason.** `await for` over an unbounded stream never returns; `listen` without subscription handle leaks.
```dart
// right (finite)
await for (final event in events.take(10)) handle(event);
// right (infinite)
final sub = ticker.listen(_tick);
// later: await sub.cancel();
```

### A16. Throw Exception/Error subclasses, never strings
**Rule.** `throw Exception('msg')` for recoverable cases, custom `Error` subclass for programmer bugs; never `throw 'literal'`.
**Reason.** Strings have no stack trace formatting, no type for `on` clauses; `only_throw_errors` lint.
```dart
// wrong
throw 'bad id';
// right
throw ArgumentError.value(id, 'id', 'must be positive');
```

### A17. rethrow preserves the trace
**Rule.** In a `catch (e)` block, use `rethrow`, not `throw e`.
**Reason.** `throw e` resets the stack trace at the catch point, hiding the origin.
```dart
try { risky(); } catch (e) {
  log(e);
  rethrow; // not: throw e;
}
```

### A18. on TypeName for typed catches
**Rule.** Filter with `on Type catch (e, st)` instead of inspecting types inside a generic catch.
**Reason.** Cleaner, faster, scoped error handling.
```dart
try { risky(); }
on FormatException catch (e, st) { report(e, st); }
on SocketException { /* offline */ }
```

### A19. Result types via sealed classes
**Rule.** Model expected failure paths as sealed `Result<T>` (or `Either`) when callers must handle them; reserve exceptions for the unexpected.
**Reason.** Exceptions for control flow obscure the contract; sealed Results give exhaustive switching.
```dart
sealed class Result<T> { const Result(); }
final class Ok<T> extends Result<T> { final T value; const Ok(this.value); }
final class Err<T> extends Result<T> { final Object error; const Err(this.error); }
```

### A20. Tests with package:test
**Rule.** Group with `group()`, isolate setup with `setUp()`/`tearDown()`, assert with `expect(actual, matcher)`.
**Reason.** Standard idiom across CLI and Flutter; matchers compose (`isA<T>()`, `throwsA(isA<FormatException>())`).
```dart
void main() {
  group('parseId', () {
    test('rejects negatives', () {
      expect(() => parseId(-1), throwsA(isA<ArgumentError>()));
    });
  });
}
```

---

## B — Modern Dart 3 idioms

### B1. Records for ad-hoc tuples
**Rule.** Return multiple values via records — positional `(int, String)` or named `({int id, String name})` — instead of bespoke classes for one-shot shapes.
**Reason.** Records are structural, value-equal, allocate once, and destructure with patterns.
```dart
({int code, String body}) fetch() => (code: 200, body: 'ok');
final (:code, :body) = fetch();
```

### B2. Pattern matching in switch
**Rule.** Use switch *expressions* with patterns for total mappings; let `sealed` give exhaustiveness for free.
**Reason.** Pattern switches are expressions, exhaustive over sealed hierarchies, and allow guards (`when`).
```dart
String label(Shape s) => switch (s) {
  Circle(:final r) => 'circle r=$r',
  Square(:final side) when side > 10 => 'big square',
  Square() => 'square',
};
```

### B3. Destructuring in if-case and assignments
**Rule.** Use `if (obj case Pattern(...))` and pattern destructuring on the LHS to extract fields without temporaries.
**Reason.** Removes boilerplate around `as`/null checks/getter chains.
```dart
if (response case {'data': {'id': final int id}}) use(id);
final (a, b) = ('x', 1);
```

### B4. Sealed classes for ADTs
**Rule.** Model closed unions (state, events, results) with `sealed class Foo` plus `final class` subclasses in the same library.
**Reason.** Compiler enforces exhaustive switches; adding a variant becomes a compile error at every call site — a feature.
```dart
sealed class Auth {}
final class SignedOut extends Auth {}
final class SignedIn extends Auth { final User user; SignedIn(this.user); }
```

### B5. Pick class modifiers deliberately
**Rule.** Default to `final class`; use `base` to allow extension but forbid implementation, `interface` to forbid extension, `sealed` for closed hierarchies, `mixin class` only when both behaviors are needed.
**Reason.** Dart 3's modifiers let you express intent the analyzer enforces — `final` blocks subclassing across libraries, preventing fragile-base-class breakage.
```dart
final class User {}            // closed for outside subclassing
sealed class Result<T> {}      // closed family
interface class Logger {}      // implementers only
```

### B6. Extension types for zero-cost wrappers
**Rule.** Wrap a primitive with `extension type UserId(String value) {}` when you want type safety without runtime overhead; subclass only when behavior differs.
**Reason.** Extension types compile to the underlying representation — no allocation — while preventing `userId == orderId` mistakes.
```dart
extension type UserId(String value) {}
extension type OrderId(String value) {}
// User(UserId('u_1')) — passing OrderId is a compile error.
```

### B7. Extensions for ergonomic methods
**Rule.** Add convenience methods to existing types via `extension Name on Type { ... }` instead of free functions or wrapper classes.
**Reason.** Discoverable through dot-completion; doesn't pollute global namespace; no runtime cost.
```dart
extension StringX on String {
  bool get isBlank => trim().isEmpty;
}
if (input.isBlank) return;
```

### B8. freezed for value classes
**Rule.** Use `freezed` (with `json_serializable`) for immutable data classes, sealed unions, `copyWith`, structural equality, and JSON.
**Reason.** Hand-rolling `==`/`hashCode`/`copyWith` is error-prone; freezed is the de-facto standard for Dart/Flutter data modeling. (See: [pub.dev/packages/freezed](https://pub.dev/packages/freezed); preferred over `Equatable` when JSON + unions are also needed.)
```dart
@freezed
class User with _$User {
  const factory User({required String id, required String name}) = _User;
  factory User.fromJson(Map<String, Object?> j) => _$UserFromJson(j);
}
```

### B9. == and hashCode together or never
**Rule.** Override `operator ==` and `hashCode` as a pair — usually by deferring to `freezed` or `Equatable`. Never override one alone.
**Reason.** `hashCode` and `==` must agree or `Set`/`Map` break silently. `hash_and_equals` lint.
```dart
// right: let freezed generate both
@freezed class Point with _$Point { const factory Point(int x, int y) = _Point; }
```

### B10. unawaited() for fire-and-forget
**Rule.** Wrap intentionally-discarded futures in `unawaited(...)`; never leave a bare `someFuture();` expression statement.
**Reason.** `unawaited_futures` lint catches accidental drops; explicit `unawaited` documents intent and preserves error handling via `runZonedGuarded`.
```dart
import 'package:meta/meta.dart';
unawaited(analytics.log('opened'));
```

### B11. Future.wait for independent awaits
**Rule.** When loop iterations don't depend on each other, run them concurrently with `Future.wait` instead of `await` inside the loop.
**Reason.** Sequential awaits serialize what could be parallel; `Future.wait` returns when all complete (or rethrows the first error).
```dart
// wrong
for (final id in ids) { results.add(await api.get(id)); }
// right
final results = await Future.wait(ids.map(api.get));
```

### B12. Isolate.run for one-shot CPU work
**Rule.** Offload pure CPU-bound functions to `Isolate.run(() => heavy(input))`; reach for `Isolate.spawn` only for long-lived workers.
**Reason.** Dart's event loop is single-threaded; isolates give real parallelism. `Isolate.run` (2.19+) handles spawn/teardown.
```dart
final hash = await Isolate.run(() => sha256(largeBytes));
```

### B13. Broadcast streams for multiple listeners
**Rule.** Use `StreamController.broadcast()` when more than one listener may attach; default `StreamController()` is single-subscription and throws on a second listen.
**Reason.** Single-subscription streams buffer until the one listener attaches; broadcast streams drop events with no listener — pick the model that matches your producer.
```dart
final ctrl = StreamController<Tick>.broadcast();
```

### B14. Factory constructors for caching/validation
**Rule.** Use `factory` when the constructor may return a cached instance, a subtype, or reject input; use generative constructors otherwise.
**Reason.** `factory` decouples "name on the call site" from "what gets allocated". Required when returning `null`-equivalents via subtypes.
```dart
class Currency {
  static final _cache = <String, Currency>{};
  factory Currency(String code) => _cache.putIfAbsent(code, () => Currency._(code));
  Currency._(this.code);
  final String code;
}
```

### B15. const constructors on value types
**Rule.** Mark every immutable type's constructor `const` and call sites with `const` when arguments are constant.
**Reason.** Canonicalizes instances at compile time — same `const Point(0,0)` everywhere is one object. Flutter's render tree uses this to skip rebuilds. `prefer_const_constructors`.
```dart
class Point { final int x, y; const Point(this.x, this.y); }
const origin = Point(0, 0);
```

### B16. Function typedefs with full signatures
**Rule.** Declare typedefs with parameter and return types; never bare `Function`.
**Reason.** `Function` accepts any callable — analyzer can't check arity or types. `avoid_dynamic_calls`.
```dart
// wrong
typedef Callback = Function;
// right
typedef Callback<T> = void Function(T value);
```

### B17. dartdoc /// with [refs]
**Rule.** Document public APIs with `///`; cross-reference symbols in square brackets; first sentence is a noun phrase.
**Reason.** `dart doc` and IDEs render `[Foo]` as a link; `public_member_api_docs` lint when documenting libraries.
```dart
/// A monetary amount in [currency], rounded to two decimals.
class Money { /* ... */ }
```

### B18. analysis_options.yaml in CI
**Rule.** Include `package:lints/recommended.yaml` (or `flutter_lints` in Flutter packages) plus opt-in stricter lints; run `dart analyze --fatal-infos` in CI.
**Reason.** Catches errors before review; opt-in lints (`prefer_const_constructors`, `unawaited_futures`, `avoid_print`) prevent the most common issues this doc enumerates.
```yaml
include: package:lints/recommended.yaml
linter:
  rules:
    prefer_const_constructors: true
    unawaited_futures: true
    avoid_print: true
```

### B19. dart format is non-negotiable
**Rule.** Run `dart format .` (or `dart format --set-exit-if-changed` in CI) on every commit.
**Reason.** One formatter, no configuration; eliminates style review entirely. Bigger diffs without it.
```bash
dart format --set-exit-if-changed .
```

### B20. StreamSubscription cancellation discipline
**Rule.** Anything that calls `.listen` stores the subscription and cancels it in a `dispose`/`close` lifecycle method.
**Reason.** Orphaned subscriptions hold references to their callbacks (and surrounding closures), leaking memory and causing "fired after disposed" bugs.
```dart
class Watcher {
  StreamSubscription<int>? _sub;
  void start(Stream<int> s) { _sub = s.listen(_on); }
  Future<void> close() async { await _sub?.cancel(); }
}
```

---

## D — Anti-patterns / smells

### D1. dynamic everywhere
**Smell.** Parameter or field typed `dynamic` to "make it work".
**Why bad.** Disables type checking; errors only surface at runtime, often far from the source.
```dart
// wrong
dynamic process(dynamic input) => input.value;
// right
T process<T extends HasValue>(T input) => input;
```

### D2. ! to silence the analyzer
**Smell.** `obj!.field` sprinkled to make red squiggles disappear.
**Why bad.** Each `!` is an unchecked runtime cast that throws on null. If a value is "always non-null", model it that way (`late`, required, sealed state).
```dart
// wrong
final name = user!.profile!.name!;
// right
if (user?.profile?.name case final name?) use(name);
```

### D3. var for everything
**Smell.** Every binding is `var`, no `final`.
**Why bad.** Hides which values are intended to mutate; analyzer can't catch accidental reassignment.
```dart
// wrong
var radius = 5;
// right
final radius = 5;
```

### D4. Mutable top-level state
**Smell.** `int counter = 0;` at library top level, mutated from anywhere.
**Why bad.** Implicit global; un-testable; thread-hostile across isolates; defeats Riverpod/DI entirely.
```dart
// wrong
int counter = 0;
// right: a Notifier or service injected where needed
```

### D5. print in production
**Smell.** `print('debug: $x')` left in shipped code.
**Why bad.** No level, no destination, can't be filtered. Dart CLI keeps it; Flutter's `flutter run --release` does *not* strip arbitrary `print`. Use a logger or `developer.log`. `avoid_print` lint.
```dart
// wrong
print('user $u');
// right
import 'dart:developer';
log('user $u', name: 'auth');
```

### D6. Bare catch swallows everything
**Smell.** `try { ... } catch (_) {}` to "ignore errors".
**Why bad.** Hides bugs, including programmer errors and `OutOfMemoryError`. At minimum log; usually rethrow.
```dart
// wrong
try { risky(); } catch (_) {}
// right
try { risky(); } catch (e, st) { log('risky failed', error: e, stackTrace: st); rethrow; }
```

### D7. throw e drops the trace
**Smell.** `catch (e) { throw e; }` instead of `rethrow`.
**Why bad.** Replaces the original stack trace with the catch site, making debugging much harder.
```dart
// wrong
} catch (e) { cleanup(); throw e; }
// right
} catch (_) { cleanup(); rethrow; }
```

### D8. await in independent loops
**Smell.** `for (final x in xs) await fetch(x);` when iterations don't depend on each other.
**Why bad.** Serializes parallelizable work, multiplying latency by N.
```dart
// wrong
for (final id in ids) results.add(await api.get(id));
// right
final results = await Future.wait(ids.map(api.get));
```

### D9. late as null-safety duct tape
**Smell.** `late` fields everywhere to dodge nullable types, with no clear init point.
**Why bad.** Trades a compile-time check for a runtime `LateInitializationError`. Often signals confused lifecycle — model it with constructors or a sealed state machine.
```dart
// wrong
class C { late String name; }
// right
class C { final String name; const C(this.name); }
```

### D10. Field-by-field == without hashCode
**Smell.** Custom `==` that compares fields, but no matching `hashCode` (or vice versa).
**Why bad.** Breaks `Set`/`Map` invariants silently; equal objects hash differently → duplicates appear.
```dart
// wrong: == only
@override bool operator ==(Object o) => o is P && o.x == x;
// right: use freezed/Equatable, or override both consistently
```

### D11. Object? when generics fit
**Smell.** APIs typed `Object?` because "anything goes".
**Why bad.** Pushes type checks to runtime; loses inference for callers.
```dart
// wrong
T? firstWhere(Object? Function(Object?) test) => ...
// right
T? firstWhere<T>(bool Function(T) test) => ...
```

### D12. Bare Function typedef
**Smell.** `void register(Function cb);` with no signature.
**Why bad.** Caller can pass any arity/types; analyzer is blind.
```dart
// wrong
void register(Function cb);
// right
void register(void Function(Event) cb);
```

### D13. Mixing relative and package: imports
**Smell.** Same file imported as `../foo.dart` from one place and `package:my_app/foo.dart` from another.
**Why bad.** Dart treats them as two libraries; type identity diverges; `is` checks and globals split. Pick package-imports inside `lib/`.
```dart
// wrong: mixing
import '../foo.dart';        // file A
import 'package:my_app/foo.dart'; // file B
```

### D14. Forgetting super calls
**Smell.** Override of `initState`/`dispose`/etc. without `super.method()` where the base class requires it.
**Why bad.** Skips framework setup/teardown; produces confusing leaks and "called on disposed" errors. `must_call_super`.
```dart
// wrong
@override void dispose() { _ctrl.dispose(); }
// right
@override void dispose() { _ctrl.dispose(); super.dispose(); }
```

### D15. `==`-comparing doubles for equality
**Smell.** `if (price == 0.1 + 0.2)`.
**Why bad.** Float arithmetic isn't exact. Compare with tolerance or use integer cents.
```dart
// wrong
if (a == 0.3) ...
// right
if ((a - 0.3).abs() < 1e-9) ...
```

### D16. Returning Future<void> but not awaiting
**Smell.** Async API whose callers ignore its future, then surprises arrive out of order.
**Why bad.** Errors go unobserved; ordering breaks. Either `await`, or wrap in `unawaited()` to make the choice explicit.
```dart
// wrong
save(); navigate();
// right
await save(); navigate();
```

### D17. Catching Exception when you meant Error (or vice versa)
**Smell.** `on Exception catch (_)` around code that throws `StateError`.
**Why bad.** `Error` is not a subtype of `Exception`; the catch never fires and the program crashes anyway.
```dart
// wrong: StateError leaks past
try { state.assertReady(); } on Exception { ... }
// right: catch the actual type
try { state.assertReady(); } on StateError { ... }
```

---

## Sources

- [dart.dev — Language tour, Effective Dart, null safety](https://dart.dev/)
- [Dart 3 announcement (records, patterns, class modifiers)](https://medium.com/dartlang/announcing-dart-3-53f065a10635)
- [Class modifiers reference](https://dart.dev/language/class-modifiers)
- [Patterns reference](https://dart.dev/language/patterns)
- [Extension types (Dart 3.3+)](https://dart.dev/language/extension-types)
- [package:lints recommended set](https://pub.dev/packages/lints)
- [package:freezed](https://pub.dev/packages/freezed) — de-facto data-class generator
- [package:test](https://pub.dev/packages/test)
- Andrea Bizzotto, *Code With Andrea* (2024–2025) — Riverpod, freezed, error handling
- Remi Rousselet — Riverpod and `freezed` author talks/blog
