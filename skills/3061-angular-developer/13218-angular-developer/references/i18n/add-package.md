# Add the @angular/localize Package

Source: https://v20.angular.dev/guide/i18n/add-package

## Installation

```bash
ng add @angular/localize
```

This command:
- Updates `package.json`
- Adds `types: ["@angular/localize"]` to TypeScript configuration files
- Adds `/// <reference types="@angular/localize" />` to the top of `main.ts`

If `@angular/localize` is not installed and you try to build a localized version, the Angular CLI will generate an error with steps to enable i18n.

## Options

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `--project` | The name of the project | `string` | — |
| `--use-at-runtime` | If set, `$localize` can be used at runtime. Also adds `@angular/localize` to `dependencies` instead of `devDependencies` | `boolean` | `false` |

## Effect on `package.json`

- By default: added to `devDependencies`
- With `--use-at-runtime`: added to `dependencies` (needed if doing runtime translations)

## Next Step

[Refer to locales by ID](locale-id.md)
