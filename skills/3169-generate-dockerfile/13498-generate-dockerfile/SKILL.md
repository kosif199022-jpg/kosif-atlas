---
name: generate-dockerfile
description: >
  Generate optimized, secure, multi-stage Dockerfiles and .dockerignore files for any project.
  Analyzes the project, generates or improves the Dockerfile, then builds and runs it to validate.
disable-model-invocation: true
license: MIT
compatibility: Requires docker for validation; hadolint and trivy optional
---

# Generate Production-Ready Dockerfile

Generate an optimized, secure, multi-stage Dockerfile and .dockerignore by analyzing the project's structure, language, framework, and dependencies.

## Critical Rules

### Verify Everything Before Adding

**Before adding ANY instruction to the Dockerfile, verify it by examining the actual codebase** — read actual source files (not just file names), search with multiple queries, trace the application entry point through imports. Shallow analysis produces broken Dockerfiles; if the analysis felt quick, something was probably missed. Never assume — if uncertain, ask the user.

### Multi-Architecture Support

Ensure all instructions support multiple architectures (amd64, arm64). Use multi-arch official images. Detect architecture dynamically for binary downloads—never hardcode amd64/x86_64.

### Skip HEALTHCHECK

Health endpoints are application-specific and cannot be verified from codebase analysis alone. Adding unverified health checks causes containers to be marked unhealthy incorrectly — so don't add HEALTHCHECK to generated Dockerfiles.

## Process

### Step 0: Check for Existing Files

Check for `Dockerfile` (and variants like `Dockerfile.prod`) and `.dockerignore` in the project root. Read them if present—this determines whether to generate new files or improve existing ones.

### Step 1: Analyze Project

Investigate the actual project (do not pattern-match). For each item, search the codebase for evidence:

1. **Language** — Find dependency manifests (`package.json`, `go.mod`, `requirements.txt`, `Cargo.toml`, `Gemfile`, etc.). Read their contents.
2. **Version** — Check manifests for version constraints, version files (`.node-version`, `.python-version`, `.tool-versions`), CI configs. If no version found, search online for current LTS/stable.
3. **Framework** — Read dependency lists, look for framework config files and directory conventions.
4. **Application type** — Examine entry points: web server (HTTP/routes/port binding), CLI (arg parsing), worker (queue consumers), static site (build output, no server).
5. **Port** — Search for `PORT` env var usage, hardcoded ports in server init, config files. Only add EXPOSE with concrete evidence.
6. **Build requirements** — Read manifest for build scripts, identify build tool and outputs.
7. **System dependencies** — Search for code executing external commands (shell exec, subprocess, system calls). For each binary, verify it's needed at runtime vs. build time. **When uncertain, ask with `AskUserQuestion` (runtime / build only / not needed).**
8. **Environment variables** — Search for env var access patterns, `.env.example`/`.env.sample` files, config/startup code. Determine required (no default) vs. optional (has default). Set sensible defaults for required vars.

### Step 2: Generate or Improve Dockerfile

Consult [references/best-practices.md](references/best-practices.md) for detailed patterns, checklists, and package installation examples.

**New Dockerfile** → Generate multi-stage build following the builder/runtime stage patterns in the reference.

**Existing Dockerfile** → Evaluate against checklists, identify issues, preserve intentional customizations, edit to fix. Briefly explain changes.

Follow the patterns and checklists in the reference file.

### Step 3: Create or Improve .dockerignore

Generate a **minimal** .dockerignore (~10-15 lines). Since the Dockerfile uses explicit COPY:

1. Review Dockerfile COPY commands — what directories are copied?
2. Exclude secret patterns that could exist inside copied directories
3. Exclude large directories (>1MB) that slow context transfer
4. Do NOT exclude directories not copied by the Dockerfile

### Step 4: Build, Test, and Iterate

Validate before presenting to user. First verify Docker is available (`docker info`). If Docker is not installed or not running, skip validation — present the Dockerfile with a note that it hasn't been tested.

1. **Build** the image, then **run** a detached container from it. Services should stay running; CLI tools should exit with code 0.
2. **Read the container logs** and use the project knowledge from Step 1 to judge whether they indicate success or failure.
3. **Lint and scan** if the tools are installed: `hadolint Dockerfile`, `trivy image --severity HIGH,CRITICAL <image>`.
4. **Iterate** — max 5 attempts. If still failing, present the current state with an explanation and ask for guidance.
5. **Clean up** the test container and image afterward, even when validation failed.

## Output

**New Dockerfile:** Present Dockerfile + .dockerignore with brief explanation of key design choices, build/run commands, and image size expectations.

**Improved Dockerfile:** Present improved version with summary of changes (what + why), note preserved customizations.

**Both cases — recommended next steps:** integrate into CI/CD, commit to version control.

## Final Check

Before presenting, verify the Dockerfile against the Security, Build Optimization, and Stage Pattern checklists in [references/best-practices.md](references/best-practices.md) — plus the rules above: no HEALTHCHECK, minimal .dockerignore, validation artifacts cleaned up.
