# Flutter — code-craft reference

~60 rules across three buckets. Flutter 3.27+ assumed: Material 3 default, Impeller default on iOS (opt-in on Android via `--enable-impeller`), Dart 3.x with records/patterns/sealed classes baseline. Pure Dart idioms live in `languages/dart.md` — this file references them rather than duplicates.

Sources: [docs.flutter.dev](https://docs.flutter.dev/), [Flutter 3.27 release notes](https://docs.flutter.dev/release/release-notes/release-notes-3.27.0), [Material 3 + Flutter](https://m3.material.io/develop/flutter), [Riverpod docs](https://riverpod.dev/), [flutter_bloc docs](https://bloclibrary.dev/), [go_router](https://pub.dev/packages/go_router), Andrea Bizzotto's *Code With Andrea*, Filip Hracek videos, Remi Rousselet (Riverpod author) talks (2024–2025), Flutter team blog.

Loaded by `code-craft` when the user asks about Flutter or pastes Flutter code. Audio/Riverpod/desktop scope: real-time audio apps (SF2 SoundFont synth, MIDI, FFI) are in scope.

---

## A — Tactical (day-to-day patterns)

### A1. Project layout with lib/src
**Rule.** Public surface in `lib/<app>.dart` re-exporting from `lib/src/`; feature folders under `lib/src/features/<feature>/{data,domain,presentation}`; tests mirror the layout in `test/`; integration tests in `integration_test/`.
**Reason.** `lib/src/` is private by convention (`implementation_imports` lint); feature-first folders scale better than `screens/widgets/models/` once the app has more than ~5 screens.
```text
lib/
  app.dart
  src/features/auth/{data,domain,presentation}/
  src/core/{theme,router,logging}/
test/  integration_test/  assets/
```

### A2. StatelessWidget by default
**Rule.** Reach for `StatefulWidget` only when state is local to the widget and not derivable from inputs; otherwise use `StatelessWidget` and lift state into a Notifier/BLoC/parent.
**Reason.** Stateless widgets are cheaper to rebuild, easier to test, and trivially `const`-able.
```dart
class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.url});
  final String url;
  @override Widget build(BuildContext c) => Image.network(url);
}
```

### A3. const everything you can
**Rule.** Mark widget constructors `const`; mark call sites `const` whenever children/values are constant.
**Reason.** `const` widgets are canonicalized — Flutter skips rebuilds when the parent rebuilds. Single biggest free perf win. `prefer_const_constructors`.
```dart
// wrong
return Padding(padding: EdgeInsets.all(8), child: Text('Hi'));
// right
return const Padding(padding: EdgeInsets.all(8), child: Text('Hi'));
```

### A4. Pick the right Key
**Rule.** Use `ValueKey(id)` for list items with stable IDs, `ObjectKey(model)` for identity-by-instance, `PageStorageKey` to preserve scroll, and `GlobalKey` only when you genuinely need to reach across the tree.
**Reason.** Without correct keys, Flutter's element-reuse algorithm rebinds state to the wrong widget when lists reorder. `GlobalKey` is heavyweight (registered globally) and constrains widget placement.
```dart
ListView(children: [for (final t in todos) TodoTile(key: ValueKey(t.id), todo: t)]);
```

### A5. LayoutBuilder for component-relative size
**Rule.** Read constraints from `LayoutBuilder` for widget-local sizing; use `MediaQuery` only for true screen-level concerns (orientation, system padding).
**Reason.** `MediaQuery.of(context).size` rebuilds the subtree on every keyboard show/hide and orientation change, even if your widget doesn't care.
```dart
LayoutBuilder(builder: (ctx, c) =>
  c.maxWidth > 600 ? const _Wide() : const _Narrow());
```

### A6. Granular MediaQuery reads
**Rule.** Use `MediaQuery.sizeOf(context)`, `MediaQuery.viewPaddingOf(context)`, etc. instead of `MediaQuery.of(context).size`.
**Reason.** Granular accessors (Flutter 3.10+) subscribe only to the property you read, avoiding spurious rebuilds.
```dart
// wrong
final size = MediaQuery.of(context).size;
// right
final size = MediaQuery.sizeOf(context);
```

### A7. Theme everything
**Rule.** Pull colors/typography from `Theme.of(context).colorScheme` and `Theme.of(context).textTheme`; never hardcode `Color(0xFF...)` or `TextStyle(fontSize: 14)` in widget bodies.
**Reason.** Hardcoding bypasses dark mode, dynamic color, and accessibility text scaling. Defining `ThemeData` once at the app root keeps the surface consistent.
```dart
Text('Hi', style: Theme.of(context).textTheme.titleMedium);
```

### A8. Material 3 with ColorScheme.fromSeed
**Rule.** Set `useMaterial3: true` (default in 3.16+) and generate the palette via `ColorScheme.fromSeed(seedColor: ..., brightness: ...)`.
**Reason.** Generates a tonal palette aligned with M3 spec; supports dark mode and dynamic color out of the box. (See: [m3.material.io/develop/flutter](https://m3.material.io/develop/flutter).)
```dart
MaterialApp(
  theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
  darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo, brightness: Brightness.dark)),
);
```

### A9. ListView.builder for long lists
**Rule.** Build lists with `ListView.builder`/`ListView.separated`; `ListView(children: [...])` is for short, fixed lists only. For sliver-aware UIs use `CustomScrollView` + `SliverList`.
**Reason.** `.builder` lazily builds visible items; the default constructor builds everything up front and dies on big lists.
```dart
ListView.builder(itemCount: items.length,
  itemBuilder: (c, i) => TodoTile(key: ValueKey(items[i].id), todo: items[i]));
```

### A10. Dispose controllers
**Rule.** Every `TextEditingController`, `AnimationController`, `ScrollController`, `FocusNode`, `StreamSubscription`, `Timer` you create must be disposed in `dispose()`.
**Reason.** Controllers hold listeners; un-disposed they leak memory and trigger "used after disposed" assertions.
```dart
@override void dispose() { _ctrl.dispose(); _focus.dispose(); super.dispose(); }
```

### A11. Form + GlobalKey<FormState>
**Rule.** Build forms with `Form` + `TextFormField` + `GlobalKey<FormState>`; validate via `validator:` and call `formKey.currentState!.validate()` on submit.
**Reason.** Centralizes validation, focus traversal, autofill, and reset; `validator` integrates with the M3 error state.
```dart
final formKey = GlobalKey<FormState>();
Form(key: formKey, child: TextFormField(validator: (v) => v!.isEmpty ? 'required' : null));
```

### A12. SafeArea by default for screen roots
**Rule.** Wrap top-level scaffold body content in `SafeArea` (or set `appBar` so Material handles the top); use `MediaQuery.viewInsets` for keyboard-aware padding.
**Reason.** Notches, rounded corners, and gesture bars overlap content otherwise.
```dart
Scaffold(body: SafeArea(child: ...));
```

### A13. mounted check after async gap
**Rule.** Before using `BuildContext` after `await`, check `if (!mounted) return;` (or `if (!context.mounted) return;` for `State`).
**Reason.** The widget may have been removed during the await; using `context` afterward throws or shows a snackbar on a dead route. `use_build_context_synchronously`.
```dart
final result = await api.save();
if (!mounted) return;
ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result)));
```

### A14. Image.asset / Image.network with caching
**Rule.** Declare assets in `pubspec.yaml`; use `cached_network_image` for remote images with placeholder/error builders; call `precacheImage` for hero images before the route transition.
**Reason.** `Image.network` re-downloads each rebuild and offers no on-disk cache; missing placeholders cause flashes.
```dart
CachedNetworkImage(imageUrl: url, placeholder: (_, __) => const _Skel(), errorWidget: (_, __, ___) => const Icon(Icons.error));
```

### A15. AnimatedX for simple transitions
**Rule.** Use implicit `AnimatedContainer`/`AnimatedOpacity`/`AnimatedSwitcher` for one-off transitions; reach for `AnimationController` + `Tween` only for orchestrated/coordinated animations.
**Reason.** Implicit animations are one-liners and respect `MediaQueryData.disableAnimations`; explicit controllers add lifecycle complexity.
```dart
AnimatedContainer(duration: const Duration(milliseconds: 200), color: selected ? cs.primary : cs.surface);
```

### A16. Localization with intl + ARB
**Rule.** Use `flutter_localizations` + ARB files generated via `flutter gen-l10n` (or `slang` for stricter type safety). Never hardcode user-facing strings.
**Reason.** ARB is the canonical Flutter L10n format; `gen-l10n` produces a typed `AppLocalizations` class. `slang` is a stricter typed alternative growing in 2024–2025.
```yaml
# pubspec.yaml
flutter:
  generate: true
# l10n.yaml + lib/l10n/app_en.arb
```

### A17. Build flavors with --flavor
**Rule.** Define Android `productFlavors` and iOS Schemes; one entry point per flavor (`lib/main_dev.dart`, `lib/main_prod.dart`); pass config via `--dart-define`.
**Reason.** Separates app IDs, icons, endpoints between dev/staging/prod cleanly; `--dart-define` injects compile-time constants without rebuilding the framework.
```bash
flutter run -t lib/main_dev.dart --flavor dev --dart-define=API_URL=https://dev.api
flutter build apk --flavor prod --dart-define=API_URL=https://api
```

### A18. Navigation with go_router
**Rule.** Use `go_router` for declarative routing, deep links, and browser URLs on web; reserve raw `Navigator.push` for short-lived imperative cases (modals, dialogs).
**Reason.** `go_router` is the de-facto router for Flutter 2024–2025; `Navigator.push` everywhere breaks deep links, web URLs, and browser back/forward. (See: [pub.dev/packages/go_router](https://pub.dev/packages/go_router) — Flutter team-maintained.)
```dart
final router = GoRouter(routes: [
  GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
  GoRoute(path: '/song/:id', builder: (_, s) => SongScreen(id: s.pathParameters['id']!)),
]);
```

### A19. flutter doctor before debugging weird issues
**Rule.** Run `flutter doctor -v` whenever toolchain behavior is suspect; run `flutter clean && flutter pub get` after major channel/SDK changes.
**Reason.** Most "this used to work" bugs trace to a missing platform tool or a stale `.dart_tool/` cache.
```bash
flutter doctor -v
flutter clean && flutter pub get
```

### A20. Builder for fresh BuildContext
**Rule.** Wrap a subtree in `Builder` to get a `BuildContext` that sees newly-installed providers/scaffolds (e.g., `ScaffoldMessenger.of(context)` inside a `Scaffold`'s body builder).
**Reason.** The `context` passed to `build` predates `Scaffold`'s install; calling `Scaffold.of(context)` or `ScaffoldMessenger.of(context)` from there throws.
```dart
Scaffold(body: Builder(builder: (ctx) => ElevatedButton(
  onPressed: () => ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('hi'))),
  child: const Text('Show'))));
```

---

## B — Modern Flutter idioms

### B1. Riverpod for app state
**Rule.** Use Riverpod 2.x with `@riverpod` code generation as the default state-management choice for new Flutter apps; consider `flutter_bloc` only when the team explicitly wants BLoC's stream-of-events discipline; `setState` is fine for truly local UI state.
**Reason.** Riverpod is compile-checked, scoped, testable, and has eaten Provider's mindshare in 2024–2025. BLoC is still viable for very large apps with strict separation between events and states. (See: [riverpod.dev](https://riverpod.dev/), Remi Rousselet's talks; [bloclibrary.dev](https://bloclibrary.dev/).)
```dart
@riverpod
Future<User> currentUser(CurrentUserRef ref) => ref.watch(authProvider).fetchUser();
```

### B2. Notifier / AsyncNotifier for mutable state
**Rule.** Model mutable units of state as `Notifier`/`AsyncNotifier` (or generated `@riverpod class Foo extends _$Foo`); expose only intent-revealing methods.
**Reason.** Notifiers replace older `StateNotifier`/`ChangeNotifier` patterns with a cleaner lifecycle; `AsyncNotifier` integrates `AsyncValue` for loading/error states.
```dart
@riverpod
class Counter extends _$Counter {
  @override int build() => 0;
  void increment() => state++;
}
```

### B3. ref.watch / read / listen — pick deliberately
**Rule.** `ref.watch` inside `build` to subscribe; `ref.read` for one-shot reads inside callbacks; `ref.listen` for side effects (snackbars, navigation) on state change.
**Reason.** `watch` rebuilds; using it in callbacks causes unnecessary rebuilds. `read` in `build` skips rebuilds — usually a bug.
```dart
final user = ref.watch(currentUserProvider);
ref.listen(authProvider, (prev, next) { if (next case SignedOut()) context.go('/login'); });
ElevatedButton(onPressed: () => ref.read(counterProvider.notifier).increment(), child: const Text('+'));
```

### B4. ProviderScope overrides for tests/feature flags
**Rule.** Override providers via `ProviderScope(overrides: [authProvider.overrideWith(...)])` for tests, fakes, and per-flavor configuration.
**Reason.** No globals to mock — testing reduces to "build the widget under a scoped container". Same mechanism enables flag-driven swaps without `if`-spaghetti.
```dart
testWidgets('signed-in state', (t) async {
  await t.pumpWidget(ProviderScope(
    overrides: [authProvider.overrideWith((ref) => SignedIn(_fakeUser))],
    child: const MyApp()));
});
```

### B5. AsyncValue.when for loading/error/data
**Rule.** Render `AsyncValue` with `.when(data:, loading:, error:)`; never reach for `if (snapshot.hasData)`.
**Reason.** `.when` forces all three states to be handled and reads cleanly; loading-flicker patterns route through `previous` for skeletons.
```dart
final user = ref.watch(currentUserProvider);
return user.when(
  data: (u) => Text(u.name),
  loading: () => const CircularProgressIndicator(),
  error: (e, st) => ErrorView(error: e));
```

### B6. ShellRoute for persistent shells
**Rule.** Use `go_router`'s `ShellRoute`/`StatefulShellRoute` for bottom-nav/tab shells that survive across child routes.
**Reason.** Shell routes preserve state of inactive branches; rolling your own with `IndexedStack` plus a custom router collides with deep links.
```dart
StatefulShellRoute.indexedStack(
  branches: [StatefulShellBranch(routes: [GoRoute(path: '/home', builder: ...)])],
  builder: (c, s, shell) => MainShell(shell: shell));
```

### B7. Auth gating via redirect
**Rule.** Centralize auth-gating in `GoRouter`'s `redirect:` callback driven by an auth state stream; avoid scattering `if (!signedIn) navigateTo(login)` across screens.
**Reason.** A single redirect function is testable and composable; per-screen guards drift out of sync.
```dart
GoRouter(refreshListenable: authNotifier,
  redirect: (c, s) => authNotifier.value is SignedOut ? '/login' : null,
  routes: [...]);
```

### B8. BLoC: sealed events + sealed states
**Rule.** When using BLoC, model events and states as `sealed` class hierarchies and pattern-match in `on<Event>` handlers and `BlocBuilder` builders.
**Reason.** Sealed types give exhaustive matching; the analyzer points at the exact handler when a new event is added.
```dart
sealed class CounterEvent {} class Inc extends CounterEvent {} class Dec extends CounterEvent {}
class CounterBloc extends Bloc<CounterEvent, int> {
  CounterBloc() : super(0) { on<Inc>((_, e) => e(state + 1)); on<Dec>((_, e) => e(state - 1)); }
}
```

### B9. Networking with dio (or http)
**Rule.** Use `dio` when you need interceptors, cancel tokens, or multipart; `package:http` when stdlib-style suffices. Add `retrofit` for codegen REST clients.
**Reason.** `http` is minimal and stable; `dio` covers everything else without rolling your own. `retrofit` removes hand-written client boilerplate.
```dart
final dio = Dio(BaseOptions(baseUrl: env.apiUrl))..interceptors.add(_authInterceptor);
```

### B10. JSON via freezed + json_serializable
**Rule.** Generate models with `freezed` + `json_serializable`; run `dart run build_runner watch -d` during development.
**Reason.** Hand-written `fromJson`/`toJson` is bug-prone; freezed unifies value classes, unions, and JSON. (See `languages/dart.md` B8.)
```dart
@freezed class Song with _$Song {
  const factory Song({required String id, required String title}) = _Song;
  factory Song.fromJson(Map<String, Object?> j) => _$SongFromJson(j);
}
```

### B11. Persistence: pick by shape
**Rule.** `shared_preferences` for small KV, `flutter_secure_storage` for tokens and secrets, `drift` (or `sqflite`) for SQL, `objectbox`/`isar` for embedded NoSQL when justified — but Hive is in maintenance limbo as of 2025; new code should default to `drift` for relational and `objectbox` (or `isar` v4 if active) for object stores.
**Reason.** `shared_preferences` lacks encryption; `Hive`/`Isar` activity slowed in 2024–2025 (see GitHub issues), so picking `drift` for SQL keeps you on actively-maintained ground.
```dart
await FlutterSecureStorage().write(key: 'token', value: jwt); // never SharedPreferences for this
```

### B12. Platform integration: pigeon, then FFI
**Rule.** For typed method-channel APIs use `pigeon` (generates Dart + Swift/Kotlin); for direct C interop (audio DSP, codecs, soundfont engines) use `dart:ffi` with a thin Dart wrapper class.
**Reason.** Hand-written method channels drift between platforms; `pigeon` keeps signatures in sync. FFI gives true zero-copy native calls without a channel hop — essential for audio (sub-10ms callbacks).
```dart
final dylib = DynamicLibrary.open('synth.dylib');
final renderBlock = dylib.lookupFunction<Void Function(Pointer<Float>, Int32), void Function(Pointer<Float>, int)>('render_block');
```

### B13. Audio callback work off the UI isolate
**Rule.** Real-time audio render callbacks must not run on the Flutter UI isolate; expose them through native code via FFI/method channels and surface only state (levels, meters) to Dart.
**Reason.** The UI isolate is stop-the-world during build/layout/paint; any audio work there guarantees dropouts. Real-time audio apps render in C/C++ and report back via a `Stream` of frames.
```dart
// right: Dart only orchestrates; native renders
final levels = ref.watch(meterStreamProvider);
```

### B14. Impeller is the default; don't fight it
**Rule.** Trust Impeller on iOS (default since 3.10); on Android, opt in with `--enable-impeller` for testing in 3.27+, but verify on your target devices before shipping.
**Reason.** Impeller eliminates Skia's first-frame shader compilation jank but has different perf characteristics for some custom shaders/blurs — measure rather than assume. (See: [Flutter team Impeller status](https://docs.flutter.dev/perf/impeller).)
```bash
flutter run --enable-impeller    # Android opt-in
```

### B15. DevTools first, profiling overlay second
**Rule.** Reach for Flutter DevTools (Widget Inspector, Performance, Memory, CPU profiler) before sprinkling `print` or `Stopwatch`; toggle the Performance overlay in-app for fast frame-time inspection.
**Reason.** DevTools shows rebuild counts, raster vs UI thread time, and shader compile spikes — `print` shows none of that.
```dart
// in MaterialApp
showPerformanceOverlay: kDebugMode && _showPerf,
```

### B16. Widget tests with WidgetTester
**Rule.** Cover screens with `testWidgets` + `WidgetTester` (`pumpWidget`, `tap`, `enterText`, `pump`); use `integration_test` for end-to-end flows; use `golden_toolkit` or `alchemist` for visual regression.
**Reason.** Widget tests are headless and fast; integration tests run on device/emulator with full plugin stack; goldens catch UI drift.
```dart
testWidgets('login submits', (t) async {
  await t.pumpWidget(const ProviderScope(child: MyApp()));
  await t.enterText(find.byKey(const ValueKey('email')), 'a@b.c');
  await t.tap(find.text('Sign in'));
  await t.pumpAndSettle();
});
```

### B17. State preservation in tabs/pages
**Rule.** Preserve scroll/state across tabs with `PageStorageKey`; keep an off-screen `TabBarView` page alive with `AutomaticKeepAliveClientMixin` (and call `super.build`).
**Reason.** Default `TabBarView` disposes off-screen children, dropping scroll position and inflight async work.
```dart
class _TabState extends State<TabPage> with AutomaticKeepAliveClientMixin {
  @override bool get wantKeepAlive => true;
  @override Widget build(BuildContext c) { super.build(c); return ...; }
}
```

### B18. AnnotatedRegion for system UI
**Rule.** Style status/nav bars per-screen with `AnnotatedRegion<SystemUiOverlayStyle>`; set orientation policy with `SystemChrome.setPreferredOrientations` once at app start.
**Reason.** `AnnotatedRegion` is reactive to route changes, unlike `SystemChrome.setSystemUIOverlayStyle` which is global and easy to forget on pop.
```dart
AnnotatedRegion(value: SystemUiOverlayStyle.dark, child: Scaffold(...));
```

### B19. Accessibility from day one
**Rule.** Wrap interactive widgets in `Semantics(label: ...)` when their visible text is missing or non-descriptive; respect `MediaQuery.textScalerOf(context)`; test with a screen reader (TalkBack/VoiceOver) before shipping.
**Reason.** Icons, custom paints, and decoration-only widgets are invisible to assistive tech without semantics. Tight `fontSize` breaks at 200% scale.
```dart
Semantics(label: 'Play', button: true, child: GestureDetector(onTap: play, child: const Icon(Icons.play_arrow)));
```

### B20. Adaptive layout via breakpoints
**Rule.** Branch on width with `LayoutBuilder` for component-level adaptation; check `Theme.of(context).platform` or `defaultTargetPlatform` for platform-specific affordances (Cupertino vs Material accents).
**Reason.** Flutter desktop + mobile means the same widget must reflow; reading window size in a parent `LayoutBuilder` keeps decisions local.
```dart
return c.maxWidth < 600 ? const _Mobile() : const _Tablet();
```

### B21. PopScope, not WillPopScope
**Rule.** Use `PopScope(canPop: ..., onPopInvoked: ...)` for back-button intercepts in new code; `WillPopScope` is deprecated.
**Reason.** Predictive back gestures (Android 14+) require the new API; `WillPopScope` doesn't participate.
```dart
PopScope(canPop: !hasUnsavedChanges, onPopInvoked: (didPop) async { if (!didPop) await _confirmDiscard(); });
```

### B22. ThemeData defined once, top level
**Rule.** Build `ThemeData` as a `const`/top-level value (or via a `themeProvider`); never construct it inside `MaterialApp`'s build with inline `TextStyle`s.
**Reason.** Recreating `ThemeData` per build invalidates equality checks in descendants (`Theme.of(context)` change detection). Define once, vary by mode.
```dart
final lightTheme = ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo));
MaterialApp(theme: lightTheme, darkTheme: darkTheme, themeMode: ThemeMode.system);
```

---

## D — Anti-patterns / smells

### D1. Heavy work in build()
**Smell.** Network calls, JSON parsing, big computes inside `build`.
**Why bad.** `build` runs on every rebuild — many times per second under animation. Move to `initState`, a Notifier's `build`, or `Future`/`Stream` providers.
```dart
// wrong
@override Widget build(BuildContext c) { final users = jsonDecode(rawBigBlob); ... }
// right: lift into a provider
final usersProvider = FutureProvider((ref) async => jsonDecode(rawBigBlob));
```

### D2. setState in build() or dispose()
**Smell.** Calling `setState` inside `build` (loop) or `dispose` (after frame).
**Why bad.** `build` triggers infinite rebuilds; `dispose` runs after the frame, so setState on a disposed state throws.
```dart
// wrong
@override Widget build(BuildContext c) { setState(() => _x++); ... }
```

### D3. Missing dispose
**Smell.** `TextEditingController`/`AnimationController`/`StreamSubscription`/`FocusNode` created but never disposed.
**Why bad.** Listeners and tickers leak; eventually the app is paying frame-time for ghosts.
```dart
// right
@override void dispose() { _ctrl.dispose(); _sub?.cancel(); _focus.dispose(); super.dispose(); }
```

### D4. MediaQuery.of for tile width
**Smell.** Using `MediaQuery.of(context).size.width / 2` to size a card.
**Why bad.** Rebuilds the entire subtree on keyboard show/hide, orientation changes, and split-screen resizes.
```dart
// wrong
width: MediaQuery.of(context).size.width / 2,
// right
LayoutBuilder(builder: (c, b) => SizedBox(width: b.maxWidth / 2, child: ...));
```

### D5. Hardcoded colors and font sizes
**Smell.** `Color(0xFF112233)` and `TextStyle(fontSize: 14)` in widget bodies.
**Why bad.** Bypasses dark mode, dynamic color, accessibility text scaling.
```dart
// wrong
Text('Hi', style: TextStyle(fontSize: 14, color: Color(0xFF112233)));
// right
Text('Hi', style: Theme.of(context).textTheme.bodyMedium);
```

### D6. Navigator.push everywhere
**Smell.** All navigation via raw `Navigator.push(MaterialPageRoute(...))` with no path.
**Why bad.** Breaks deep links, browser URLs/back-forward on web, restoration, and route observability.
```dart
// wrong
Navigator.push(c, MaterialPageRoute(builder: (_) => SongScreen(id)));
// right
context.go('/song/$id');
```

### D7. Business logic inside widgets
**Smell.** Repository calls, validation, scoring algorithms in a `StatefulWidget`.
**Why bad.** Untestable without `pumpWidget`; one dialog change breaks unrelated tests.
```dart
// right: widgets render; Notifiers/services compute
final result = ref.watch(scoreProvider(input));
```

### D8. Stream listened in build()
**Smell.** `someStream.listen((e) => setState(...))` inside `build`.
**Why bad.** A new subscription per rebuild — leaks and double-fires forever. Use `StreamBuilder` or move into a Notifier.
```dart
// wrong
@override Widget build(BuildContext c) { _sub = stream.listen(_on); ... }
// right
StreamBuilder(stream: stream, builder: (_, snap) => ...);
```

### D9. context after async without mounted
**Smell.** `await x; Navigator.of(context).pop();` with no mounted check.
**Why bad.** If the user navigated away, `context` is dead; throws or no-ops on the wrong route.
```dart
// right
final r = await save();
if (!context.mounted) return;
Navigator.of(context).pop(r);
```

### D10. Container for SizedBox/Padding
**Smell.** `Container(width: 8)` instead of `SizedBox(width: 8)`; `Container(padding: ...)` instead of `Padding`.
**Why bad.** `Container` is a composite of multiple render objects — heavier, less expressive of intent. `sized_box_for_whitespace`.
```dart
// wrong
Container(width: 8)
// right
const SizedBox(width: 8)
```

### D11. print in widgets
**Smell.** `print('rebuilt')` for debugging UI.
**Why bad.** Not stripped in release for plain `print` in app code; floods stdout. Use `debugPrint` (auto-throttled, debug-only) or a logger. `avoid_print`.
```dart
// wrong
print('built');
// right
import 'package:flutter/foundation.dart';
debugPrint('built');
```

### D12. Reorderable list without keys
**Smell.** `ListView(children: [for (final t in todos) TodoTile(todo: t)])` where `todos` reorders.
**Why bad.** Element reuse rebinds state to the wrong widget — animations restart, scroll jumps, focus jumps.
```dart
// right
TodoTile(key: ValueKey(t.id), todo: t)
```

### D13. GlobalKey overuse
**Smell.** A `GlobalKey` per widget to "access state from outside".
**Why bad.** Globally registered, expensive, constrains widget placement, brittle. Lift state into a provider/Notifier instead.
```dart
// wrong
final keyA = GlobalKey<MyWidgetState>();
keyA.currentState!.refresh();
// right: ref.read(myProvider.notifier).refresh();
```

### D14. Async without progress UI
**Smell.** `onPressed: () { saveAsync(); }` with no spinner, no disable.
**Why bad.** Users tap twice; failures are silent. Wire to `AsyncValue` (`.isLoading`) and disable the button accordingly.
```dart
// right
final s = ref.watch(saveProvider);
ElevatedButton(onPressed: s.isLoading ? null : () => ref.read(saveProvider.notifier).run(), child: ...);
```

### D15. BoxDecoration + color in Container
**Smell.** `Container(color: Colors.red, decoration: BoxDecoration(borderRadius: ...))`.
**Why bad.** `color` is silently ignored when `decoration` is set; the widget asserts in debug.
```dart
// wrong
Container(color: Colors.red, decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)));
// right
Container(decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(8)));
```

### D16. await for over an infinite stream
**Smell.** `await for (final e in audioCallbacks) handle(e);` where `audioCallbacks` never closes.
**Why bad.** The function never returns; surrounding `async` work stalls.
```dart
// right
final sub = audioCallbacks.listen(handle);
```

### D17. SafeArea forgotten on full-bleed screens
**Smell.** Custom screen with no `Scaffold.appBar` and no `SafeArea`.
**Why bad.** Notch/dynamic-island overlap; gesture bar overlap on Android 10+.
```dart
// right
Scaffold(body: SafeArea(child: ...));
```

### D18. Implicit fonts (declared TextStyle, undeclared family)
**Smell.** `TextStyle(fontFamily: 'Inter')` without an `Inter` family in `pubspec.yaml`'s `fonts:`.
**Why bad.** Silently falls back to the platform default; designs drift between dev devices.
```yaml
flutter:
  fonts:
    - family: Inter
      fonts: [{ asset: assets/fonts/Inter-Regular.ttf }]
```

### D19. flutter pub upgrade in CI without review
**Smell.** Auto-upgrading dependencies on every CI run.
**Why bad.** Point releases of plugins still break — pin in `pubspec.lock` and gate `flutter pub upgrade --major-versions` to a manual review window.
```bash
# don't run upgrade in CI; only `flutter pub get`
flutter pub get
```

### D20. Custom router instead of go_router
**Smell.** Hand-rolled routing on top of `Navigator 2.0`'s `RouterDelegate`/`RouteInformationParser`.
**Why bad.** `Navigator 2.0` raw API is famously hard to get right; `go_router` is the Flutter-team-maintained answer in 2024–2025. Reinventing it costs months.
```dart
// right
final router = GoRouter(routes: [...]);
MaterialApp.router(routerConfig: router);
```

### D21. WillPopScope in new code
**Smell.** Using `WillPopScope` to intercept back gestures.
**Why bad.** Deprecated; doesn't support Android 14+ predictive back. Use `PopScope`.
```dart
// wrong
WillPopScope(onWillPop: () async => false, child: ...);
// right
PopScope(canPop: false, child: ...);
```

### D22. One AnimationController for unrelated animations
**Smell.** Driving fade-in *and* slide-out *and* a progress arc from the same controller for "simplicity".
**Why bad.** Tight coupling; one animation's duration constrains all the others; harder to compose.
```dart
// right: separate controllers, or AnimationController + multiple Tweens with CurvedAnimation
```

### D23. RepaintBoundary cargo-culting
**Smell.** Wrapping every widget in `RepaintBoundary` "for performance".
**Why bad.** Each boundary allocates a layer — sometimes a net loss. Profile with the Performance overlay first; add boundaries only at measured hotspots.
```dart
// don't sprinkle; measure, then add at the few real boundaries
```

### D24. setState for cross-widget state
**Smell.** Bubbling `setState` up multiple parents, or sharing state via `setState` + global singletons.
**Why bad.** The point of `ChangeNotifier`/`ValueListenable`/Riverpod/BLoC is that observers subscribe directly. `setState` fanout rebuilds everything.
```dart
// right
final counterProvider = NotifierProvider<Counter, int>(Counter.new);
```

### D25. God-widget with no extraction
**Smell.** A 1500-line `build` method.
**Why bad.** Hot reload becomes slow, intent is opaque, `const` opportunities are lost, tests cover everything-or-nothing. Extract into named widgets (not helper functions returning `Widget` — those skip element-tree boundaries).
```dart
// wrong: _buildHeader(), _buildBody(), _buildFooter() as methods
// right: HeaderWidget, BodyWidget, FooterWidget — proper StatelessWidgets with const
```

### D26. Unstored Stream.listen
**Smell.** `someStream.listen(handle);` with no subscription saved.
**Why bad.** Can't cancel; runs forever; the closure pins surrounding state. Always store and dispose.
```dart
// right
_sub = stream.listen(_on);
@override void dispose() { _sub.cancel(); super.dispose(); }
```

### D27. Image.network without placeholder/cache
**Smell.** `Image.network(url)` directly in a list.
**Why bad.** Flash of empty box per item; re-downloads on every rebuild because there's no on-disk cache.
```dart
// right
CachedNetworkImage(imageUrl: url, placeholder: (_, __) => const _Skel());
```

### D28. Async in initState without cancellation
**Smell.** `initState() { fetch().then((d) => setState(() => _d = d)); }` and the user navigates away mid-fetch.
**Why bad.** Future completes on a disposed State, throws "setState called after dispose". Store the future or guard with `mounted`.
```dart
// right
late Future<Data> _fut;
@override void initState() { super.initState(); _fut = fetch(); }
// then: FutureBuilder(future: _fut, ...)
```

### D29. Locale changes without router rebuild
**Smell.** Changing app locale via a controller but `MaterialApp.router`'s `locale:` is stale.
**Why bad.** Some screens re-translate, others don't, until full restart. Drive `locale` from a watched provider.
```dart
final locale = ref.watch(localeProvider);
return MaterialApp.router(locale: locale, ...);
```

### D30. Mutable List shared across providers
**Smell.** A Notifier's state is a `List` mutated in place via `state.add(x)` then `state = state` to "force update".
**Reason.** Riverpod uses identity for change detection; mutating in place doesn't change identity, listeners may not fire (and when they do, every consumer rebuilds because the whole list is "new"). Prefer immutable lists from `freezed`/`built_collection`, or always assign a fresh `[...state, x]`.
```dart
// wrong
state.add(x);
state = state;
// right
state = [...state, x];
```

---

## Sources

- [docs.flutter.dev](https://docs.flutter.dev/) — official docs and cookbook
- [Flutter 3.27 release notes](https://docs.flutter.dev/release/release-notes/release-notes-3.27.0)
- [Material 3 + Flutter](https://m3.material.io/develop/flutter)
- [Impeller status](https://docs.flutter.dev/perf/impeller)
- [Riverpod docs](https://riverpod.dev/) — Remi Rousselet
- [flutter_bloc / bloclibrary.dev](https://bloclibrary.dev/)
- [go_router](https://pub.dev/packages/go_router) — Flutter team-maintained
- [freezed](https://pub.dev/packages/freezed), [json_serializable](https://pub.dev/packages/json_serializable)
- [drift](https://pub.dev/packages/drift) — preferred SQL layer in 2025 over uncertain Hive/Isar maintenance
- [pigeon](https://pub.dev/packages/pigeon) — typed platform channels
- [dart:ffi docs](https://dart.dev/guides/libraries/c-interop) — for audio/MIDI native interop
- Andrea Bizzotto, *Code With Andrea* (2024–2025) — Riverpod, go_router, testing
- Filip Hracek talks — Flutter performance and architecture
- `package:flutter_lints` — recommended lint set
