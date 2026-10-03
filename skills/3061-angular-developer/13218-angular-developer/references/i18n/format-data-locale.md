# Format Data Based on Locale

Source: https://v20.angular.dev/guide/i18n/format-data-locale

Angular provides built-in data transformation pipes that use the `LOCALE_ID` token to format data based on each locale's rules.

## Built-in Localization Pipes

| Pipe | Details |
|------|---------|
| `DatePipe` | Formats a date value |
| `CurrencyPipe` | Transforms a number into a currency string |
| `DecimalPipe` | Transforms a number into a decimal number string |
| `PercentPipe` | Transforms a number into a percentage string |

## Usage Examples

### DatePipe — display current date in current locale format

```html
{{ today | date }}
```

### CurrencyPipe — override locale for a specific pipe

Add the `locale` parameter to override the global `LOCALE_ID` token:

```html
{{ amount | currency : 'en-US' }}
```

> **Note:** The locale specified for `CurrencyPipe` overrides the global `LOCALE_ID` token of your application.

## Next Step

[Prepare component for translation](prepare.md)
