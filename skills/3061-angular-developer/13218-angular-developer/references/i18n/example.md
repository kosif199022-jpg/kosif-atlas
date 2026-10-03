# Example Angular Internationalization Application

Source: https://v20.angular.dev/guide/i18n/example

A working example demonstrating `fr-CA` and `en-US` locales.

## `app.component.html`

```html
<h1 i18n="User welcome|An introduction header for this sample@@introductionHeader">
  Hello i18n!
</h1>

<ng-container i18n>I don't output any element</ng-container>
<br />

<img [src]="logo" i18n-title title="Angular logo" alt="Angular logo" />
<br>

<button type="button" (click)="inc(1)">+</button>
<button type="button" (click)="inc(-1)">-</button>
<span i18n>Updated {minutes, plural,
  =0 {just now}
  =1 {one minute ago}
  other {{{ minutes }} minutes ago}
}</span>
({{ minutes }})
<br><br>

<button type="button" (click)="male()">♂</button>
<button type="button" (click)="female()">♀</button>
<button type="button" (click)="other()">⚧</button>
<span i18n>The author is {gender, select,
  male {male}
  female {female}
  other {other}
}</span>
<br><br>

<span i18n>Updated: {minutes, plural,
  =0 {just now}
  =1 {one minute ago}
  other {{{ minutes }} minutes ago by {gender, select,
    male {male}
    female {female}
    other {other}
  }}
}</span>
<br><br>

<button type="button" (click)="toggleDisplay()">Toggle</button>
<div i18n [attr.aria-label]="toggleAriaLabel()">{{toggle()}}</div>
```

## `app.component.ts`

```typescript
import { Component, computed, signal } from '@angular/core';
import { $localize } from '@angular/localize/init';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  minutes = 0;
  gender = 'female';
  fly = true;
  logo = `${this.baseUrl}/angular.svg`;

  readonly toggle = signal(false);

  readonly toggleAriaLabel = computed(() => {
    return this.toggle()
      ? $localize`:Toggle Button|A button to toggle status:Show`
      : $localize`:Toggle Button|A button to toggle status:Hide`;
  });

  inc(i: number) {
    this.minutes = Math.min(5, Math.max(0, this.minutes + i));
  }

  male() { this.gender = 'male'; }
  female() { this.gender = 'female'; }
  other() { this.gender = 'other'; }

  toggleDisplay() {
    this.toggle.update((toggle) => !toggle);
  }
}
```

## `src/main.ts`

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent);
```

## `src/locale/messages.fr.xlf` (after translation)

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en" datatype="plaintext" original="ng2.template">
    <body>
      <trans-unit id="introductionHeader" datatype="html">
        <source>Hello i18n!</source>
        <target>Bonjour i18n !</target>
        <note priority="1" from="description">An introduction header for this sample</note>
        <note priority="1" from="meaning">User welcome</note>
      </trans-unit>
      <trans-unit id="ba0cc104d3d69bf669f97b8d96a4c5d8d9559aa3" datatype="html">
        <source>I don't output any element</source>
        <target>Je n'affiche aucun élément</target>
      </trans-unit>
      <trans-unit id="701174153757adf13e7c24a248c8a873ac9f5193" datatype="html">
        <source>Angular logo</source>
        <target>Logo d'Angular</target>
      </trans-unit>
      <trans-unit id="5a134dee893586d02bffc9611056b9cadf9abfad" datatype="html">
        <source>{VAR_PLURAL, plural, =0 {just now} =1 {one minute ago} other {<x id="INTERPOLATION" equiv-text="{{minutes}}"/> minutes ago} }</source>
        <target>{VAR_PLURAL, plural, =0 {à l'instant} =1 {il y a une minute} other {il y a <x id="INTERPOLATION" equiv-text="{{minutes}}"/> minutes} }</target>
      </trans-unit>
      <trans-unit id="f99f34ac9bd4606345071bd813858dec29f3b7d1" datatype="html">
        <source>The author is <x id="ICU" equiv-text="{gender, select, male {...} female {...} other {...}}"/></source>
        <target>L'auteur est <x id="ICU" equiv-text="{gender, select, male {...} female {...} other {...}}"/></target>
      </trans-unit>
      <trans-unit id="eff74b75ab7364b6fa888f1cbfae901aaaf02295" datatype="html">
        <source>{VAR_SELECT, select, male {male} female {female} other {other} }</source>
        <target>{VAR_SELECT, select, male {un homme} female {une femme} other {autre} }</target>
      </trans-unit>
      <trans-unit id="myId" datatype="html">
        <source>Hello</source>
        <target state="new">Bonjour</target>
      </trans-unit>
    </body>
  </file>
</xliff>
```

## Key Patterns Demonstrated

- `i18n` with meaning, description, and custom ID (`@@introductionHeader`)
- `i18n-title` for attribute translation
- `<ng-container i18n>` for inline text without extra DOM elements
- ICU `plural` expressions (`=0`, `=1`, `other`)
- ICU `select` expressions (`male`, `female`, `other`)
- Nested ICU (`plural` containing `select`)
- `$localize` in component code with meaning and description
- Computed signals using `$localize` for dynamic aria labels
