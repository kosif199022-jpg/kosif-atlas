# The pipeline. Four verbs, same names in every repo; bodies change per project.
# `make` alone prints the numbered pipeline map.
.DEFAULT_GOAL := help
BUMP ?= patch
NOTE ?= release
VERSION := $(shell cat VERSION)

help:
	@echo "THE PIPELINE      folder    verb"
	@echo "1 SPEC            spec/     make spec      SPEC.md written before code: no TODO: lines left"
	@echo "2 BUILD           {{source}}make run       start it so you can touch it"
	@echo "3 PROVE           tests/    make check     candidate from deploy/SHIPLIST, then lint + unit + smoke"
	@echo "                            make release   BUMP=patch|minor|major NOTE='...' [PUSH=1]  bump, accept, CHANGELOG, tag"
	@echo "4 SHIP            deploy/   make deploy    ship build/candidate to the README target (refuses untagged HEAD)"
	@echo ""
	@echo "BESIDE IT         docs/ for users (ships)   tools/ for builders   .aai/ for the agent"
	@echo "STATE             data/ durable, backed up   build/ runtime/ disposable"

run:
	@echo "run: not defined yet — edit the run recipe in Makefile" >&2; exit 1

# The spec gate: SPEC.md exists and its TODO: placeholders are filled in.
spec:
	@test -f spec/SPEC.md || { echo "spec: spec/SPEC.md is missing" >&2; exit 1; }
	@! grep -n '^TODO:' spec/SPEC.md >&2 || { echo "spec: fill the TODO: lines in spec/SPEC.md first" >&2; exit 1; }

check: spec build
	@echo "check: not defined yet — a gate with nothing behind it must fail" >&2; exit 1

# The candidate: exactly what deploy/SHIPLIST names, verified both ways.
build:
	@rm -rf build/candidate && mkdir -p build/candidate
	@while IFS= read -r f; do [ -n "$$f" ] || continue; test -e "$$f" || { echo "build: $$f is on SHIPLIST but missing" >&2; exit 1; }; done < deploy/SHIPLIST
	@# ponytail: root .gitignore only; nested .gitignore files and ! negations are not honored
	@rsync -a --recursive --exclude-from=.gitignore --files-from=deploy/SHIPLIST . build/candidate/
	@cd build/candidate && find . -mindepth 1 -maxdepth 1 | sed "s|^./||" | while IFS= read -r f; do grep -qxF -e "$$f" -e "$$f/" ../../deploy/SHIPLIST || { echo "build: $$f is not on SHIPLIST" >&2; exit 1; }; done

# Production test on the candidate. Runs inside make release, after the bump,
# so the artifact it passes is the artifact that gets tagged.
accept: build
	@echo "accept: not defined yet — a gate with nothing behind it must fail" >&2; exit 1

release: check
	@test -z "$$(git status --porcelain)" || { echo "release: working tree not clean" >&2; exit 1; }
	@new=$$(awk -F. -v b=$(BUMP) '{ if (b=="major") {$$1++; $$2=0; $$3=0} else if (b=="minor") {$$2++; $$3=0} else {$$3++} ; print $$1"."$$2"."$$3 }' VERSION); \
	 echo "$$new" > VERSION; \
	 if ! $(MAKE) -s accept; then git checkout -- VERSION; echo "release: acceptance failed on v$$new; VERSION restored, nothing tagged" >&2; exit 1; fi; \
	 printf '## v%s — %s\n- %s\n\n' "$$new" "$$(date +%F)" "$(NOTE)" | cat - CHANGELOG.md | awk 'NR==1{print "# Changelog"; print ""} !/^# Changelog$$/ && !(NR<=2 && /^$$/)' > CHANGELOG.tmp && mv CHANGELOG.tmp CHANGELOG.md; \
	 git add VERSION CHANGELOG.md && git commit -q -m "Release v$$new: $(NOTE)" && git tag "v$$new" && echo "tagged v$$new"; \
	 if [ "$(PUSH)" = "1" ]; then git push && git push --tags; fi

deploy:
	@git describe --tags --exact-match HEAD >/dev/null 2>&1 || { echo "deploy: HEAD is not tagged — run make release first" >&2; exit 1; }
	@test -z "$$(git status --porcelain)" || { echo "deploy: uncommitted changes; the tag would not describe what ships" >&2; exit 1; }
	@echo "deploy: no target defined yet — name it in README and fill this recipe" >&2; exit 1

.PHONY: help spec run check build accept release deploy
