# NgOptimizedImage

Source: https://v20.angular.dev/guide/image-optimization

`NgOptimizedImage` makes it easy to adopt performance best practices for loading images.

## What It Does Automatically

- Sets `fetchpriority` on the LCP image's `<img>` tag
- Lazy-loads non-priority images by default
- Generates a `preconnect` link tag in `<head>`
- Generates a `srcset` attribute
- Generates a preload hint when using SSR

Also enforces best practices:
- Warns if `width` or `height` are missing or incorrect
- Warns if the image will be visually distorted

## Getting Started

### 1. Import

```ts
import { NgOptimizedImage } from '@angular/common';

// In component or NgModule imports:
imports: [NgOptimizedImage]
```

### 2. Enable the directive

Replace `src` with `ngSrc`:

```html
<img ngSrc="cat.jpg">
```

### 3. Mark LCP images as `priority`

```html
<img ngSrc="cat.jpg" width="400" height="200" priority>
```

`priority` applies:
- `fetchpriority=high`
- `loading=eager`
- A preload link element (when using SSR)

Angular warns in development if the LCP image doesn't have `priority`.

### 4. Include `width` and `height`

```html
<img ngSrc="cat.jpg" width="400" height="200">
```

- **Responsive images**: use intrinsic size of the image file; also set `sizes`
- **Fixed-size images**: use desired rendered size; aspect ratio must match intrinsic aspect ratio

## Fill Mode

When you want an image to fill its container (like a background image):

```html
<img ngSrc="cat.jpg" fill>
```

- Do not include `width` and `height` with `fill`
- Parent element **must** have `position: relative`, `fixed`, or `absolute`
- Use `object-fit` CSS to control fill behavior (`contain` / `cover`)
- Use `object-position` to adjust position within the container

## Migrating from `background-image`

1. Remove the `background-image` style from the containing element
2. Ensure the containing element has `position: relative/fixed/absolute`
3. Create an `<img>` child element using `ngSrc`
4. Give it the `fill` attribute (no `height`/`width`)
5. Add `priority` if it might be the LCP element

## Placeholders

### Automatic placeholder (requires CDN/image resizing)

```html
<img ngSrc="cat.jpg" width="400" height="200" placeholder>
```

Requests a smaller version and applies it as a blurred CSS `background-image` while loading.

Default placeholder size: 30px wide. Customize via `IMAGE_CONFIG`:

```ts
providers: [{
  provide: IMAGE_CONFIG,
  useValue: { placeholderResolution: 40 }
}]
```

### Data URL placeholder

```html
<img ngSrc="cat.jpg" width="400" height="200"
     placeholder="data:image/png;base64,iVBORw0K..."/>
```

Keep base64 placeholders < 4KB.

### Non-blurred placeholder

```html
<img ngSrc="cat.jpg" width="400" height="200" placeholder
     [placeholderConfig]="{blur: false}"/>
```

## Performance Features

### Automatic srcset

For **fixed-size** images (no `sizes` needed):
```html
<!-- Generated: -->
<img ... srcset="image-400w.jpg 1x, image-800w.jpg 2x">
```

For **responsive** images, add `sizes`:
```html
<img ngSrc="cat.jpg" width="400" height="200" sizes="100vw">
```

`NgOptimizedImage` auto-prepends `"auto"` to `sizes` for supporting browsers.

Default responsive breakpoints:
```
[16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
```

Customize breakpoints:
```ts
providers: [{
  provide: IMAGE_CONFIG,
  useValue: { breakpoints: [16, 48, 96, 128, 384, 640, 750, 828, 1080, 1200, 1920] }
}]
```

Manual srcset via `ngSrcset`:
```html
<img ngSrc="hero.jpg" ngSrcset="100w, 200w, 300w" sizes="50vw">
```

### Disable srcset generation

```html
<img ngSrc="about.jpg" disableOptimizedSrcset>
```

### Disable lazy loading

```html
<img ngSrc="cat.jpg" width="400" height="200" loading="eager">
```

### Image decoding

- Default: `decoding="auto"`
- Priority images: automatically `decoding="sync"`
- Override explicitly: `decoding="async"` or `decoding="sync"`

### Preconnect hints

Auto-generated for domains provided to loaders. To suppress warnings:

```ts
providers: [{provide: PRECONNECT_CHECK_BLOCKLIST, useValue: 'https://your-domain.com'}]
```

Manual preconnect in `index.html`:
```html
<link rel="preconnect" href="https://my.cdn.origin" />
```

## Configuring Image Loaders

### Built-in loaders

| Image Service | Angular API |
|---|---|
| Cloudflare Image Resizing | `provideCloudflareLoader` |
| Cloudinary | `provideCloudinaryLoader` |
| ImageKit | `provideImageKitLoader` |
| Imgix | `provideImgixLoader` |
| Netlify | `provideNetlifyLoader` |

```ts
providers: [
  provideImgixLoader('https://my.base.url/'),
]
```

### Custom loader

```ts
providers: [{
  provide: IMAGE_LOADER,
  useValue: (config: ImageLoaderConfig) => {
    return `https://example.com/images?src=${config.src}&width=${config.width}`;
  },
}]
```

`ImageLoaderConfig` has: `src`, optional `width`, optional `loaderParams`.

### `loaderParams` for custom CDN features

```html
<img ngSrc="profile.jpg" width="300" height="300" [loaderParams]="{roundedCorners: true}">
```

```ts
const myCustomLoader = (config: ImageLoaderConfig) => {
  let url = `https://example.com/images/${config.src}?`;
  let queryParams = [];
  if (config.width) queryParams.push(`w=${config.width}`);
  if (config.loaderParams?.roundedCorners) queryParams.push('mask=corners&corner-radius=5');
  return url + queryParams.join('&');
};
```

## FAQ

**Why use `ngSrc` instead of `src`?**
`NgOptimizedImage` modifies the `loading` attribute programmatically. If the browser sees `src` first, it starts downloading immediately before those changes apply.

**Two image domains on one page?**
Write a custom loader that uses `loaderParams` to flag which CDN to use.

**Does it support `background-image` CSS?**
Not directly, but the fill mode pattern achieves the same result.

**Does it support `<picture>` tag?**
Not yet — on the roadmap.
