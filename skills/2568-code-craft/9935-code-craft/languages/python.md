# Python — code-craft reference

~60 rules across three buckets. Sources: *Effective Python* (Slatkin, 3rd ed., 2024), PEPs 8 / 257 / 484 / 604 / 621 / 646 / 695 / 727, Python 3.11/3.12/3.13 release notes, Pydantic v2 docs, Astral docs (`ruff`, `uv`, `ty`), Hynek Schlawack (`attrs`), Brandon Rhodes "Python Patterns", Real Python. Targets Python 3.12+; some rules note 3.11+ availability.

Loaded by `code-craft` when the user asks about Python or pastes Python for review. Framework patterns (FastAPI, Django, Flask) live under `frameworks/`.

---

## A — Tactical (day-to-day patterns)

### A1. `src/` layout
**Rule.** Put your package under `src/<package>/__init__.py`; tests parallel in `tests/`.
**Reason.** Forces installs to test the *installed* package, not the working dir; catches missing-data and import-path bugs early.
```
myproj/
  pyproject.toml
  src/myproj/__init__.py
  tests/test_thing.py
```

### A2. `pyproject.toml` is the source of metadata
**Rule.** All project metadata, deps, and tool config live in `pyproject.toml` (PEP 621). No `setup.py` for new projects.
**Reason.** One canonical file; `setup.py` is legacy and runs arbitrary code on install.
```toml
[project]
name = "myproj"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = ["httpx>=0.27"]
```

### A3. Use `uv` (or `hatch`/`pdm`) for envs and deps
**Rule.** Manage envs and deps with `uv`; fall back to `hatch` or `pdm` if you need their plugin ecosystems. Plain `pip` + `venv` is fine but slow.
**Reason.** `uv` resolves and installs ~10–100× faster, locks reproducibly, and replaces `pip`, `pip-tools`, `virtualenv`, and `pyenv`. Source: Astral docs; `uv` 1.0 GA.
```bash
# right
uv venv && uv add httpx && uv sync
# legacy
python -m venv .venv && pip install -r requirements.txt
```

### A4. Commit lockfiles for apps, not libraries
**Rule.** Apps commit `uv.lock` / `poetry.lock`; libraries don't lock — they pin ranges in `pyproject.toml`.
**Reason.** Apps need reproducible deploys; libraries need to compose with downstream resolution.
```
# app repo: uv.lock committed
# library repo: dependencies = ["httpx>=0.27,<1.0"], no lock
```

### A5. `.venv` in `.gitignore`
**Rule.** Never commit virtual environments; one-line `.venv/` in `.gitignore`.
**Reason.** Path-dependent, OS-dependent, huge.

### A6. PEP 8 naming
**Rule.** `snake_case` functions/variables, `CapWords` classes, `UPPER_SNAKE` true constants, `_leading_underscore` module-private.
**Reason.** Universal Python convention; `ruff`'s `N` rules flag deviations.
```python
MAX_RETRIES = 3
class HttpClient: ...
def fetch_user(user_id: int) -> User: ...
```

### A7. Import order and absoluteness
**Rule.** Group imports stdlib / third-party / first-party / local, blank line between groups; absolute imports preferred; never `from x import *`.
**Reason.** `ruff`/`isort` enforce; `*` pollutes namespace and breaks linters.
```python
import json
from pathlib import Path

import httpx

from myproj.models import User
```

### A8. f-strings always
**Rule.** Use f-strings for new code; never `%` or `.format()`. Use `f"{value=}"` for debug output.
**Reason.** Faster, readable, statically analyzable.
```python
# wrong
msg = "hi %s" % name
# right
msg = f"hi {name}"
log.debug(f"{user_id=} {status=}")
```

### A9. `pathlib.Path` over `os.path`
**Rule.** New filesystem code uses `pathlib`; `read_text`, `write_text`, `glob`, `/` operator.
**Reason.** Object-oriented, cross-platform, fewer string-bugs.
```python
# wrong
import os; data = open(os.path.join(d, "x.json")).read()
# right
data = (Path(d) / "x.json").read_text()
```

