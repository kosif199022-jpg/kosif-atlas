# Built-in Directives

Source: https://v20.angular.dev/guide/directives

Directives are classes that add additional behavior to elements in Angular applications.

## Types of Directives

| Directive Type | Details |
|---|---|
| Components | Used with a template. Most common directive type. |
| Attribute directives | Change the appearance or behavior of an element, component, or another directive. |
| Structural directives | Change the DOM layout by adding and removing DOM elements. |

## Built-in Attribute Directives

The most common attribute directives:

| Directive | Details |
|---|---|
| `NgClass` | Adds and removes a set of CSS classes. |
| `NgStyle` | Adds and removes a set of HTML styles. |
| `NgModel` | Adds two-way data binding to an HTML form element. |

Built-in directives use only public APIs — no special private access.

## NgClass

Add/remove multiple CSS classes simultaneously with `ngClass`.

> For a *single* class, use class binding rather than `NgClass`.

Import and add to `imports` array:
```ts
import { NgClass } from '@angular/common';
```

### With an expression
```html
<div [ngClass]="isSpecial ? 'special' : ''">This div is special</div>
```

### With an object literal
```html
<div [ngClass]="{'helpful':false, 'study':true, 'course':true}">Study course</div>
```

### With a method
Set `currentClasses` object in the component — keys are CSS class names, values are booleans:
```ts
setCurrentClasses() {
  this.currentClasses = {
    saveable: this.canSave,
    modified: !this.isUnchanged,
    special: this.isSpecial,
  };
}
```
```html
<div [ngClass]="currentClasses">...</div>
```

## NgStyle

Set multiple inline styles simultaneously based on component state.

> For a *single* style, use style bindings rather than `NgStyle`.

Import and add to `imports` array:
```ts
import { NgStyle } from '@angular/common';
```

```ts
setCurrentStyles() {
  this.currentStyles = {
    'font-style': this.canSave ? 'italic' : 'normal',
    'font-weight': !this.isUnchanged ? 'bold' : 'normal',
    'font-size': this.isSpecial ? '24px' : '12px',
  };
}
```
```html
<div [ngStyle]="currentStyles">...</div>
```

## NgModel — Two-way Binding

Import `FormsModule` from `@angular/forms`:
```html
<input [(ngModel)]="currentItem.name">
```

## Hosting a Directive Without a DOM Element

`<ng-container>` is a grouping element that doesn't interfere with styles or layout — Angular doesn't put it in the DOM.

```html
<select [(ngModel)]="hero">
  <ng-container *ngFor="let h of heroes">
    <ng-container *ngIf="showSad || h.emotion !== 'sad'">
      <option [ngValue]="h">{{h.name}} ({{h.emotion}})</option>
    </ng-container>
  </ng-container>
</select>
```

## NgIf

```html
<app-item-detail *ngIf="isActive" [item]="item"></app-item-detail>
```

Show/hide vs NgIf: NgIf removes the element from the DOM; `[style.display]` keeps it in the DOM but hidden.

## NgFor

```html
<div *ngFor="let item of items">{{ item.name }}</div>
<div *ngFor="let item of items; let i=index">{{ i + 1 }} - {{ item.name }}</div>
```

### trackBy
```html
<div *ngFor="let item of items; trackBy: trackByItems">{{ item.name }}</div>
```
```ts
trackByItems(index: number, item: Item): number {
  return item.id;
}
```

## NgSwitch

```html
<div [ngSwitch]="currentItem.feature">
  <app-stout-item *ngSwitchCase="'stout'" [item]="currentItem"></app-stout-item>
  <app-unknown-item *ngSwitchDefault [item]="currentItem"></app-unknown-item>
</div>
```
