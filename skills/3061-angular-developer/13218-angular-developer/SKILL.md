---
name: angular-developer
description: Expert Angular v20 developer skill. Covers Signals, Components, Templates, Directives, DI, Routing, Forms, HTTP Client, SSR/Hydration, Testing, i18n, Animations, Drag and Drop, and Best Practices (Style Guide, Security, Accessibility, Error Handling, Performance, Updates). Trigger on any mention of Angular, component, directive, signal, template, routing, guard, resolver, pipe, service, dependency injection, standalone, SSR, hydration, change detection, OnPush, zoneless, reactive forms, HttpClient, interceptor, i18n, CDK, drag-drop, or Angular CLI commands (ng generate, ng build, ng serve, ng test, ng update). Also trigger for angular.json, tsconfig, or Angular file conventions (.component.ts, .service.ts, .pipe.ts, .spec.ts). Even if the user just says "build this in Angular" or "why is my Angular app broken" — trigger immediately.
---

# Angular Developer Skill (v20)

## Purpose

This skill provides comprehensive Angular v20 reference documentation scraped directly from the official `v20.angular.dev` docs. Use it for any Angular development task — writing components, debugging, architecting features, optimizing performance, or following best practices.

## How to Use

When the user is working on an Angular task, identify which topic applies and **read the corresponding reference file** before responding. Multiple reference files may apply to a single task — read all relevant ones.

## Reference Files

All reference files are located in `references/` relative to this SKILL.md.

### In-depth Guides

