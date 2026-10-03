# Merge Translations into the Application

Source: https://v20.angular.dev/guide/i18n/merge

## Overview

Merging uses AOT (ahead-of-time) compilation to produce small, fast, ready-to-run locale-specific application variants. The key insight: **compile once, then translate for each locale**.

After `i18n` attributes in templates are compiled, they become `$localize` tagged message strings — the translation transformation then replaces and reorders them at build time.

---

## Step 1: Define Locales in `angular.json`

```json
{
  "projects": {
    "angular.io-example": {
      "i18n": {
        "sourceLocale": "en-US",
        "locales": {
          "fr": {
            "translation": "src/locale/messages.fr.xlf",
            "subPath": ""
          }
        }
      }
    }
  }
}
```

| Suboption | Details |
|-----------|---------|
| `sourceLocale` | The locale used in application source code (`en-US` by default) |
| `locales` | Map of locale identifiers → translation file paths |

---

## Step 2: Generate Application Variants

### Option A — Set `"localize"` in `angular.json` build options

```json
"options": {
  "localize": true   // build all defined locales
}
```

Or limit to specific locales:
```json
"localize": ["fr"]
```

Or disable:
```json
"localize": false
```

### Option B — Build from the command line

```bash
ng build --localize
```

### Option C — Locale-specific configuration (for `ng serve`)

```json
"configurations": {
  "fr": {
    "localize": ["fr"]
  }
}
```

```bash
ng serve --configuration=fr
```

> **Note:** `ng serve` only supports **one locale at a time**. Setting `"localize": true` with multiple locales + `ng serve` causes an error.

### Production build for a specific locale

```bash
ng build --configuration=production,fr
```

---

## CLI Build Output

For each locale, the CLI:
- Loads and registers locale data
- Places output in locale-specific directories under `outputPath`
- Sets the `lang` attribute on the `<html>` element
- Adjusts the HTML base `href` by adding the locale (or `subPath`)

---

## Report Missing Translations

| Warning level | Details |
|---------------|---------|
| `error` | Throws an error, build fails |
| `ignore` | Silent |
| `warning` | Logs warning to console (default) |

Set in `angular.json` build options:

```json
"options": {
  "i18nMissingTranslation": "error"
}
```

---

## Next Step

[Deploy multiple locales](deploy.md)