### A10. Always use `with` for file/resource handles
**Rule.** Open files inside `with`; same for sockets, locks, sessions.
**Reason.** Guarantees close on exception; resource leaks otherwise.
```python
with path.open() as f:
    data = f.read()
```

### A11. Specific exceptions, never bare `except:`
**Rule.** Catch the narrowest exception that makes sense; `except Exception` only at the outermost boundary.
**Reason.** Bare `except:` swallows `KeyboardInterrupt` and `SystemExit`; broad catches hide bugs.
```python
# wrong
try: x = int(s)
except: x = 0
# right
try: x = int(s)
except ValueError: x = 0
```

### A12. `raise ... from err` to preserve chains
**Rule.** When wrapping, use `raise NewError(...) from err`; use `from None` only when intentionally hiding.
**Reason.** Preserves the original traceback for debuggers and logs.
```python
try:
    parse(s)
except ValueError as err:
    raise ConfigError("bad config") from err
```

### A13. Custom exceptions: subclass `Exception`, suffix `Error`
**Rule.** Project errors subclass `Exception` (not `BaseException`), name `XError`, keep them small.
**Reason.** Convention; lets callers `except MyError` without catching system exits.
```python
class ValidationError(Exception): ...
```

### A14. `logging.getLogger(__name__)` per module
**Rule.** One logger per module via `__name__`; configure handlers once at the entry point.
**Reason.** Hierarchical filtering; libraries that call `basicConfig` break apps.
```python
log = logging.getLogger(__name__)
def fetch(): log.info("fetching")
```

### A15. Type-hint public signatures
**Rule.** All public functions/methods get parameter and return type hints.
**Reason.** Enables `mypy`/`pyright` checks, IDE help, doc generation.
```python
def parse(raw: str) -> dict[str, int]: ...
```

### A16. Modern generics over `typing.List`/`Dict`
**Rule.** Use builtin generics (`list[int]`, `dict[str, int]`, `tuple[int, ...]`) on 3.9+; reach for `typing.List` only when supporting older runtimes.
**Reason.** `typing.List` is documented-deprecated since 3.9.
```python
def first(xs: list[int]) -> int: ...
```

### A17. `T | None`, not `Optional[T]`
**Rule.** Use `X | Y` unions (PEP 604) on 3.10+; reserve `Optional` only when reading older code.
**Reason.** Less import noise; matches `match`/runtime narrowing.
```python
def find(uid: int) -> User | None: ...
```

### A18. Skip `from __future__ import annotations` on 3.10+
**Rule.** On 3.10+ targeting only, don't add `from __future__ import annotations`.
**Reason.** PEP 604 unions and 3.9 builtin generics work at runtime; the future import causes surprises with `pydantic`, `dataclass`, and runtime introspection.

### A19. `Any` is a smell
**Rule.** Avoid `typing.Any`. Use `object` for "anything", `Protocol` for shape, a union, or a `TypeVar`.
**Reason.** `Any` disables checking at every boundary it touches.
```python
# wrong
def process(payload: Any) -> Any: ...
# right
def process(payload: Mapping[str, object]) -> Result: ...
```

### A20. Type-checker in CI
**Rule.** Run `mypy` or `pyright` (or `ty` once GA) in CI; fail the build on errors. Source: both are mature; `pyright` is faster and stricter on inference, `mypy` has the larger plugin ecosystem (`pydantic`, `attrs`).
**Reason.** Type hints rot fast without enforcement.

### A21. `pytest`, not `unittest`
**Rule.** New tests use `pytest`; assertions are plain `assert`; fixtures via `@pytest.fixture`; multi-input via `@pytest.mark.parametrize`.
**Reason.** Less ceremony, better introspection on failure.
```python
@pytest.mark.parametrize("n,want", [(1,1), (2,4)])
def test_sq(n, want): assert sq(n) == want
```

