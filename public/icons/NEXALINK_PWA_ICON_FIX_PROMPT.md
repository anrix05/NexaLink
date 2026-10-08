# NEXALINK: PWA ICON FIX PROMPT
## Replace the old installed-app icon and splash with the current logo. Nothing else changes.

---

## 0. HOW YOU MUST EXECUTE

1. Do everything in ONE run. Do not ask questions. Do not pause to demo.
2. **This is an asset-and-config change only. Do not change any component, page, style, logic, route, context, or dependency.**
3. At the end run type-check, `oxlint` and `vite build` once, fix errors, and stop.

## 1. WHAT IS WRONG

Installing NexaLink from Chrome shows the OLD logo (an "N" with two round end nodes) on the home screen and on the launch splash. The navbar and favicon already use the new logo. Chrome builds the installed-app icon and splash from the **web app manifest icons**, which still point to old files.

## 2. FILES YOU MAY TOUCH

- `public/icons/**` (add the new icon files; do not delete the old ones yet, just stop referencing them)
- The manifest: `public/manifest.webmanifest`, `manifest.json`, or the `manifest` block in `vite.config.*` if `vite-plugin-pwa` is used. Find which one the project uses.
- The icon, theme-color and manifest tags in `<head>` of `index.html`
- If a service worker precaches icons (Workbox `globPatterns` or `includeAssets`), update the icon list there and bump the precache/revision so old icons are not served
- `README.md` and `CHANGELOG.md` (append only)

**Do NOT touch** anything else: components, pages, `AuthContext`, `DataContext`, styles, tokens, fonts, routes, Supabase code, other config.

## 3. THE NEW ICON FILES (already generated, supplied with this prompt)

Copy these into `public/icons/` exactly as named:

| File | Use |
|---|---|
| `icon-192-v2.png`, `icon-512-v2.png` | manifest, `purpose: "any"` (rounded black tile, transparent corners) |
| `icon-maskable-192-v2.png`, `icon-maskable-512-v2.png` | manifest, `purpose: "maskable"` (full-bleed black, mark inside the safe zone) |
| `apple-touch-icon-v2.png` | iOS home screen (180×180) |
| `favicon-v2.ico`, `favicon-16-v2.png`, `favicon-32-v2.png`, `favicon-48-v2.png` | browser tab |
| `nexalink-mark.svg` | vector mark for later use. Just copy it to `src/assets/` or `public/icons/`; do not wire it into any component |

The `-v2` suffix is deliberate cache busting. Do not rename the files.

## 4. WHAT TO CHANGE

1. **Manifest icons:** replace the `icons` array with these four entries, each with its own `purpose` (never a combined `"any maskable"`):
   - `/icons/icon-192-v2.png` 192x192 `any`
   - `/icons/icon-512-v2.png` 512x512 `any`
   - `/icons/icon-maskable-192-v2.png` 192x192 `maskable`
   - `/icons/icon-maskable-512-v2.png` 512x512 `maskable`
2. **Manifest colours:** `background_color: "#000000"` (so the launch splash matches the black icon) and `theme_color: "#FFFFFF"` (matches the white top bar). Keep `name`, `short_name`, `start_url`, `scope` and `display` as they are. If any of them are missing, set `name` and `short_name` to `NexaLink`, `start_url` and `scope` to `/`, and `display` to `standalone`.
3. **`index.html` head:** use the `<link rel="icon">` tags for the three favicon files, `<link rel="apple-touch-icon" sizes="180x180">`, `<meta name="theme-color" content="#FFFFFF">`, `<meta name="apple-mobile-web-app-title" content="NexaLink">`, and make sure `<link rel="manifest">` points to the manifest. Remove any older icon, apple-touch-icon or theme-color tags so there are no duplicates.
4. **Service worker:** make sure the new icon URLs are precached (if a precache list exists) and the manifest is not served stale. Bump the precache revision/version.
5. **Docs:** add to `README.md` a short "App icons" section (where the icons live, that the `-v2` suffix is a cache-busting convention, and to bump to `-v3` for the next change). Add to `CHANGELOG.md`: "Replaced PWA, favicon and apple-touch icons with the current N-Link logo."

## 5. STATIC CHECKS (no browser)

- No reference to the old icon filenames remains in the manifest, `index.html` or the service worker precache list.
- Every `src` in the manifest points to a file that exists in `public/icons/`.
- The maskable entries use `purpose: "maskable"` alone, and the `any` entries use `purpose: "any"` alone.
- `git diff --stat` shows changes only in: `public/icons/**`, the manifest or `vite.config.*` manifest block, `index.html` head, the service worker precache list (if any), `README.md`, `CHANGELOG.md`.
- Type-check, `oxlint` and `vite build` pass.

## 6. MANUAL CHECK (for me, after deploy)

1. Chrome DevTools → Application → Manifest: the four icons preview as the new logo and no "icon not found" warnings.
2. On my phone: uninstall the installed NexaLink app, Chrome → Settings → Site settings → clear the site's data, open the site, install again. The home-screen icon and the launch splash show the new logo.
3. Browser tab favicon shows the new logo. On iOS, "Add to Home Screen" shows the new logo.

Stop after this. Do not start another round of changes.
