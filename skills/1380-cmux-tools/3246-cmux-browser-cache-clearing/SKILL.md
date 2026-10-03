---
name: cmux-browser-cache-clearing
description: Clear stale cmux browser cache/state when a page, image, or asset renders incorrectly in cmux but works in other browsers. Use especially when the last image on a page remains broken after content and media URLs are correct.
metadata:
  short-description: Clear stale cmux browser cache
---

# cmux Browser Cache Clearing

Use this when the cmux browser shows stale or broken page state, especially broken images that work in another browser or on the media host. The goal is to clear cmux browser state and reload the page. Do not change content, image paths, theme code, render hooks, or media files as a workaround for a cmux-only cache issue.

## Workflow

1. Identify the browser surface that has the stale page.

   ```bash
   cmux list-panes
   cmux list-pane-surfaces --pane <pane-ref>
   cmux browser --surface <surface-ref> get url
   ```

2. Confirm the page or asset is plausibly a cache issue before clearing broad profile state.

   Useful checks:

   ```bash
   cmux browser --surface <surface-ref> eval "Array.from(document.images).map(img => ({src: img.currentSrc || img.src, alt: img.alt, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight}))"
   cmux browser --surface <surface-ref> errors list
   ```

   If the affected asset URL is known, check it directly with `curl -I`. A `200` from the media host together with a broken cmux rendering usually indicates stale cmux browser state.

3. Clear non-destructive page storage first.

   ```bash
   cmux browser --surface <surface-ref> storage local clear
   cmux browser --surface <surface-ref> storage session clear
   cmux browser --surface <surface-ref> eval "(async () => { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); return keys; })()"
   cmux browser --surface <surface-ref> console clear
   ```

4. Reload with a cache-busting URL.

   ```bash
   cmux browser --surface <surface-ref> navigate "http://127.0.0.1:1313/path/?cmux-cache-bust=YYYYMMDDNN" --snapshot-after
   ```

5. If the asset is still stale, clear the cmux browser profile that owns the surface.

   ```bash
   cmux browser profiles list
   cmux browser profiles clear default --force
   cmux browser --surface <surface-ref> navigate "http://127.0.0.1:1313/path/?cmux-cache-bust=YYYYMMDDNN" --snapshot-after
   ```

   This clears browser data for the profile. Use it only for a user-requested cache clear or after confirming the issue is isolated to cmux browser cache.

6. Verify the affected element after reload.

   For a specific image title:

   ```bash
   cmux browser --surface <surface-ref> eval "(() => { const imgs = Array.from(document.querySelectorAll('khao-image')); const target = imgs.find(el => (el.getAttribute('title') || '').includes('TEXT')); target?.scrollIntoView({block: 'center'}); const img = target?.shadowRoot?.querySelector('img'); return target ? {hostSrc: target.getAttribute('src'), webp: target.getAttribute('webp'), imgSrc: img?.currentSrc || img?.src, className: img?.className, naturalWidth: img?.naturalWidth, naturalHeight: img?.naturalHeight} : null; })()"
   ```

   A successful image has non-zero `naturalWidth` and `naturalHeight`, and should not have a fallback class.

## Constraints

- Do not start or restart local servers.
- Do not edit content or theme files for a cmux-only cache problem.
- Do not delete files in the repository or media store.
- Prefer clearing surface-local storage first. Escalate to profile clearing only when needed.