### A22. Use `tmp_path` and `monkeypatch`
**Rule.** Use built-in `tmp_path` for filesystem tests, `monkeypatch` for env/attr patches.
**Reason.** Auto-cleanup, no manual teardown.
```python
def test_writes(tmp_path):
    f = tmp_path / "x.txt"; f.write_text("hi")
    assert f.read_text() == "hi"
```

### A23. `ruff` for lint and format
**Rule.** One tool: `ruff check` and `ruff format`. Replaces `flake8`, `isort`, `pyupgrade`, `pylint` (mostly), and `black`. Source: Astral docs; widely adopted across major projects.
**Reason.** ~100× faster, single config, single CI step.
```toml
[tool.ruff.lint]
select = ["E","F","I","UP","B","SIM","N","RUF"]
```

### A24. Docstrings: Google or NumPy style
**Rule.** Pick one (Google or NumPy); follow PEP 257 layout; don't duplicate types from signature.
**Reason.** Tools (`mkdocstrings`, `sphinx-napoleon`) need a consistent style.
```python
def add(a: int, b: int) -> int:
    """Sum two ints.

    Args:
        a: first addend.
        b: second addend.
    """
```

### A25. Named constants, no magic literals
**Rule.** Module-level `UPPER_SNAKE` constants for any magic number or string.
**Reason.** Greppable, documentable, single source.
```python
MAX_RETRIES = 3
for _ in range(MAX_RETRIES): ...
```

### A26. `enumerate` / `zip` / comprehensions
**Rule.** Iterate with `enumerate`, `zip`, `itertools`; transform with comprehensions; stream with generators.
**Reason.** Clearer intent, fewer index bugs.
```python
# wrong
for i in range(len(items)): use(i, items[i])
# right
for i, item in enumerate(items): use(i, item)
```

### A27. `dict.get(key, default)`
**Rule.** Use `dict.get` over try/except for missing keys when a default is acceptable.
**Reason.** Faster, intent is explicit.
```python
# wrong
try: v = d[k]
except KeyError: v = 0
# right
v = d.get(k, 0)
```

### A28. `defaultdict` and `Counter`
**Rule.** `collections.defaultdict(list)` for grouped accumulation; `collections.Counter` for frequency.
**Reason.** One-liners replace 3-line setup-and-check loops.
```python
from collections import defaultdict, Counter
groups = defaultdict(list)
for u in users: groups[u.city].append(u)
freq = Counter(words)
```

### A29. `subprocess.run([...], check=True, text=True)`
**Rule.** Use `subprocess.run` with a list, `check=True`, `text=True`, `capture_output=True`. Never `shell=True` with user input.
**Reason.** Argument list avoids shell-injection; `check=True` raises on failure.
```python
subprocess.run(["git", "rev-parse", "HEAD"], check=True, text=True, capture_output=True)
```

### A30. `secrets`, not `random`, for tokens
**Rule.** Anything security-relevant (tokens, IDs, passwords, salts) uses `secrets`.
**Reason.** `random` is a Mersenne Twister, predictable from seed.
```python
import secrets
api_key = secrets.token_urlsafe(32)
```

---

## B — Modern Python idioms (3.12+)

### B1. PEP 695 generic syntax (3.12+)
**Rule.** Declare generics with `class Stack[T]:` and `def first[T](xs: list[T]) -> T:`. No more `TypeVar` boilerplate for new code.
**Reason.** Scoped, lexical type params; less import noise; matches the modern type system.
```python
# wrong (legacy)
T = TypeVar("T")
def first(xs: list[T]) -> T: return xs[0]
# right
def first[T](xs: list[T]) -> T: return xs[0]
```

### B2. `type` aliases (3.12+)
**Rule.** Use the `type` statement for aliases; replaces `TypeAlias`.
**Reason.** Lazy evaluation, scoped, unambiguous to the type checker.
```python
type UserId = int
type JSON = dict[str, "JSON"] | list["JSON"] | str | int | float | bool | None
```

