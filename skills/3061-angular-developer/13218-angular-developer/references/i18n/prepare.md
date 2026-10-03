# Prepare Component for Translation

Source: https://v20.angular.dev/guide/i18n/prepare

## Three Ways to Mark Text

1. `i18n` attribute — mark text in component templates
2. `i18n-{attribute}` — mark attribute text strings in component templates
3. `$localize` tagged message string — mark text in component code

---

## 1. Mark Text in Component Templates (`i18n` attribute)

```html
<element i18n="{i18n_metadata}">{string_to_translate}</element>
```

### Basic usage
```html
<h1 i18n>Hello i18n!</h1>
```

### With description
```html
<h1 i18n="An introduction header for this sample">Hello i18n!</h1>
```

### With meaning and description (`meaning|description`)
```html
<h1 i18n="site header|An introduction header for this sample">Hello i18n!</h1>
```

### With custom ID (`@@id`)
```html
<h1 i18n="An introduction header for this sample@@introductionHeader">Hello i18n!</h1>
```

### With meaning, description, and custom ID
```html
<h1 i18n="site header|An introduction header for this sample@@introductionHeader">Hello i18n!</h1>
```

### Translate inline text without HTML element (use `<ng-container>`)
```html
<ng-container i18n>I don't output any element</ng-container>
```

---

## 2. Mark Element Attributes (`i18n-{attribute_name}`)

```html
<element i18n-{attribute_name}="{meaning}|{description}@@{id}" {attribute_name}="{value}" />
```

### Example — translate an image `title`
```html
<img [src]="logo" i18n-title title="Angular logo" alt="Angular logo" />
```

---

## 3. Mark Text in Component Code (`$localize`)

```typescript
$localize`string_to_translate`;
```

### With metadata
```typescript
$localize`:An introduction header for this sample:Hello i18n!`;
$localize`:site header|An introduction header for this sample:Hello i18n!`;
$localize`:An introduction header for this sample@@introductionHeader:Hello i18n!`;
```

### With interpolation
```typescript
$localize`Hello ${name}`;
$localize`Hello ${name}:userName:`;  // named placeholder
```

### Conditional usage
```typescript
return this.show ? $localize`Show Tabs` : $localize`Hide tabs`;
```

### In a computed signal
```typescript
readonly toggleAriaLabel = computed(() => {
  return this.toggle()
    ? $localize`:Toggle Button|A button to toggle status:Show`
    : $localize`:Toggle Button|A button to toggle status:Hide`;
});
```

---

## i18n Metadata Format

```
{meaning}|{description}@@{custom_id}
```

| Parameter | Details |
|-----------|---------|
| Custom ID | Stable identifier for translation units (use `@@`) |
| Description | Additional context for translators |
| Meaning | Intent of the text within the specific context |

### How meanings control extraction

- Same text + **different meanings** → extracted with **different IDs**
- Same text + **same meaning** (even different descriptions) → extracted **once**, same ID, merged back everywhere

---

## ICU Expressions

Mark alternate/conditional text using ICU (International Components for Unicode) format:

```
{ component_property, icu_clause, case_statements }
```

| ICU Clause | Details |
|------------|---------|
| `plural` | Mark use of plural numbers |
| `select` | Mark choices based on defined string values |

### Plural example

```html
<span i18n>Updated {minutes, plural,
  =0 {just now}
  =1 {one minute ago}
  other {{{ minutes }} minutes ago}
}</span>
```

Pluralization categories: `zero`, `one`, `two`, `few`, `many`, `other` (fallback).

### Select example

```html
<span i18n>The author is {gender, select,
  male {male}
  female {female}
  other {other}
}</span>
```

### Nested ICU expressions

```html
<span i18n>Updated: {minutes, plural,
  =0 {just now}
  =1 {one minute ago}
  other {{{ minutes }} minutes ago by {gender, select,
    male {male}
    female {female}
    other {other}
  }}
}</span>
```

---

## Next Step

[Work with translation files](translation-files.md)
