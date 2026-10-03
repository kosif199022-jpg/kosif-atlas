# ansible-new-molecule

Scaffold molecule testing for an Ansible role or collection following the current molecule testing philosophy (Ansible-native everything). Use when the user wants to add molecule tests, create test scenarios, or set up molecule for an existing role or collection. Use when user says "add molecule", "create molecule tests", "scaffold testing", "add test scenarios", or "set up molecule". Generates modern ansible-native molecule.yml (no driver/provisioner/verifier/platforms blocks), working create.yml/destroy.yml playbooks, smart verify.yml from role introspection, and optional GitHub Actions CI. Optionally uses ansible-know MCP server for module return value lookup. Do NOT use for migrating existing molecule setups (migration skill planned for a future release).

- License: **GPL-3.0-or-later**
- Source: https://github.com/leogallego/claude-ansible-skills/tree/2c43de8f4b180342f05f5e670cc7e6e8ae359ec4/ansible-new-molecule
- Commit: `2c43de8f4b180342f05f5e670cc7e6e8ae359ec4`
- KOSIF static inspection: **REVIEW_BEFORE_INSTALL** (hooks: 0, MCP servers: 1, scripts: 0)

Unofficial copy for reference. All rights remain with the original authors under the license above.
