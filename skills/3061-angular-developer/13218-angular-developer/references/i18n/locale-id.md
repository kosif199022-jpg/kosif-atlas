# Refer to Locales by ID

Source: https://v20.angular.dev/guide/i18n/locale-id

## Unicode Locale IDs

Angular uses the Unicode *locale identifier* (Unicode locale ID) to find correct locale data.

- Conforms to the [Unicode CLDR core specification](https://cldr.unicode.org/index/cldr-spec)
- Based on [BCP 47 tags](https://www.rfc-editor.org/info/bcp47)

### Format

```
{language_id}-{locale_extension}
```

Examples:

| Language | Locale | Unicode locale ID |
|----------|--------|-------------------|
| English | Canada | `en-CA` |
| English | United States | `en-US` |
| French | Canada | `fr-CA` |
| French | France | `fr-FR` |

Angular's repository includes common locale data in `@angular/common/locales`.

For language codes see [ISO 639-2](https://www.loc.gov/standards/iso639-2).

## Set the Source Locale

Default source locale is `en-US`. To change it, edit `angular.json`:

```json
{
  "projects": {
    "your-project": {
      "i18n": {
        "sourceLocale": "fr-CA"
      }
    }
  }
}
```

## Next Step

[Format data based on locale](format-data-locale.md)