### B3. Structural pattern matching for tagged dispatch
**Rule.** Use `match`/`case` for tagged unions, ASTs, and shape-based dispatch. Don't use it for `if x == 1`.
**Reason.** Clearer than chained `isinstance`/dict lookup; checker narrows types per case.
```python
match shape:
    case {"kind": "circle", "r": r}: return pi * r * r
    case {"kind": "rect", "w": w, "h": h}: return w * h
    case _: raise ValueError(shape)
```

### B4. Dataclasses with `slots=True, frozen=True, kw_only=True`
**Rule.** Default value classes: `@dataclass(slots=True, frozen=True, kw_only=True)`. Use `field(default_factory=list)` for mutables.
**Reason.** Immutable by default, smaller memory, no positional-arg footguns.
```python
@dataclass(slots=True, frozen=True, kw_only=True)
class User:
    id: int
    tags: list[str] = field(default_factory=list)
```

### B5. `attrs` when you need converters/validators
**Rule.** Reach for `attrs` (`@attrs.define`, `@attrs.frozen`) when you want converters, validators, or `cattrs` (de)serialization. Source: Hynek Schlawack — `attrs` is the superset of `dataclasses` for value objects.
**Reason.** `dataclasses` lack converters and validators; `attrs` adds them without the runtime weight of pydantic.
```python
@attrs.frozen
class Port:
    n: int = attrs.field(validator=attrs.validators.in_(range(1, 65536)))
```

### B6. `pydantic` v2 at I/O boundaries
**Rule.** Use `pydantic.BaseModel` for parsing/validating external data (HTTP, config, queues); use dataclasses/attrs internally. Source: Pydantic v2 docs — Rust core makes runtime validation cheap, but it's still heavier than dataclasses; reserve it for boundaries.
**Reason.** Pydantic shines at validation, JSON schema, error reports; overkill for internal value objects.
```python
class CreateUser(BaseModel):
    email: EmailStr
    age: int = Field(ge=0, le=150)
```

### B7. `Protocol` over ABCs
**Rule.** Prefer `typing.Protocol` for interfaces; mark `@runtime_checkable` only when you need `isinstance`.
**Reason.** Structural — duck-typed callers don't need to inherit. ABCs nominal-only.
```python
class SupportsRead(Protocol):
    def read(self, n: int) -> bytes: ...
```

### B8. `TypedDict` for JSON-shaped dicts
**Rule.** Use `TypedDict` for dict-shaped data; `NotRequired[...]` (3.11+) for optional keys.
**Reason.** Static checking on dict access without changing runtime shape.
```python
class Config(TypedDict):
    host: str
    port: NotRequired[int]
```

### B9. `typing.Self` for fluent returns
**Rule.** Methods that return `self` annotate `-> Self`.
**Reason.** Subclasses get the right return type without redeclaring.
```python
from typing import Self
class Builder:
    def with_x(self, x: int) -> Self: self.x = x; return self
```

### B10. `Literal` and `LiteralString`
**Rule.** Use `Literal["a", "b"]` for enum-ish strings; `LiteralString` (3.11+) for "no user input" SQL/shell strings.
**Reason.** Narrow types catch typos and injection paths.
```python
def set_mode(m: Literal["r", "w", "a"]) -> None: ...
def query(sql: LiteralString) -> Rows: ...
```

### B11. Sentinels via `object()` or `Enum`
**Rule.** When `None` is a valid value, use a module-level sentinel: `MISSING = object()` or an `Enum` member.
**Reason.** Distinguishes "not passed" from "passed `None`".
```python
_MISSING = object()
def get(d, k, default=_MISSING):
    if default is _MISSING: ...
```

### B12. Exception groups and `except*` (3.11+)
**Rule.** Raise `ExceptionGroup` for parallel/aggregated failures; consume with `except*`.
**Reason.** First-class for `TaskGroup` and partial-failure APIs.
```python
try: await tg
except* ValueError as eg:
    for err in eg.exceptions: log.warning(err)
```