| Topic | File | When to read |
|---|---|---|
| **Signals — Overview** | `references/signals/overview.md` | `signal()`, `computed()`, `effect()`, `untracked()`, equality functions, OnPush integration |
| **Signals — linkedSignal** | `references/signals/linked-signal.md` | `linkedSignal()`, dependent writable state, source+computation form, previous value |
| **Signals — resource** | `references/signals/resource.md` | `resource()`, async reactivity, params, loader, abort, reload, `ResourceStatus`, `httpResource` |
| **Components — Overview** | `references/components/overview.md` | Component anatomy, `@Component` decorator, metadata, standalone components, imports, host element, view, component tree |
| **Components — Selectors** | `references/components/selectors.md` | Type/attribute/class selectors, `:not`, combining selectors, selector prefixes, attribute selector use-cases |
| **Components — Styling** | `references/components/styling.md` | Inline vs file styles, `ViewEncapsulation` (Emulated/ShadowDom/None), `:host`, `::ng-deep`, `<style>` in templates, external style refs |
| **Components — Inputs** | `references/components/inputs.md` | Signal `input()`, `input.required()`, transforms, aliases, `model()` for two-way, `@Input` decorator, getters/setters |
| **Components — Outputs** | `references/components/outputs.md` | Signal `output()`, emitting data, aliases, programmatic subscribe, `@Output`/`EventEmitter` |
| **Components — Content Projection** | `references/components/content-projection.md` | `<ng-content>`, multiple slots with `select`, fallback content, `ngProjectAs` |
| **Components — Host Elements** | `references/components/host-elements.md` | `host` property, attribute/class/style/event bindings, `@HostBinding`/`@HostListener`, binding collisions, CSS custom properties, `HostAttributeToken` |
| **Components — Lifecycle** | `references/components/lifecycle.md` | All lifecycle hooks order and details, `ngOnChanges`/`SimpleChanges`, `DestroyRef`, `afterNextRender`/`afterEveryRender` phases |
| **Components — Queries** | `references/components/queries.md` | `viewChild`/`viewChildren`, `contentChild`/`contentChildren`, required queries, locators, `read` option, `descendants`, `@ViewChild`/`@ContentChild`/`QueryList` |
| **Components — DOM APIs** | `references/components/dom-apis.md` | `ElementRef`, render callbacks, `Renderer2`, when/when-not to use DOM APIs, XSS risk of `innerHTML` |
| **Components — Inheritance** | `references/components/inheritance.md` | Extending components/directives, inherited metadata, forwarding DI deps, overriding lifecycle methods |
| **Components — Programmatic Rendering** | `references/components/programmatic-rendering.md` | `NgComponentOutlet`, `ViewContainerRef.createComponent`, lazy-loading, `inputBinding`/`outputBinding`/`twoWayBinding`, popup pattern with `createComponent` + `hostElement` |
| **Components — Advanced Config** | `references/components/advanced-configuration.md` | `ChangeDetectionStrategy.OnPush`, `preserveWhitespaces`, `CUSTOM_ELEMENTS_SCHEMA` |
| **Components — Custom Elements** | `references/components/elements.md` | `@angular/elements`, `createCustomElement()`, input→attribute mapping, output→custom event, typings with `NgElement`/`WithProperties` |
| **Templates — Overview** | `references/templates/overview.md` | Template syntax overview, differences from HTML, what topics templates cover |
| **Templates — Binding** | `references/templates/binding.md` | Text interpolation `{{ }}`, property `[]`, attribute `[attr.]`, CSS class/style bindings, signal-based updates |
| **Templates — Event Listeners** | `references/templates/event-listeners.md` | `(event)` syntax, `$event`, key modifiers, `preventDefault`, custom event plugins via `EVENT_MANAGER_PLUGINS` |
| **Templates — Two-Way Binding** | `references/templates/two-way-binding.md` | `[()]` banana-in-a-box, `ngModel` with `FormsModule`, component two-way binding with `model()` |
| **Templates — Control Flow** | `references/templates/control-flow.md` | `@if`/`@else if`/`@else`, `as` alias, `@for` with `track`, contextual vars, `@empty`, `@switch` |
| **Templates — Pipes** | `references/templates/pipes.md` | Built-in pipes, `\|` operator, chaining, parameters, pure vs impure, custom pipes with `@Pipe` decorator |
| **Templates — ng-content** | `references/templates/ng-content.md` | Content projection, `<ng-content />` slot, parent→child content rendering |
| **Templates — ng-template** | `references/templates/ng-template.md` | Template fragments, `TemplateRef`, `#ref` on `ng-template`, `NgTemplateOutlet`, `ViewContainerRef.createEmbeddedView`, context params, structural directives |
| **Templates — ng-container** | `references/templates/ng-container.md` | Grouping without DOM nodes, `NgComponentOutlet`, `NgTemplateOutlet`, structural directives, DI injection via container |
| **Templates — Variables** | `references/templates/variables.md` | `@let` local vars, scope, non-reassignable, template reference vars `#name`, `exportAs`, use with queries |
| **Templates — @defer** | `references/templates/defer.md` | Deferrable views, lazy loading, `@placeholder`/`@loading`/`@error`, triggers (`idle`/`viewport`/`interaction`/`hover`/`immediate`/`timer`/`when`), prefetch, testing, SSR/HMR notes |
| **Templates — Expression Syntax** | `references/templates/expression-syntax.md` | Supported/unsupported literals, globals, operators, optional chaining quirk, no declarations, statement vs expression differences |
| **Templates — Whitespace** | `references/templates/whitespace.md` | Default whitespace collapsing, `preserveWhitespaces`, `&ngsp;` entity |
| **Directives — Overview** | `references/directives/overview.md` | Built-in directives, `NgClass`, `NgStyle`, `NgModel`, `NgIf`, `NgFor` (`trackBy`), `NgSwitch`, `<ng-container>` |
| **Directives — Attribute Directives** | `references/directives/attribute-directives.md` | Custom attribute directives, `ElementRef`, `host` event bindings, `input()` for passing values, `NgNonBindable` |
| **Directives — Structural Directives** | `references/directives/structural-directives.md` | `<ng-template>`, shorthand `*` syntax, microsyntax grammar, creating structural directives, `TemplateRef`/`ViewContainerRef`, template type guards (`ngTemplateGuard_`, `ngTemplateContextGuard`) |
| **Directives — Composition API** | `references/directives/directive-composition-api.md` | `hostDirectives`, including/aliasing inputs and outputs, composing directives on directives, execution order, DI with host directives |
| **Directives — NgOptimizedImage** | `references/directives/image-optimization.md` | `NgOptimizedImage`, `ngSrc`, `priority`, `fill` mode, `width`/`height`, placeholders, `srcset`, loaders (built-in and custom), `loaderParams`, LCP optimization |
| **Dependency Injection — Overview** | `references/dependency-injection/overview.md` | DI concepts, what services are, `inject()` function, valid injection contexts |
| **Dependency Injection — Creating Services** | `references/dependency-injection/creating-and-using-services.md` | `ng generate service`, `@Injectable`, `providedIn: 'root'`, injecting into components and services |
| **Dependency Injection — Defining Providers** | `references/dependency-injection/defining-dependency-providers.md` | `InjectionToken`, `useClass`/`useValue`/`useFactory`/`useExisting`, `multi`, provider scopes (app/component/route), `provide*` library pattern |
| **Dependency Injection — Injection Context** | `references/dependency-injection/injection-context.md` | What contexts allow `inject()`, `runInInjectionContext`, `assertInInjectionContext`, NG0203 error |
| **Dependency Injection — Hierarchical Injectors** | `references/dependency-injection/hierarchical-dependency-injection.md` | `EnvironmentInjector` vs `ElementInjector`, resolution rules, modifiers (`optional`/`self`/`skipSelf`/`host`), `providers` vs `viewProviders`, logical template tree, use-case scenarios |
| **Dependency Injection — Lightweight Tokens** | `references/dependency-injection/lightweight-injection-tokens.md` | Token retention problem, abstract class pattern, `useExisting`, tree-shaking for libraries |
| **Dependency Injection — DI in Action** | `references/dependency-injection/di-in-action.md` | `ElementRef` for DOM access, `forwardRef()` for circular dependencies |
| **Routing — Overview** | `references/routing/overview.md` | What Angular Router is, the three parts of routing (routes/outlets/links), available features overview |
| **Routing — Define Routes** | `references/routing/define-routes.md` | `Routes`, static/parameterized/wildcard paths, `provideRouter`, `loadComponent` lazy loading, redirects, page titles, `TitleStrategy`, route-level providers, static data, nested/child routes |
| **Routing — Outlets** | `references/routing/show-routes-with-outlets.md` | `RouterOutlet`, nested outlets, named secondary outlets, outlet lifecycle events (`activate`/`deactivate`/`attach`/`detach`), `routerOutletData`/`ROUTER_OUTLET_DATA` |
| **Routing — Navigation** | `references/routing/navigate-to-routes.md` | `RouterLink`, absolute vs relative paths, string vs array syntax, `router.navigate()`, `router.navigateByUrl()`, `relativeTo`, `replaceUrl` |
| **Routing — Read Route State** | `references/routing/read-route-state.md` | `ActivatedRoute`, route snapshots, route params, query params, matrix params, `RouterLinkActive`, `routerLinkActiveOptions`, `ariaCurrentWhenActive` |
| **Routing — Redirects** | `references/routing/redirecting-routes.md` | `redirectTo`, `pathMatch: 'prefix'`/`'full'`, conditional redirects with `RedirectFunction` |
| **Routing — Guards** | `references/routing/route-guards.md` | `CanActivate`, `CanActivateChild`, `CanDeactivate`, `CanMatch`, guard return types, `UrlTree`/`RedirectCommand`, applying guards, `ng generate guard` |
| **Routing — Resolvers** | `references/routing/data-resolvers.md` | `ResolveFn`, `resolve` route config, accessing data via `ActivatedRoute` or `withComponentInputBinding`, error handling (`withNavigationErrorHandler`, `RedirectCommand`), parent→child resolver data |
| **Routing — Lifecycle & Events** | `references/routing/lifecycle-and-events.md` | All router events in order, subscribing to `Router.events`, `withDebugTracing`, loading indicators, analytics, error handling patterns |
| **Routing — Testing** | `references/routing/testing.md` | `RouterTestingHarness`, testing route params/guards/outlets/nested routes/query params, best practices (don't mock Angular Router) |
| **Routing — Common Tasks** | `references/routing/common-router-tasks.md` | `withComponentInputBinding`, 404 page, link parameters array, `LocationStrategy`, `PathLocationStrategy` vs `HashLocationStrategy`, `<base href>` |
| **Routing — UrlMatcher** | `references/routing/routing-with-urlmatcher.md` | `UrlMatcher`, custom route matching functions, `UrlSegment`, `posParams`, use cases (social handles, version URLs) |
| **Routing — Rendering Strategies** | `references/routing/rendering-strategies.md` | CSR vs SSG vs SSR trade-offs, decision matrix, hydration overview |
| **Routing — Customizing Behavior** | `references/routing/customizing-route-behavior.md` | `withRouterConfig` options (`canceledNavigationResolution`, `onSameUrlNavigation`, `paramsInheritanceStrategy`, `urlUpdateStrategy`, `defaultQueryParamsHandling`), `RouteReuseStrategy`, preloading strategies, `UrlHandlingStrategy`, custom matchers |
| **Routing — Reference** | `references/routing/router-reference.md` | Complete router events table, all router terminology, `<base href>`, `HashLocationStrategy` |
| **Routing — View Transitions** | `references/routing/route-transition-animations.md` | `withViewTransitions`, View Transitions API integration, CSS animation customization, `onViewTransitionCreated`, `skipTransition()` |
| **Forms — Overview** | `references/forms/overview.md` | Choosing between reactive vs template-driven, key differences, common foundation classes (`FormControl`/`FormGroup`/`FormArray`/`ControlValueAccessor`), data flow, mutability, testing comparison |
| **Forms — Reactive Forms** | `references/forms/reactive-forms.md` | `FormControl`, `FormGroup`, `FormArray`, `FormBuilder`, `setValue`/`patchValue`, `formControlName`/`formGroupName`/`formArrayName`, `events` observable, unified state change events, type guard utilities (`isFormControl` etc.) |
| **Forms — Typed Forms** | `references/forms/typed-forms.md` | Strictly typed reactive forms (Angular 14+), nullability, `nonNullable`, explicit type params, `FormRecord`, `UntypedFormGroup`/`UntypedFormControl`, `NonNullableFormBuilder` |
| **Forms — Template-Driven** | `references/forms/template-driven-forms.md` | `NgModel`, `NgForm`, `NgModelGroup`, two-way binding with `[(ngModel)]`, `#ref="ngModel"`, control state CSS classes (`ng-valid`/`ng-dirty`/`ng-touched`), `ngSubmit`, form reset |
| **Forms — Validation** | `references/forms/form-validation.md` | Built-in validators, custom sync/async validators (`ValidatorFn`/`AsyncValidatorFn`), `NG_VALIDATORS`/`NG_ASYNC_VALIDATORS`, cross-field validation, control status CSS classes, `updateOn` (`change`/`blur`/`submit`), `ngNativeValidate` |
| **Forms — Dynamic Forms** | `references/forms/dynamic-forms.md` | Metadata-driven form generation, `QuestionBase` pattern, `QuestionControlService`, `@switch` on `controlType`, `computed()` signal for `FormGroup`, runtime add/remove controls |
| **HTTP Client — Overview** | `references/http-client/overview.md` | What `HttpClient` provides, feature summary |
| **HTTP Client — Setup** | `references/http-client/setup.md` | `provideHttpClient`, `withFetch`, `withInterceptors`, `withInterceptorsFromDi`, `withRequestsMadeViaParent`, `withJsonpSupport`, XSRF options, NgModule equivalents |
| **HTTP Client — Making Requests** | `references/http-client/making-requests.md` | GET/POST/PUT/DELETE, typed responses, `responseType`, `params`, `headers`, `observe`, progress events, error handling, timeouts, advanced fetch options (cache/priority/mode/credentials/redirect/referrer/integrity), cold Observables, best practices |
| **HTTP Client — httpResource** | `references/http-client/http-resource.md` | `httpResource()` reactive wrapper, signal-based status/response, response types, Zod/Valibot parse option, testing |
| **HTTP Client — Interceptors** | `references/http-client/interceptors.md` | Functional interceptors, `withInterceptors`, response interception, cloning requests, `inject()` in interceptors, `HttpContextToken`, synthetic responses, redirect info, DI-based interceptors |
| **HTTP Client — Testing** | `references/http-client/testing.md` | `provideHttpClientTesting`, `HttpTestingController`, `expectOne`/`match`/`expectNone`, flushing, error testing, testing interceptors |
| **Server-Side & Hybrid Rendering — Overview** | `references/ssr-hydration/overview.md` | Summary of SSR/SSG/CSR strategies and guide links |
| **Server-Side & Hybrid Rendering — SSR** | `references/ssr-hydration/ssr.md` | `ng new --ssr`, `ng add @angular/ssr`, `RenderMode`, server routing, parameterized prerendering, fallback strategies, headers/status codes, server-compatible components, `DOCUMENT` token, `REQUEST`/`RESPONSE_INIT`, `HttpClient` transfer cache, Node.js/non-Node.js server config |
| **Server-Side & Hybrid Rendering — Hydration** | `references/ssr-hydration/hydration.md` | `provideClientHydration`, event replay (`withEventReplay`), DOM constraints, `ngSkipHydration`, i18n hydration, app stability, third-party library issues |
| **Server-Side & Hybrid Rendering — Incremental Hydration** | `references/ssr-hydration/incremental-hydration.md` | `withIncrementalHydration`, hydrate triggers (`on idle/viewport/interaction/hover/immediate/timer`, `when`, `never`), nested blocks, `@placeholder` requirements |
| **Testing — Overview** | `references/testing/overview.md` | `ng test`, Jasmine/Karma setup, CLI config, `karma.conf.js`, CI testing with ChromeHeadless |
| **Testing — Code Coverage** | `references/testing/code-coverage.md` | `--code-coverage`, coverage reports, enforcing minimums with `karma.conf.js` `check` property |
| **Testing — Services** | `references/testing/services.md` | Testing services with/without `TestBed`, spies, `TestBed.inject()`, `fakeAsync`/`tick`, `waitForAsync`, `HttpClientTestingModule`, `HttpTestingController` |
| **Testing — Components Basics** | `references/testing/components-basics.md` | `ComponentFixture`, `createComponent()`, `detectChanges()`, `nativeElement`, `DebugElement`, `By.css()` |
| **Testing — Components Scenarios** | `references/testing/components-scenarios.md` | Component binding, auto change detection, `dispatchEvent()`, external templates, service dependencies, `fakeAsync`, nested components, `overrideComponent`, page objects, `waitForAsync` |
| **Testing — Attribute Directives** | `references/testing/attribute-directives.md` | Test component pattern, `By.directive()`, `:not` selector, injector access, `DebugElement.properties/styles/providerTokens` |
| **Testing — Pipes** | `references/testing/pipes.md` | Isolated pipe tests (no TestBed needed), DOM tests that verify pipe integration in templates |
| **i18n — Overview** | `references/i18n/overview.md` | i18n vs l10n concepts, localization workflow summary, what the full i18n pipeline looks like |
| **i18n — Add Package** | `references/i18n/add-package.md` | `ng add @angular/localize`, `--use-at-runtime`, effect on `package.json` and `tsconfig` |
| **i18n — Locale IDs** | `references/i18n/locale-id.md` | Unicode locale ID format, BCP 47, CLDR, setting `sourceLocale` in `angular.json` |
| **i18n — Format Data** | `references/i18n/format-data-locale.md` | `DatePipe`, `CurrencyPipe`, `DecimalPipe`, `PercentPipe`, `LOCALE_ID`, overriding locale per-pipe |
| **i18n — Prepare Component** | `references/i18n/prepare.md` | `i18n` attribute, `i18n-{attr}`, `$localize`, metadata format `meaning\|description@@id`, ICU `plural`/`select`/nested expressions |
| **i18n — Translation Files** | `references/i18n/translation-files.md` | `ng extract-i18n`, output formats (XLIFF/JSON/ARB/XMB), creating per-locale files, XLIFF `<trans-unit>` structure, translating plurals/select/nested |
| **i18n — Merge** | `references/i18n/merge.md` | `"localize"` option in `angular.json`, `ng build --localize`, locale-specific configs, `ng serve` single-locale limit, `i18nMissingTranslation` warning levels |
| **i18n — Deploy** | `references/i18n/deploy.md` | Subdirectory per locale, `subPath`, `Accept-Language` header detection, Nginx and Apache config examples, SSR auto-redirect |
| **i18n — Global Variants** | `references/i18n/import-global-variants.md` | `@angular/common/locales/global/*`, manual import in `main.ts`, when automatic vs manual import applies |
| **i18n — Custom IDs** | `references/i18n/manage-marked-text.md` | `@@` prefix for stable IDs, trade-offs vs auto-generated IDs, uniqueness requirement |
| **i18n — Example App** | `references/i18n/example.md` | Full working example with `fr-CA`/`en-US`, complete `app.component.html`, `app.component.ts`, and `messages.fr.xlf` |
| **Animations — Enter/Leave** | `references/animations/overview.md` | `animate.enter`/`animate.leave` (v20 new API), `AnimationCallbackEvent`, `animationComplete()`, `MAX_ANIMATION_TIMEOUT`, testing, legacy compatibility |
| **Animations — CSS** | `references/animations/css.md` | CSS keyframe animations, transitions, `@starting-style`, state/style toggling, auto-height, staggering, parallel animations, reordering lists, disabling animations, programmatic control via `getAnimations()` |
| **Animations — Route Transitions** | `references/animations/route-transitions.md` | View Transitions API, `withViewTransitions`, `enableViewTransitions`, CSS pseudo-elements `::view-transition-old/new`, `onViewTransitionCreated`, `skipTransition`, global styles requirement |
| **Drag and Drop** | `references/drag-drop/overview.md` | CDK `cdkDrag`/`cdkDropList`, reorderable lists, transfer between lists, `cdkDropListGroup`, copying items (`cdkDropListHasAnchor`), drag handles, custom preview/placeholder, axis locking, boundaries, delay, disable, orientation (vertical/horizontal/mixed), sort predicates, `CDK_DRAG_CONFIG`, scrollable containers |

### Best Practices

| Topic | File | When to read |
|---|---|---|
| **Style Guide** | `references/style-guide/style-guide.md` | Naming conventions, project structure, `inject()` preference, component/directive patterns, `protected`/`readonly` usage, event handler naming, lifecycle interfaces |
| **Security** | `references/best-practices/security.md` | XSS prevention, sanitization contexts, `DomSanitizer`/`bypassSecurityTrust*`, CSP, Trusted Types, AOT compiler security, XSRF/CSRF, XSSI |
| **Accessibility** | `references/best-practices/accessibility.md` | ARIA attribute binding (`attr.`), Angular Material/CDK a11y tools, native element patterns, focus management after navigation, `ariaCurrentWhenActive`, `@defer` accessibility, custom accessible components |
| **Unhandled Errors** | `references/best-practices/error-handling.md` | `ErrorHandler`, what Angular catches vs. doesn't, async error handling, `provideBrowserGlobalErrorListeners()`, SSR error listeners, TestBed error rethrowing |
| **Performance — Overview** | `references/best-practices/performance-overview.md` | Change detection fundamentals, overview of performance subtopics and tools |
| **Performance — Zone Pollution** | `references/best-practices/zone-pollution.md` | Zone.js pollution, `runOutsideAngular`, third-party lib init, re-entering the zone, `NgZone.isInAngularZone()` |
| **Performance — Slow Computations** | `references/best-practices/slow-computations.md` | Profiling with DevTools, pure pipes, memoization, avoiding repaints in lifecycle hooks |
| **Performance — Skipping Subtrees** | `references/best-practices/skipping-subtrees.md` | `OnPush` strategy, change detection scenarios, `markForCheck`, object reference mutations |
| **Performance — Chrome DevTools** | `references/best-practices/profiling-chrome-devtools.md` | `enableProfiling()`, Angular custom track, color coding, bootstrap/component/CD profiling |
| **Performance — Zoneless** | `references/best-practices/zoneless.md` | `provideZonelessChangeDetection`, removing ZoneJS, `PendingTasks`, `OnPush` compatibility, testing with `whenStable()` |
| **Keeping Up to Date** | `references/updates/keeping-up-to-date.md` | `ng update`, `ng version`, Angular Update Guide, changelog, version support policy |

## Routing Logic

When a user asks about Angular, follow this decision tree:

1. **Identify the primary topic** from the user's question
2. **Read the matching reference file(s)** — multiple may apply (e.g., a form validation question may need both `forms.md` and `components.md`)
3. **For best practices questions**, also read the relevant best practices file alongside the technical reference
4. **For architecture/design questions**, read `style-guide.md` + the relevant technical reference(s)
5. **Answer using the reference content** — cite Angular v20 patterns, APIs, and conventions

### Common Multi-File Lookups

| User's Task | Read These |
|---|---|
| Building a form component | `forms/overview.md` + `forms/reactive-forms.md` + `components/inputs.md` + `components/outputs.md` |
| Setting up authentication | `routing/route-guards.md` + `http-client/interceptors.md` |
| SSR with hydration | `ssr-hydration/ssr.md` + `ssr-hydration/hydration.md` + `routing/rendering-strategies.md` |
| Optimizing a slow app | `best-practices/performance-overview.md` + `best-practices/zone-pollution.md` + `best-practices/slow-computations.md` + `best-practices/skipping-subtrees.md` + `signals/overview.md` |
| Writing tests | `testing/overview.md` + `testing/services.md` or `testing/components-basics.md` + `testing/components-scenarios.md` as needed |
| Accessible forms | `best-practices/accessibility.md` + `forms/overview.md` + `forms/form-validation.md` |
| Drag-and-drop list | `drag-drop/overview.md` + `animations/css.md` (if animated) |
| Lazy loading | `templates/defer.md` (@defer) + `routing/define-routes.md` (loadComponent) |
| Security review | `best-practices/security.md` + `http-client/interceptors.md` (XSRF) |
| i18n setup | `i18n/overview.md` + `i18n/add-package.md` + `i18n/prepare.md` + `i18n/translation-files.md` + `i18n/merge.md` |
| i18n deploying/serving | `i18n/deploy.md` + `i18n/import-global-variants.md` |
| i18n custom IDs | `i18n/manage-marked-text.md` |
| Updating Angular version | `updates/keeping-up-to-date.md` |
| Component lifecycle | `components/lifecycle.md` |
| Dynamic/programmatic rendering | `components/programmatic-rendering.md` |
| Two-way binding / model inputs | `components/inputs.md` |
| Shadow DOM / style isolation | `components/styling.md` |
| Child queries / ViewChild | `components/queries.md` |
| Web Components / Angular Elements | `components/elements.md` |

## Important Notes

- This skill targets **Angular v20** — APIs and patterns are specific to this version
- Angular v20 uses **standalone components by default** (no NgModules for new code)
- The new **`animate.enter`/`animate.leave`** API replaces legacy `@angular/animations` for new components
- **Signals are the recommended reactivity model** — prefer over plain properties and RxJS where appropriate
- When in doubt between approaches, prefer: signals > computed > effect > RxJS
