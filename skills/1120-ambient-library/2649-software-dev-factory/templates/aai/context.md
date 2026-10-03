# Context — what's in this folder

| Path | What it is | Read when |
|------|-----------|-----------|
| `.aai/instructions.md` | this folder's behavior | always, first |
| `.aai/identity.md` | who this folder is | always |
| `.aai/purpose.md` | what this folder is for, and what it deliberately does not own | always |
| `.aai/factory.env` | folder-wide adapter defaults (which coding-agent CLI); each project gets its own, sourced second, so project values win | "no adapter configured", exit 3 refusals |
| `.aai/memory.md` | dated decisions: projects, adapter changes, upgrades | resuming work |
| `.aai/skills/software-dev-factory/` | a personalized fork of the capability, if one exists | resolving the capability (shadows `.ailib/`) |
| `factory` | root-level launcher (delegates into `.ailib/software-dev-factory/factory.sh`) | any factory command |
| `.ailib/software-dev-factory/` | vendored capability: `factory.sh`, `app/` (the bundle) | updating the factory |
| `.ailib/software-dev-factory/app/docs/user-guide.md` | writing a spec, the four owner decisions, the CLI | before a first run |
| `.ailib/software-dev-factory/app/docs/admin-guide.md` | adapters, policy, troubleshooting a parked run | anything that parked or refused |
| `.ailib/manifest.yaml` | what's vendored and at which version | "what version is installed" |
| `projects/<name>/` | one product, its own git repository: spec, policy, code, run refs | any question about that product |
| `projects/<name>/.aai/policy/factory.yaml` | that project's quality profile (test, coverage, lint commands) | a run that parks at baseline |