### B13. `asyncio.run(main())` entry
**Rule.** One `asyncio.run(main())` at process start; never call `loop.run_until_complete` in app code.
**Reason.** `run` manages loop lifecycle, signal handling, cleanup correctly.
```python
async def main() -> None: ...
if __name__ == "__main__": asyncio.run(main())
```

### B14. `asyncio.TaskGroup` (3.11+)
**Rule.** Use `TaskGroup` over `asyncio.gather` for structured concurrency.
**Reason.** Cancels siblings on first failure, raises an `ExceptionGroup`, no leaked tasks.
```python
async with asyncio.TaskGroup() as tg:
    a = tg.create_task(fetch(u1))
    b = tg.create_task(fetch(u2))
```

### B15. `asyncio.timeout` (3.11+)
**Rule.** Use `async with asyncio.timeout(s):` over `wait_for`.
**Reason.** Context-manager cancellation is cleaner and composes.
```python
async with asyncio.timeout(5):
    return await fetch(url)
```

### B16. `asyncio.to_thread` for blocking calls
**Rule.** Wrap blocking I/O or CPU work inside async with `await asyncio.to_thread(fn, *args)`.
**Reason.** Avoids stalling the event loop; `loop.run_in_executor` is the legacy form.
```python
data = await asyncio.to_thread(requests.get, url)
```

### B17. Context managers with `contextlib`
**Rule.** Author resource scopes with `@contextlib.contextmanager` (sync) or `@asynccontextmanager` (async).
**Reason.** Generator-style is shorter than full `__enter__`/`__exit__` classes.
```python
@contextmanager
def chdir(p: Path):
    old = Path.cwd(); os.chdir(p)
    try: yield
    finally: os.chdir(old)
```

### B18. `functools.cache` for memoization
**Rule.** Use `@cache` (3.9+) for argument-keyed memoization; `@lru_cache(maxsize=N)` only when bounding matters.
**Reason.** No hand-rolled `_seen = {}` patterns; thread-safe.
```python
@cache
def fib(n: int) -> int: return n if n < 2 else fib(n-1)+fib(n-2)
```

### B19. `functools.cached_property`
**Rule.** Use `@cached_property` for instance-level lazy attributes.
**Reason.** Computes once per instance, stored on `__dict__`; no `if self._x is None` boilerplate.
```python
class User:
    @cached_property
    def avatar(self) -> bytes: return fetch(self.avatar_url)
```

### B20. `tomllib` for TOML reading (3.11+)
**Rule.** Read TOML with stdlib `tomllib`; no third-party dep needed.
**Reason.** Stdlib since 3.11.
```python
import tomllib
cfg = tomllib.loads(Path("pyproject.toml").read_text())
```

### B21. Walrus `:=` for compute-and-test
**Rule.** Use `:=` to combine compute + condition when it removes a duplicate call.
**Reason.** Eliminates "compute, store, test" three-line pattern.
```python
while chunk := f.read(4096):
    process(chunk)
```

### B22. `__match_args__` for matchable classes
**Rule.** Set `__match_args__` (or use `@dataclass`, which sets it) so positional `case` matches work.
**Reason.** Without it, only keyword case patterns work.
```python
@dataclass
class Point: x: int; y: int
match p:
    case Point(0, 0): "origin"
```

### B23. `StrEnum` / `IntEnum` for serializable enums
**Rule.** Use `StrEnum` (3.11+) for string-valued enums in JSON/config; `IntEnum` for integer constants; `Enum` otherwise.
**Reason.** Round-trips cleanly through JSON without manual `.value`.
```python
class Status(StrEnum):
    ACTIVE = "active"; SUSPENDED = "suspended"
```

### B24. `NewType` for nominal IDs
**Rule.** Wrap primitive IDs with `NewType` to prevent mix-ups.
**Reason.** Zero runtime cost, type checker enforces "user_id ≠ order_id".
```python
UserId = NewType("UserId", int)
def load(uid: UserId) -> User: ...
```

