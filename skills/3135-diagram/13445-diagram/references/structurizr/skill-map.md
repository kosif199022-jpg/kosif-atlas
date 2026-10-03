# Structurizr Reference Map

Choose the Structurizr reference files for the request. Paths are relative to this directory.

## Primary View References

| Request cues | Reference file |
|---|---|
| system landscape, all systems overview, high-level architecture | `system-context-view.md` |
| system context, software system in its environment, external dependencies | `system-context-view.md` |
| container, zoom into a system, applications, services, databases, APIs | `container-view.md` |
| component, zoom into a container, controllers, services, repositories | `component-view.md` |
| deployment, infrastructure, cloud, AWS, Docker, servers, nodes | `deployment-view.md` |
| dynamic, runtime behavior, interaction flow, sequence, step-by-step | `dynamic-view.md` |

## Supplemental References

| Need | Reference file |
|---|---|
| DSL syntax, workspace structure, model elements, relationships, identifiers, groups | `dsl-language.md` |
| styles, colors, shapes, borders, fonts, relationship appearance, themes | `styles.md` |
| color theme, C4 Blue, dark, monochrome, custom palette | `themes.md` |
| complete example, multi-view workspace, cookbook patterns | `cookbook.md` |

## Composition Rules

1. Pick one primary view reference first.
2. Add `dsl-language.md` if the request needs general DSL syntax beyond what the view reference covers.
3. Add `styles.md` or `themes.md` if the request mentions specific styling, colors, or themes.
4. Add `cookbook.md` for complete multi-view workspace examples or advanced patterns.

## Official Documentation

When these references do not cover a feature, consult the official Structurizr docs:

| Topic | URL |
|-------|-----|
| DSL Language Reference | https://docs.structurizr.com/dsl/language |
| Cookbook (patterns & recipes) | https://docs.structurizr.com/dsl/cookbook/ |
| Cookbook: specific recipe | https://docs.structurizr.com/dsl/cookbook/{recipe-name}/ |
| Themes | https://docs.structurizr.com/dsl/cookbook/themes/ |
| AWS icons | https://docs.structurizr.com/dsl/cookbook/amazon-web-services/ |
| CLI export | https://docs.structurizr.com/cli/export |
