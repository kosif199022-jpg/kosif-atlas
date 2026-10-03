# Drag and Drop (CDK)

Source: https://v20.angular.dev/guide/drag-drop

Angular CDK drag and drop lets you quickly create drag-and-drop interfaces with:

- Free dragging
- Reorderable lists
- Transfer between lists
- Dragging animations
- Axis locking
- Custom drag handles
- Drag previews
- Custom placeholders

Full API reference: [Angular CDK drag-drop API](https://v20.angular.dev/api#angular_cdk_drag-drop)

---

## Installation

```bash
ng add @angular/cdk
```

Import what you need in your component:

```ts
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'my-component',
  templateUrl: 'my-component.html',
  imports: [CdkDrag],
})
export class MyComponent {}
```

---

## Basic: Free Draggable Element

Add `cdkDrag` to any element to make it freely draggable:

```html
<div class="example-box" cdkDrag>
  Drag me around
</div>
```

---

## Reorderable List (`cdkDropList`)

Wrap draggable elements in a `cdkDropList` to enable reordering. Listen to `cdkDropListDropped` to update your data model manually (the directives do **not** update your model automatically).

```html
<div cdkDropList class="example-list" (cdkDropListDropped)="drop($event)">
  @for (movie of movies; track movie) {
    <div class="example-box" cdkDrag>{{movie}}</div>
  }
</div>
```

```ts
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

drop(event: CdkDragDrop<string[]>) {
  moveItemInArray(this.movies, event.previousIndex, event.currentIndex);
}
```

Use the [`CDK_DROP_LIST`](/api/cdk/drag-drop/CDK_DROP_LIST) injection token to reference `cdkDropList` instances via DI.

---

## Transfer Between Lists

Two ways to connect `cdkDropList` instances:

### Option 1: `cdkDropListConnectedTo`
```html
<!-- Direct reference -->
<div cdkDropList #listOne="cdkDropList" [cdkDropListConnectedTo]="[listTwo]"></div>
<div cdkDropList #listTwo="cdkDropList" [cdkDropListConnectedTo]="[listOne]"></div>

<!-- Or by string ID -->
<div cdkDropList id="list-one" [cdkDropListConnectedTo]="['list-two']"></div>
<div cdkDropList id="list-two" [cdkDropListConnectedTo]="['list-one']"></div>
```

```ts
import { transferArrayItem } from '@angular/cdk/drag-drop';

drop(event: CdkDragDrop<string[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
  }
}
```

### Option 2: `cdkDropListGroup` (auto-connects all children)
```html
<div cdkDropListGroup>
  <!-- All cdkDropList elements here auto-connect to each other -->
  @for (list of lists; track list) {
    <div cdkDropList></div>
  }
</div>
```

```ts
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
// Add CdkDropListGroup to imports array
```

Use [`CDK_DROP_LIST_GROUP`](/api/cdk/drag-drop/CDK_DROP_LIST_GROUP) injection token to reference instances via DI.

---

## Selective Dragging (`cdkDropListEnterPredicate`)

Control which elements can be dropped into a container:

```html
<div cdkDropList [cdkDropListEnterPredicate]="evenPredicate" ...>
```

```ts
evenPredicate(item: CdkDrag<number>) {
  return item.data % 2 === 0;
}
noReturnPredicate() {
  return false;
}
```

---

## Attaching Data

Associate data with `cdkDrag` and `cdkDropList` for use in events:

```html
@for (list of lists; track list) {
  <div cdkDropList [cdkDropListData]="list" (cdkDropListDropped)="drop($event)">
    @for (item of list; track item) {
      <div cdkDrag [cdkDragData]="item"></div>
    }
  </div>
}
```

---

## Dragging Customizations

### Custom Drag Handle (`cdkDragHandle`)
```html
<div class="example-box" cdkDrag>
  I can only be dragged using the handle
  <div class="example-handle" cdkDragHandle>
    <!-- handle icon here -->
  </div>
</div>
```
```ts
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
// imports: [CdkDrag, CdkDragHandle]
```
Use [`CDK_DRAG_HANDLE`](/api/cdk/drag-drop/CDK_DRAG_HANDLE) injection token to reference instances.

### Custom Preview (`*cdkDragPreview`)
```html
<div cdkDropList ...>
  @for (movie of movies; track movie) {
    <div class="example-box" cdkDrag>
      {{movie.title}}
      <img *cdkDragPreview [src]="movie.poster" [alt]="movie.title">
    </div>
  }
</div>
```
Pass `matchSize="true"` to match the size of the original dragged element.

The cloned element removes its `id` attribute — CSS targeting that id won't apply to the preview.

Use [`CDK_DRAG_PREVIEW`](/api/cdk/drag-drop/CDK_DRAG_PREVIEW) injection token to reference instances.

### Custom Placeholder (`*cdkDragPlaceholder`)
```html
<div class="example-box" cdkDrag>
  <div class="example-custom-placeholder" *cdkDragPlaceholder></div>
  {{movie}}
</div>
```
```ts
import { CdkDragPlaceholder } from '@angular/cdk/drag-drop';
```
Use [`CDK_DRAG_PLACEHOLDER`](/api/cdk/drag-drop/CDK_DRAG_PLACEHOLDER) injection token to reference instances.

### Custom Drag Root Element (`cdkDragRootElement`)
Make a parent element draggable when you don't have direct access (e.g., dialog):
```html
<div cdkDrag cdkDragRootElement=".cdk-overlay-pane">
  Drag the dialog around!
</div>
```

### Set DOM Position (`cdkDragFreeDragPosition`)
Explicitly set position (e.g., to restore after navigation):
```html
<div cdkDrag [cdkDragFreeDragPosition]="dragPosition">Drag me</div>
```
```ts
dragPosition = { x: 0, y: 0 };
changePosition() {
  this.dragPosition = { x: this.dragPosition.x + 50, y: this.dragPosition.y + 50 };
}
```

### Custom Preview Container (`cdkDragPreviewContainer`)
By default, previews insert into `<body>`. Override with:

| Value | Description | Trade-offs |
|-------|-------------|------------|
| `global` | Default — inserts into `<body>` or nearest shadow root | No z-index/overflow issues; loses inherited styles |
| `parent` | Inserts inside the element's parent | Inherits styles; may be clipped by overflow or z-index |
| `ElementRef`/`HTMLElement` | Inserts into specified element | Inherits styles from container; may be clipped |

### Restrict to Boundary (`cdkDragBoundary`)
```html
<div class="example-boundary">
  <div cdkDrag cdkDragBoundary=".example-boundary">
    I can only be dragged within the dotted container
  </div>
</div>
```

### Lock to Axis (`cdkDragLockAxis`)
```html
<div cdkDrag cdkDragLockAxis="y">I can only be dragged up/down</div>
<div cdkDrag cdkDragLockAxis="x">I can only be dragged left/right</div>
```
For a whole list: `cdkDropListLockAxis` on `cdkDropList`.

### Delay Dragging (`cdkDragStartDelay`)
```html
<div cdkDrag [cdkDragStartDelay]="1000">Dragging starts after one second</div>
```
Useful on touch devices to prevent accidental drags while scrolling.

### Disable Dragging
```html
<!-- Individual item -->
<div cdkDrag [cdkDragDisabled]="item.disabled">{{item.value}}</div>

<!-- Entire list -->
<div cdkDropList [cdkDropListDisabled]="true">...</div>

<!-- Handle only -->
<div cdkDragHandle [cdkDragHandleDisabled]="true">...</div>
```

---

## Sorting Customizations

### List Orientation (`cdkDropListOrientation`)
```html
<!-- Vertical (default) -->
<div cdkDropList>...</div>

<!-- Horizontal -->
<div cdkDropList cdkDropListOrientation="horizontal">...</div>

<!-- Mixed/wrapping (no animation, DOM-move strategy) -->
<div cdkDropList cdkDropListOrientation="mixed">...</div>
```

### Selective Sorting (`cdkDropListSortPredicate`)
```html
<div cdkDropList [cdkDropListSortPredicate]="sortPredicate">...</div>
```
```ts
sortPredicate(index: number, item: CdkDrag<number>) {
  return (index + 1) % 2 === item.data % 2;
}
```

### Disable Sorting (`cdkDropListSortingDisabled`)
Allows items to be dragged *out* of a list without being reordered within it:
```html
<div cdkDropList cdkDropListSortingDisabled>...</div>
```

### Copying Items Between Lists (`cdkDropListHasAnchor`)
Creates an anchor element in the source list; item copies rather than moves. Anchor is removed if item is dragged back. Style with `.cdk-drag-anchor`.

Combine with `cdkDropListSortingDisabled` for a product-list → shopping-cart pattern:
```html
<div cdkDropList cdkDropListSortingDisabled cdkDropListHasAnchor>
  @for (product of products; track $index) {
    <div cdkDrag [cdkDragData]="product">{{product}}</div>
  }
</div>
```
```ts
import { copyArrayItem } from '@angular/cdk/drag-drop';
```

---

## Animations

CSS classes for animation control:

| CSS class | When applied |
|-----------|-------------|
| `.cdk-drag` | Target for sorting animations (while being dragged) |
| `.cdk-drag-animating` | Applied to `cdkDrag` only when dragging has *stopped* — animate from drop position to final position |

```css
.cdk-drag-animating {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}
.example-list.cdk-drop-list-dragging .example-box:not(.cdk-drag-placeholder) {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}
```

---

## Styling Reference

| CSS class | Description |
|-----------|-------------|
| `.cdk-drop-list` | The `cdkDropList` container |
| `.cdk-drag` | `cdkDrag` elements |
| `.cdk-drag-disabled` | Disabled `cdkDrag` elements |
| `.cdk-drag-handle` | Host element of `cdkDragHandle` |
| `.cdk-drag-preview` | The element shown next to cursor while dragging |
| `.cdk-drag-placeholder` | Shows where element will land |
| `.cdk-drop-list-dragging` | `cdkDropList` with an active drag |
| `.cdk-drop-list-disabled` | Disabled `cdkDropList` |
| `.cdk-drop-list-receiving` | `cdkDropList` that can receive from a connected dragging list |
| `.cdk-drag-anchor` | Anchor element when `cdkDropListHasAnchor` is enabled |

---

## Scrollable Containers

If draggable items are in a scrollable container (`overflow: auto`), add `cdkScrollable` to enable automatic scrolling during drag:

```html
<div style="overflow: auto;" cdkScrollable>
  <div cdkDropList>...</div>
</div>
```

Without `cdkScrollable`, the CDK cannot detect or control scroll behavior during drag.

---

## CDK_DRAG_CONFIG Token

Many options can be configured globally via [`CDK_DRAG_CONFIG`](/api/cdk/drag-drop/CDK_DRAG_CONFIG):
- `previewContainer` (`global` | `parent`)
- `rootElementSelector`
- `boundaryElement`
- `lockAxis`
- `dragStartDelay`
- `draggingDisabled`
- `listOrientation`
- `sortingDisabled`

See [DragDropConfig API](/api/cdk/drag-drop/DragDropConfig) for full options.

---

## Integration with Other Components

CDK drag-and-drop can integrate with `MatTable` (sortable rows) and `MatTabGroup` (sortable tabs).