### B25. `datetime.now(tz=UTC)` over `utcnow()`
**Rule.** Use `datetime.now(tz=datetime.UTC)` (3.11+); `datetime.utcnow()` is deprecated in 3.12.
**Reason.** `utcnow()` returns a naive datetime, source of timezone bugs.
```python
from datetime import datetime, UTC
now = datetime.now(tz=UTC)
```

### B26. `zoneinfo` for time zones
**Rule.** Use stdlib `zoneinfo` (3.9+) instead of `pytz`.
**Reason.** First-party; correct DST handling without `localize()` ceremony.
```python
from zoneinfo import ZoneInfo
dt = datetime.now(ZoneInfo("America/Sao_Paulo"))
```

### B27. `decimal.Decimal` for money
**Rule.** Money in `Decimal` or integer minor units; never `float`.
**Reason.** IEEE 754 rounding errors compound; auditors don't accept "off by a penny".
```python
from decimal import Decimal
total = Decimal("0.10") + Decimal("0.20")  # 0.30 exactly
```

### B28. Audit dependencies in CI
**Rule.** Run `pip-audit` (or `safety`) and `pip-licenses` in CI.
**Reason.** Catches known CVEs and license violations before they ship.

### B29. Coverage with a CI threshold
**Rule.** Use `coverage.py`; gate CI on a threshold (e.g. `--fail-under=85`).
**Reason.** Without a gate, coverage drifts down silently.
```toml
[tool.coverage.report]
fail_under = 85
```

---

## D — Anti-patterns / smells

### D1. `from x import *`
**Rule.** Never `import *` in modules.
**Reason.** Pollutes namespace, breaks linters, hides origins.
```python
# wrong
from utils import *
# right
from utils import parse, dump
```

### D2. Bare `except:`
**Rule.** Never `except:`; at minimum `except Exception`.
**Reason.** Bare catches `KeyboardInterrupt` and `SystemExit`, making the process unkillable.

### D3. Re-raising without `from`
**Rule.** Always `raise NewError(...) from err` when wrapping.
**Reason.** Plain `raise NewError` loses the cause chain.
```python
# wrong
except ValueError: raise ConfigError("bad")
# right
except ValueError as e: raise ConfigError("bad") from e
```

### D4. Mutable default arguments
**Rule.** Never use mutable defaults (`[]`, `{}`, `set()`); use `None` and assign in body, or `field(default_factory=...)`.
**Reason.** The default is shared across calls — classic source of "why is this list growing?".
```python
# wrong
def add(x, xs=[]): xs.append(x); return xs
# right
def add(x, xs=None):
    xs = [] if xs is None else xs
    xs.append(x); return xs
```

### D5. `print` for application output
**Rule.** Use `logging` for diagnostics; reserve `print` for CLI user-facing output.
**Reason.** No levels, no handlers, no structured fields, no redirection.

### D6. `%` and `.format()` in new code
**Rule.** New strings are f-strings.
**Reason.** Slower, harder to read, no `=` debug shorthand.

### D7. `os.path` in new code
**Rule.** Use `pathlib`.
**Reason.** Cross-platform, OO, less string-fiddling.

### D8. `os.system` / `shell=True` with input
**Rule.** Never compose shell strings from user input; use `subprocess.run([...])`.
**Reason.** Shell injection.
```python
# wrong
os.system(f"rm {user_path}")
# right
subprocess.run(["rm", "--", user_path], check=True)
```

### D9. `eval` / `exec` on inputs
**Rule.** No `eval`/`exec` on any external input — including "trusted" config.
**Reason.** Arbitrary code execution; use `ast.literal_eval`, JSON, or a real parser.

### D10. `pickle` on untrusted bytes
**Rule.** Never unpickle data you didn't produce.
**Reason.** Pickle deserialization runs arbitrary code (RCE).

