# Import Global Variants of the Locale Data

Source: https://v20.angular.dev/guide/i18n/import-global-variants

## Automatic Inclusion

When you run `ng build --localize`, the Angular CLI automatically includes locale data and sets the `LOCALE_ID` value.

Initial Angular installation includes locale data for English in the United States (`en-US`) by default.

## Manual Import (when needed)

The `@angular/common` package contains locale data files. Global variants are in `@angular/common/locales/global`.

To manually import locale data (e.g. for runtime use or in `main.ts`):

### `src/main.ts` — import French locale

```typescript
import '@angular/common/locales/global/fr';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent);
```

> **Note:** In an NgModules-based app, import in `app.module.ts` instead of `main.ts`.

## Path Pattern

```
@angular/common/locales/global/{locale-id}
```

Examples:
- `@angular/common/locales/global/fr` — French
- `@angular/common/locales/global/de` — German
- `@angular/common/locales/global/ja` — Japanese
- `@angular/common/locales/global/fr-CA` — French (Canada)
