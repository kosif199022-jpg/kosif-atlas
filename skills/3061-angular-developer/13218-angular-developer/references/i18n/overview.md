# Angular Internationalization (i18n) — Overview

Source: https://v20.angular.dev/guide/i18n

*Internationalization* (i18n) is the process of designing and preparing your project for use in different locales around the world.
*Localization* is the process of building versions of your project for different locales.

The localization process includes:
- Extracting text for translation into different languages
- Formatting data for a specific locale

A *locale* identifies a region in which people speak a particular language or language variant, and determines the formatting and parsing of dates/times, numbers, currencies, time zones, languages, and countries.

## i18n Workflow (High-Level)

1. **Add the localize package** — `ng add @angular/localize`
2. **Refer to locales by ID** — Use Unicode locale IDs (e.g. `en-US`, `fr-CA`)
3. **Format data based on locale** — Use built-in pipes (`DatePipe`, `CurrencyPipe`, etc.)
4. **Prepare components for translation** — Mark text with `i18n` attribute or `$localize`
5. **Work with translation files** — Extract with `ng extract-i18n`, then translate
6. **Merge translations** — Build with `--localize` flag
7. **Deploy multiple locales** — Serve each locale from a subdirectory

## Guide Pages

- [Add the localize package](add-package.md)
- [Refer to locales by ID](locale-id.md)
- [Format data based on locale](format-data-locale.md)
- [Prepare component for translation](prepare.md)
- [Work with translation files](translation-files.md)
- [Merge translations into the app](merge.md)
- [Deploy multiple locales](deploy.md)
- [Import global variants of the locale data](import-global-variants.md)
- [Manage marked text with custom IDs](manage-marked-text.md)
- [Example Angular application](example.md)