### D11. `requests.get(url)` without `timeout=`
**Rule.** Every network call gets an explicit timeout (`httpx`, `requests`, etc.).
**Reason.** Default is "wait forever"; one slow upstream wedges your worker pool.
```python
httpx.get(url, timeout=10.0)
```

### D12. Reading huge files into memory
**Rule.** Iterate by line or chunk for large files.
**Reason.** OOM on real-world inputs.
```python
# wrong
data = path.read_text().split("\n")
# right
with path.open() as f:
    for line in f: process(line)
```

### D13. `except Exception: pass`
**Rule.** Never silently swallow; at least log.
**Reason.** Silenced bugs become production mysteries.

### D14. `assert` for runtime validation
**Rule.** Don't use `assert` to enforce input validity; `python -O` strips them. Use `if + raise`.
**Reason.** Validation that disappears under optimization is no validation.
```python
# wrong
assert age >= 0
# right
if age < 0: raise ValueError(age)
```

### D15. `== None` / `== True`
**Rule.** Use `is None`, `is True`; for booleans usually just `if x:`.
**Reason.** `==` invokes `__eq__`; misleading on custom types.

### D16. `if len(x) > 0`
**Rule.** Truthiness: `if x:` for collections.
**Reason.** Idiomatic and works for any sized container.

### D17. `type(x) == str`
**Rule.** Use `isinstance(x, str)`.
**Reason.** Handles subclasses; `type ==` rejects them.

### D18. `is` for value equality
**Rule.** Never `is` for ints, strings, tuples; use `==`.
**Reason.** Identity checks rely on CPython interning details — not language guarantees.

### D19. `**kwargs` to dodge typing
**Rule.** If a function takes structured data, define a `TypedDict` or dataclass instead of `**kwargs: Any`.
**Reason.** `**kwargs` is an opaque escape hatch.
```python
# wrong
def render(**kwargs): ...
# right
class Opts(TypedDict): sorted: bool; dedupe: bool
def render(opts: Opts): ...
```

### D20. `Any` as escape hatch
**Rule.** A real type almost always fits — `object`, a `Protocol`, a union, a `TypeVar`.
**Reason.** `Any` infects every call site downstream.

### D21. `for i in range(len(items))`
**Rule.** Iterate the collection directly, with `enumerate` if you need indices.
**Reason.** Less indexing, fewer off-by-ones.

### D22. `list(map(f, xs))`
**Rule.** Use a comprehension `[f(x) for x in xs]`.
**Reason.** Reads better; `map` returns an iterator that surprises beginners.

### D23. `if cond: return True else: return False`
**Rule.** `return cond` (or `return bool(cond)` if non-bool truthy).
**Reason.** Self-documenting, fewer lines.

### D24. Mutable global state
**Rule.** No top-level mutable dicts/lists shared across functions; pass explicitly or wrap in a class.
**Reason.** Untraceable in tests, breaks under concurrency.

### D25. Threading for CPU-bound work
**Rule.** Don't use `threading` to parallelize CPU work; the GIL prevents parallelism. Use `multiprocessing`, `concurrent.futures.ProcessPoolExecutor`, or a C extension.
**Reason.** Threads only help for I/O.

### D26. `time.sleep` in async code
**Rule.** Use `await asyncio.sleep(s)` inside coroutines; `time.sleep` blocks the event loop.
**Reason.** Stalls every other task on the loop.

### D27. Mixing sync I/O into async without `to_thread`
**Rule.** If you must call blocking code from async, wrap with `await asyncio.to_thread(...)`.
**Reason.** Same loop-stall as `time.sleep`, just less obvious.

### D28. `scope="session"` fixtures with mutable state
**Rule.** Session-scoped fixtures must be read-only; per-test mutation needs `scope="function"`.
**Reason.** Cross-test bleed produces flaky, order-dependent failures.

### D29. Side-effecting imports
**Rule.** No DB calls, file reads, or network at module-import time.
**Reason.** Tests can't import the module; CLI startup time balloons.

