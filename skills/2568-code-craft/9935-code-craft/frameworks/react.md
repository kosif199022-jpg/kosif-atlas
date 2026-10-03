# React 19 — code-craft reference

~50 rules across three buckets. React-only — Next.js-specific rules live in `frameworks/nextjs.md`. Assumes React 19 + modern hooks; legacy class components and pre-hooks patterns omitted intentionally. Server Components are core React 19, not Next-only.

Sources: [react.dev](https://react.dev), [React 19 release notes](https://react.dev/blog/2024/12/05/react-19), Dan Abramov ("You Might Not Need an Effect", "Writing Resilient Components"), TkDodo (TanStack Query), Josh Comeau on RSC.

Loaded by `code-craft` when the user asks about React or pastes React code for review.

---

## A — Tactical (day-to-day patterns)

### A1. One component per file
**Rule.** Put each component in its own file named after it (`UserCard.tsx` exports `UserCard`).
**Reason.** Predictable imports, clean diffs, simpler tree-shaking.
```tsx
// wrong: UserCard.tsx exports UserCard, UserAvatar, UserBadge
// right: separate files
export function UserCard(props: Props) { /* … */ }
```

### A2. Named exports for components
**Rule.** Prefer named exports over `default`.
**Reason.** Refactor-safe renames, no rename drift, better IDE auto-import.
```tsx
// wrong
export default function Button() {}
// right
export function Button() {}
```

### A3. PascalCase components, camelCase hooks
**Rule.** Components are `PascalCase`, hooks start with `use`.
**Reason.** React's runtime + linter rules depend on these conventions.
```tsx
function userCard() {}     // wrong — looks like a util
function UserCard() {}     // right
function GetData() {}      // wrong — not a hook nor JSX
function useUserData() {}  // right
```

### A4. Type props with an explicit interface, not `React.FC`
**Rule.** Declare `Props` as a named type/interface; avoid `React.FC`.
**Reason.** `React.FC` adds implicit children, hides generics, harms inference.
```tsx
// wrong
const Card: React.FC<{ title: string }> = ({ title }) => <h1>{title}</h1>;
// right
type CardProps = { title: string; children?: React.ReactNode };
function Card({ title, children }: CardProps) { return <h1>{title}{children}</h1>; }
```

### A5. Default props via destructuring
**Rule.** Set defaults in the parameter list, not via `defaultProps`.
**Reason.** `defaultProps` on function components is removed in React 19.
```tsx
// wrong
Button.defaultProps = { variant: 'primary' };
// right
function Button({ variant = 'primary' }: { variant?: 'primary' | 'ghost' }) {}
```

### A6. Lift state to the closest common ancestor
**Rule.** When two siblings need the same value, hoist state up — no further.
**Reason.** Higher than necessary causes wide re-renders; lower causes desync.
```tsx
function Parent() {
  const [selected, setSelected] = useState<string | null>(null);
  return <><List onPick={setSelected} /><Detail id={selected} /></>;
}
```

### A7. `useReducer` for related state transitions
**Rule.** Reach for `useReducer` when several `useState` values change together or transitions form a small state machine.
**Reason.** Co-locates transitions, prevents impossible intermediate states.
```tsx
// wrong: 4 booleans, 16 combos, 3 are valid
// right: discriminated union
type S = { tag: 'idle' } | { tag: 'loading' } | { tag: 'error'; err: Error };
```

### A8. Compute derived values in render
**Rule.** Don't store anything you can derive from existing props/state.
**Reason.** Two sources of truth desync; the derived `useState` always lags.
```tsx
// wrong
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(`${first} ${last}`), [first, last]);
// right
const fullName = `${first} ${last}`;
```

### A9. Stable IDs as list keys
**Rule.** Use a stable ID from the data (`item.id`), never the index, never `Math.random()`.
**Reason.** Index keys break reorder/insert; random keys force full remount each render, losing focus, animation, and child state.
```tsx
// wrong
items.map((it, i) => <Row key={i} {...it} />)
// right
items.map((it) => <Row key={it.id} {...it} />)
```

### A10. Beware `&&` with numeric falsy values
**Rule.** Use ternary or explicit boolean coercion when the left side may be `0`, `''`, or `NaN`.
**Reason.** `0 && <X/>` renders the literal `0` in the DOM.
```tsx
// wrong
{cart.length && <Cart />}      // renders "0"
// right
{cart.length > 0 && <Cart />}
{cart.length ? <Cart /> : null}
```

### A11. Early returns over nested ternaries
**Rule.** Guard with `if (...) return ...` for unrelated render branches.
**Reason.** Flat reads better than 3-deep ternaries.
```tsx
// wrong
return loading ? <S/> : error ? <E/> : data ? <D d={data}/> : null;
// right
if (loading) return <S/>;
if (error) return <E/>;
if (!data) return null;
return <D d={data}/>;
```

### A12. Controlled inputs need controlled values
**Rule.** A `value`-bound input must always receive a string (not `undefined`).
**Reason.** Switching `undefined` → string flips React from uncontrolled to controlled and warns.
```tsx
// wrong
<input value={user?.name} onChange={...} />
// right
<input value={user?.name ?? ''} onChange={...} />
```

### A13. Suspense boundaries at meaningful UI seams
**Rule.** Wrap a `<Suspense>` around the smallest unit whose fallback makes UX sense (a card, a panel) — not the whole page.
**Reason.** A single root boundary makes one slow query freeze the whole UI.
```tsx
// wrong
<Suspense fallback={<FullPageSpinner />}><App/></Suspense>
// right
<Layout><Suspense fallback={<CardSkeleton/>}><Feed/></Suspense></Layout>
```

### A14. Error boundaries per feature, not per app
**Rule.** Wrap routes and isolated features in their own error boundary.
**Reason.** A widget crash shouldn't blank the whole app.
```tsx
<Route><ErrorBoundary fallback={<FeedError/>}><Feed/></ErrorBoundary></Route>
```

### A15. `useSyncExternalStore` for non-React stores
**Rule.** Subscribe to anything outside React (Redux, Zustand internals, `window.matchMedia`, browser APIs) via `useSyncExternalStore`.
**Reason.** Tear-free reads under concurrent rendering; replaces the old `useState + useEffect` subscribe pattern.
```tsx
const isDark = useSyncExternalStore(
  (cb) => { const m = matchMedia('(prefers-color-scheme: dark)'); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
  () => matchMedia('(prefers-color-scheme: dark)').matches,
  () => false, // SSR snapshot
);
```

---

## B — React 19 / modern idioms

### B1. Server by default, client at the leaf
**Rule.** Treat components as Server Components unless they need state, effects, browser APIs, or event handlers — then mark with `'use client'` at the smallest leaf.
**Reason.** Smaller bundles; `'use client'` is a *boundary* — everything imported from a client module is also client.
```tsx
// wrong: marking the whole page client
'use client';
export default function Page() { /* mostly static */ }
// right: only the interactive island
// LikeButton.tsx
'use client';
export function LikeButton() { const [n, set] = useState(0); /* … */ }
```

### B2. Server Components can be `async`
**Rule.** Fetch directly inside Server Components with `async/await`; no `useEffect`, no client query lib.
**Reason.** RSCs run once on the server — async is the natural primitive.
```tsx
export default async function Posts() {
  const posts = await db.post.findMany();
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

### B3. `'use server'` marks server actions, not components
**Rule.** `'use server'` at the top of a file (or function) marks server actions callable from client code; it does *not* mark "this is a server component."
**Reason.** Common confusion; `'use server'` exposes a function across the network boundary.
```tsx
// actions.ts
'use server';
export async function createPost(form: FormData) { /* runs on server */ }
```

### B4. `use()` for promises and contexts
**Rule.** Inside a Server Component or a Suspense child, call `use(promise)` to await; call `use(Context)` to read a context conditionally.
**Reason.** `use` is the only hook allowed in conditionals/loops because it suspends.
```tsx
function Profile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <h1>{user.name}</h1>;
}
```

### B5. `useActionState` for form actions
**Rule.** Wire forms to a server action with `useActionState`; read `pending` and the latest result from its return.
**Reason.** Replaces ad-hoc `loading`/`error`/`data` triplets and integrates with progressive enhancement.
```tsx
const [state, formAction, pending] = useActionState(createPost, { error: null });
return <form action={formAction}><input name="title"/><button disabled={pending}>Save</button></form>;
```

### B6. `useFormStatus` from inside form children
**Rule.** Read submission state in a child component with `useFormStatus`; auto-scopes to the nearest parent `<form>`.
**Reason.** Avoids prop-drilling `pending` to every submit button.
```tsx
function Submit() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}
```

### B7. `useOptimistic` for instant UI
**Rule.** Show the predicted result immediately, then reconcile when the server responds.
**Reason.** Perceived latency drops to zero; React auto-reverts on error.
```tsx
const [optimistic, addOptimistic] = useOptimistic(messages, (state, m: Msg) => [...state, m]);
async function send(text: string) { addOptimistic({ id: 'tmp', text }); await sendAction(text); }
```

### B8. `ref` is just a prop now
**Rule.** Pass `ref` as a regular prop in React 19 function components; do not wrap with `forwardRef` in new code.
**Reason.** `forwardRef` is deprecated; codemods exist for migration.
```tsx
// wrong
const Input = forwardRef<HTMLInputElement, Props>((p, ref) => <input ref={ref} {...p} />);
// right
function Input({ ref, ...rest }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...rest} />;
}
```

### B9. Ref callback cleanups
**Rule.** Return a cleanup from a ref callback to undo setup on unmount.
**Reason.** New in React 19; removes the `useEffect` you used to write for DOM observers.
```tsx
<div ref={(node) => {
  if (!node) return;
  const ro = new ResizeObserver(/* … */); ro.observe(node);
  return () => ro.disconnect();
}} />
```

### B10. Render-time `<title>`, `<meta>`, `<link>`
**Rule.** Place document metadata directly in the component tree; React hoists it into `<head>`.
**Reason.** Removes the need for `react-helmet`-style libs.
```tsx
function Article({ post }: { post: Post }) {
  return <><title>{post.title}</title><meta name="description" content={post.excerpt}/>{/*…*/}</>;
}
```

### B11. Resource preloads with the new APIs
**Rule.** Use `preload`, `preinit`, `prefetchDNS` from `react-dom` to hint resources, or render `<link rel="preload">` directly.
**Reason.** Browser starts fetch earlier; works in both Server and Client Components.
```tsx
import { preload } from 'react-dom';
preload('/fonts/inter.woff2', { as: 'font', crossOrigin: 'anonymous' });
```

### B12. `useTransition` for non-urgent updates
**Rule.** Wrap expensive state updates (filters, tab switches, search) in `startTransition` so the input stays responsive.
**Reason.** Marks the update as interruptible; the urgent text input keeps painting.
```tsx
const [isPending, startTransition] = useTransition();
function onChange(e) { setText(e.target.value); startTransition(() => setQuery(e.target.value)); }
```

### B13. Trust the React Compiler — don't pre-memoize
**Rule.** With React Compiler enabled, write plain functions and inline props; only reach for `useMemo`/`useCallback` at interop boundaries (third-party APIs needing stable identity, custom hook deps).
**Reason.** The compiler memoizes correctly; manual memos add noise and frequently introduce bugs.
```tsx
// wrong (compiler era)
const onClick = useCallback(() => save(id), [id]);
const style = useMemo(() => ({ color }), [color]);
// right
const onClick = () => save(id);
const style = { color };
```

### B14. Write compiler-friendly code
**Rule.** Keep components and hooks pure: no mutation of props/state, no I/O during render, follow the Rules of React.
**Reason.** The compiler only memoizes code it can prove is safe; impure code silently opts out.
```tsx
// wrong: mutates a prop
function Cart({ items }) { items.sort(); return <List items={items}/>; }
// right
function Cart({ items }) { const sorted = [...items].sort(); return <List items={sorted}/>; }
```

### B15. Design effects to be StrictMode-safe
**Rule.** Every effect must produce the same end state if it runs setup → cleanup → setup again.
**Reason.** StrictMode in dev intentionally double-invokes effects to surface non-idempotent setup.
```tsx
// wrong: increments on mount, doubles in dev
useEffect(() => { metrics.viewed++; }, []);
// right: idempotent
useEffect(() => { const id = metrics.markViewed(postId); return () => metrics.unmark(id); }, [postId]);
```

### B16. Server → Client composition via `children`
**Rule.** Keep a Client Component shell with a `children` slot, and render Server Components into it from the parent.
**Reason.** You can't import a Server Component from a Client Component, but you *can* pass it as `children`.
```tsx
'use client';
export function Tabs({ children }: { children: React.ReactNode }) { /* state + render */ return <>{children}</>; }
// usage in a Server Component:
// <Tabs><ServerPanel/></Tabs>
```

---

## D — Anti-patterns / smells

### D1. Effects with unstable inline deps
**Rule.** Don't pass inline object/array literals to a `useEffect` dep array.
**Reason.** New identity each render → effect runs every render.
```tsx
// wrong
useEffect(() => fetchUser({ id }), [{ id }]);
// right
useEffect(() => fetchUser({ id }), [id]);
```

### D2. Derived state in `useState`
**Rule.** A `useState` whose only updater is an effect mirroring props is wrong.
**Reason.** Compute it in render; two sources of truth desync.
```tsx
// wrong
const [total, setTotal] = useState(0);
useEffect(() => setTotal(items.reduce((s, i) => s + i.price, 0)), [items]);
// right
const total = items.reduce((s, i) => s + i.price, 0);
```

### D3. Storing props in state
**Rule.** Don't `useState(props.value)` then sync with `useEffect`.
**Reason.** Use the prop directly, or use the `key` prop to reset state when an identity changes.
```tsx
// wrong
const [val, setVal] = useState(props.initialValue);
useEffect(() => setVal(props.initialValue), [props.initialValue]);
// right: reset by remount via key
<Form key={userId} initialValue={user.name} />
```

### D4. Many `useState` that should be one reducer
**Rule.** When 5+ booleans/strings always change together, replace with `useReducer` and a discriminated union.
**Reason.** State machine prevents impossible intermediate combinations (see A7).

### D5. Index as key
**Rule.** Don't use `key={index}` on reorderable/insertable lists.
**Reason.** Insert at top reuses wrong DOM nodes; loses focus, animation, child state.
```tsx
// wrong
{items.map((it, i) => <Row key={i} {...it}/>)}
// right
{items.map((it) => <Row key={it.id} {...it}/>)}
```

### D6. Mutating state directly
**Rule.** Never `state.push(x)` or `obj.foo = 1` then `setObj(obj)`.
**Reason.** React's bail-out compares identity — same reference → no re-render.
```tsx
// wrong
todos.push(t); setTodos(todos);
// right
setTodos([...todos, t]);
```

### D7. `useEffect` for data fetching
**Rule.** Don't fetch initial data with `useEffect` in a Client Component.
**Reason.** No cancellation, dedup, retries, focus-refetch, or race-condition handling. Use Server Components or TanStack Query / SWR.
```tsx
// wrong
useEffect(() => { fetch(`/api/u/${id}`).then(r => r.json()).then(setUser); }, [id]);
// right (client)
const { data: user } = useQuery({ queryKey: ['user', id], queryFn: () => api.user(id) });
```

### D8. `useEffect` to sync two pieces of state
**Rule.** When state A changes, don't use an effect to update state B.
**Reason.** Lift to a single source of truth; derive the rest.
```tsx
// wrong
useEffect(() => { setTotal(a + b); }, [a, b]);
// right
const total = a + b;
```

### D9. Context for fast-changing values
**Rule.** Don't put mouse position / scroll offset in `Context`.
**Reason.** Every change re-renders the whole subtree. Use an external store + `useSyncExternalStore`, or split read/write contexts.
```tsx
// wrong: every mousemove re-renders subscribers
<MouseContext.Provider value={{ x, y }}>…
// right: external store, components select what they need
const x = useMouseStore(s => s.x);
```

### D10. Conditional hooks
**Rule.** Always call hooks in the same order at the top — never inside `if`, loops, or after early `return`.
**Reason.** React identifies hooks by call order; conditional calls corrupt state. (`use()` is the only exception.)
```tsx
// wrong
if (open) useEffect(() => log(), []);
// right
useEffect(() => { if (!open) return; log(); }, [open]);
```

### D11. Render prop / HOC pyramid
**Rule.** Don't nest render props or HOCs when custom hooks can compose flat.
**Reason.** Hooks return values directly; pyramids hide flow and harm types.
```tsx
// wrong
<UserLoader>{u => <PostLoader user={u}>{p => <View u={u} p={p}/>}</PostLoader>}</UserLoader>
// right
const u = useUser(); const p = usePosts(u?.id); return <View u={u} p={p}/>;
```

### D12. JSX through props instead of `children`
**Rule.** Use `children` for the primary slot; reserve named props for *additional* slots.
**Reason.** `children` is the canonical primary slot — clearer to read and debug.
```tsx
// wrong
<Modal content={<Form/>}/>
// right
<Modal><Form/></Modal>
```

### D13. Cargo-cult `useMemo` / `useCallback`
**Rule.** Don't wrap every callback and value "just in case" without measurement.
**Reason.** With React Compiler, delete them. Without it, add only after profiling shows a real problem and a `memo`-wrapped consumer.
```tsx
// wrong
const items = useMemo(() => [1, 2, 3], []); // pointless
// right
const items = [1, 2, 3];
```

### D14. Random or time-based keys
**Rule.** Never `key={Math.random()}`, `key={Date.now()}`, or `key={JSON.stringify(item)}`.
**Reason.** Forces unmount + remount every render — loses all child state.
```tsx
// wrong
items.map(it => <Row key={Math.random()} {...it}/>)
// right
items.map(it => <Row key={it.id} {...it}/>)
```

### D15. `document.querySelector` instead of refs
**Rule.** Don't reach into the DOM by selector from a component.
**Reason.** Attach a `ref`; React owns its tree; selectors break under SSR/Strict/portals.
```tsx
// wrong
useEffect(() => { document.querySelector('#email')?.focus(); }, []);
// right
const ref = useRef<HTMLInputElement>(null);
useEffect(() => ref.current?.focus(), []);
return <input ref={ref} id="email"/>;
```

### D16. Browser APIs in render body
**Rule.** Don't call `localStorage.getItem(...)` or `window.matchMedia(...)` during render.
**Reason.** SSR has no `window`; render body must be deterministic. Read inside `useEffect` (client-only) or via `useSyncExternalStore` with a server snapshot.
```tsx
// wrong
const theme = localStorage.getItem('theme'); // crashes on server
// right
const [theme, setTheme] = useState<string|null>(null);
useEffect(() => setTheme(localStorage.getItem('theme')), []);
```

### D17. `<div onClick>` instead of `<button>`
**Rule.** Use the right semantic element; don't fake clickable elements with `<div>`.
**Reason.** Semantic HTML gets focus, ARIA, keyboard support, and screen reader recognition for free.
```tsx
// wrong
<div onClick={save}>Save</div>
// right
<button type="button" onClick={save}>Save</button>
```

### D18. Client-only effects to read URL/router state
**Rule.** Don't `useEffect(() => setQuery(new URLSearchParams(location.search).get('q')))`.
**Reason.** Read from the framework router (params, searchParams) or pass through Server Component props; URL is server-knowable.

### D19. Prop drilling vs misused context
**Rule.** Threading the same prop through 5 layers — or putting per-row state in global context — both wrong.
**Reason.** Context for app-wide identity (theme, current user, locale). Props for everything else. Composition with `children` avoids most drilling.

### D20. Resetting via state instead of `key`
**Rule.** Don't write multiple `useEffect`s zeroing out fields when a different record loads.
**Reason.** Remount with `key={recordId}` — React resets all state for free.
```tsx
// wrong: 6 effects clearing fields when userId changes
// right
<EditUserForm key={userId} user={user}/>
```

---

## Sources

- [React docs — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React docs — `'use client'` directive](https://react.dev/reference/rsc/use-client)
- [React docs — `useActionState`](https://react.dev/reference/react/useActionState)
- [React docs — `useOptimistic`](https://react.dev/reference/react/useOptimistic)
- [React docs — React Compiler](https://react.dev/learn/react-compiler/introduction)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
- [TkDodo — You Might Not Need React Query](https://tkdodo.eu/blog/you-might-not-need-react-query)
- [TkDodo — Simplifying useEffect](https://tkdodo.eu/blog/simplifying-use-effect)
- [Josh Comeau — Making Sense of React Server Components](https://www.joshwcomeau.com/react/server-components/)
- [Dan Abramov — Writing Resilient Components](https://overreacted.io/writing-resilient-components/)
