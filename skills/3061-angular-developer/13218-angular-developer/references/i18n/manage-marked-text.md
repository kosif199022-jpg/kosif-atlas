# Manage Marked Text with Custom IDs

Source: https://v20.angular.dev/guide/i18n/manage-marked-text

## The Problem with Auto-Generated IDs

By default, Angular generates a unique ID for each translation unit based on the **content** and **meaning** of the text. If you change the text, the ID changes — which breaks existing translations.

## Custom IDs with `@@`

Use the `@@` prefix to assign a stable custom ID:

### In templates
```html
<h1 i18n="@@introductionHeader">Hello i18n!</h1>
<h1 i18n="An introduction header for this sample@@introductionHeader">Hello i18n!</h1>
<h1 i18n="site header|An introduction header for this sample@@introductionHeader">Hello i18n!</h1>
```

### In component code
```typescript
variableText1 = $localize`:@@introductionHeader:Hello i18n!`;
variableText2 = $localize`:An introduction header for this sample@@introductionHeader:Hello i18n!`;
variableText3 = $localize`:site header|An introduction header for this sample@@introductionHeader:Hello i18n!`;
```

### Result in XLIFF

```xml
<trans-unit id="introductionHeader" datatype="html">
  <source>Hello i18n!</source>
  <target>Bonjour i18n !</target>
  <note priority="1" from="description">An introduction header for this sample</note>
  <note priority="1" from="meaning">User welcome</note>
</trans-unit>
```

## Trade-offs

| Behavior | Auto-generated ID | Custom ID |
|----------|-------------------|-----------|
| Text changes → new ID | ✅ Yes (keeps translations in sync) | ❌ No (ID stays stable) |
| Requires updating translations when text changes | ✅ Automatic (new ID = untranslated) | ⚠️ Manual (translations may go stale) |
| Stable across refactors | ❌ No | ✅ Yes |
| Works with external translation systems needing specific IDs | ❌ No | ✅ Yes |

## Custom IDs Must Be Unique

If two elements share the same custom ID, the extractor only keeps the **first** one. Angular then applies that single translation to **both** elements.

```html
<h3 i18n="@@myId">Hello</h3>
<!-- ... -->
<p i18n="@@myId">Good bye</p>
```

Both will render as `Bonjour` (or whatever `myId` translates to) — the "Good bye" text is lost.

**Always use unique custom IDs.**