### D30. `setup.py`-only packaging
**Rule.** Modern projects use `pyproject.toml` (PEP 621); keep `setup.py` only as a thin shim if you truly need it.
**Reason.** `setup.py` runs arbitrary code at install; tooling has standardized on declarative metadata.

### D31. Unpinned tooling versions
**Rule.** Pin `ruff`, `mypy`, `pytest` in `pyproject.toml`/`uv.lock`.
**Reason.** Floating versions break CI on a tool release.

### D32. Heavy `__init__.py`
**Rule.** Keep package `__init__.py` minimal — re-exports at most.
**Reason.** Runs on every import; expensive imports bloat startup and create cycles.

### D33. `None` as both "missing" and valid value
**Rule.** When `None` is a real value, use a sentinel or raise on missing.
**Reason.** Callers can't distinguish the two cases.

### D34. Catching to log-and-reraise everywhere
**Rule.** Log at the outermost boundary only; let exceptions propagate.
**Reason.** Multiple log lines per error, noisy on-call.

### D35. Dunder names on user classes
**Rule.** Don't name your own attributes `__foo__`; reserved for the language.
**Reason.** Future Python may give the name semantics that clash with yours.

### D36. Class-as-namespace
**Rule.** A class with all `@staticmethod`s should be a module of functions.
**Reason.** Classes carry instantiation expectations; modules are the right grouping.

### D37. `@classmethod` factories that mutate class state
**Rule.** Classmethods should construct, not mutate class-level state. Use module functions if you need that.
**Reason.** Hidden global state via the class object.

### D38. Deep nesting over early returns
**Rule.** Guard with early `return`/`raise`; don't pyramid `if`s.
**Reason.** Linear reading, fewer dead paths to track.
```python
# wrong
def f(u):
    if u:
        if u.active:
            if u.email: send(u.email)
# right
def f(u):
    if not u or not u.active or not u.email: return
    send(u.email)
```

### D39. `if/elif` chains for dispatch
**Rule.** Replace long `if/elif kind == ...` with a `match` statement or a dict-of-callables.
**Reason.** O(n) lookups, hard to extend.
```python
HANDLERS = {"a": handle_a, "b": handle_b}
HANDLERS[kind](payload)
```

### D40. Floats for money / IDs
**Rule.** Money: `Decimal` or integer cents. IDs: `int` or `str`, never `float`.
**Reason.** Float rounding silently corrupts data.

---

## Sources

- **Effective Python, 3rd ed.** — Brett Slatkin (2024) — idiomatic patterns, dataclasses, async, typing.
- **PEPs** — 8 (style), 257 (docstrings), 484 (type hints), 604 (`X | Y`), 621 (`pyproject.toml`), 646 (variadic generics), 695 (type-parameter syntax), 727 (`@deprecated`).
- **Python release notes** — 3.11 (`TaskGroup`, `ExceptionGroup`, `tomllib`, `Self`, `LiteralString`, `StrEnum`, `asyncio.timeout`), 3.12 (PEP 695, `type` aliases, `utcnow` deprecation, `slots=` perf), 3.13 (per-interpreter GIL preview).
- **Astral docs** — `ruff` (lint+format unified), `uv` (env/dep manager, lockfile semantics), `ty` (in-development type checker).
- **Pydantic v2 docs** — `BaseModel`, `Field`, validators, JSON-schema generation; v2 Rust core perf.
- **Hynek Schlawack** — `attrs` author; the `dataclasses` vs `attrs` vs `pydantic` split, `slots` recommendation.
- **Brandon Rhodes "Python Patterns"** — sentinel pattern, generator pipelines, dependency-injection in plain Python.
- **Real Python** — modern packaging, `pathlib`, `asyncio` patterns, type hint surveys.
- **`mypy` vs `pyright`** — both viable; `pyright` faster + stricter inference, `mypy` larger plugin ecosystem (`pydantic`, `attrs`, `django-stubs`); pick one and run in CI.
