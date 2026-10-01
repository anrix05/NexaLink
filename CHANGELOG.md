# Changelog

All notable changes to the NexaLink platform are documented in this file.

---

## [v2.7.0] - 2026-10-01

### One-Time Logo Intro Animation & Motion System Hardening

#### Added
- **Cinematic One-Time Intro Animation (`src/components/intro/IntroOverlay.tsx`):**
  - High-performance, obsidian `#0A0A0A` full-screen opening sequence that plays on initial load at `/`.
  - **4-Slice Geometric Assembly (0–1100ms):** Slices S1, S2, S3, S4 assemble from alternating vertical offsets (±24px to ±60px) and ±3–4° rotations with a +80ms center-outward stagger.
  - **Seamless Settle Phase (1100–1500ms):** Zero-artifact frame swap to a single unclipped `<use>` symbol as the mark scales 0.96 → 1.0 and brightens to `#FFFFFF`, while the live-text "NexaLink" wordmark fades up.
  - **The "Link" Ignition (1500–1900ms):** The central orange nexus node pops in with spring physics (`stiffness: 500, damping: 20`), the white center dot flashes, and a single stroke ring expands and dissolves (scale 1 → 2.4).
  - **FLIP Flight & Color Handoff (2200–3000ms):** Precise translation and scale animation from central stage directly to the navbar logo target (`data-intro-target="logo"`). A mid-flight color switch transitions the mark fill smoothly at background alpha ~0.5.
  - **10 Drifting Network Dots:** Ambient particles drifting with pure CSS transforms on `high` performance tier devices.
- **Canonical Vector Logomark (`src/components/brand/NexaMark.tsx`):**
  - Pure SVG vector component with snapped 45-degree chamfers, 1024-grid coordinates (`viewBox="250 140 525 558"`), and single central node.
  - Reused across `Navbar.tsx`, `SidebarNav.tsx`, `Footer.tsx`, and `LogoMark.tsx` for 100% pixel-identical rendering.
- **Intro State Management & Performance Governor (`src/lib/intro.ts`):**
  - `shouldPlayIntro()`, `markIntroSeen()`, `replayIntro()`, and `useIntroDone()` hook.
  - Pure synchronous hardware and network tier governor (`getPerfTier()`).
  - Auth callback link detection (`isAuthCallbackUrl`) to ensure password recovery, email verification, and OAuth tokens are never obstructed.
- **Replay Capabilities:**
  - URL parameter `/?intro=1` forces playback.
  - "REPLAY INTRO" link added to public and portal footers (`Footer.tsx`).
  - "Replay Intro Animation" quick action added to global `CommandPalette` (`Ctrl+K`).
- **Comprehensive Quality Assurance Checklist (`docs/MANUAL_QA.md`):**
  - 12-point testing and evaluation guide covering cold starts, refreshes, deep links, auth callbacks, replay triggers, accessibility, responsiveness, and Lighthouse CLS verification.

#### Changed
- **`index.html`:**
  - Added synchronous inline decision script in `<head>` (runs before first paint).
  - Added pre-JS CSS failsafe (4s timeout) and `<noscript>` fallback.
  - Added `#intro-root` container outside `#root`.
  - Added Google Font `Outfit` for geometric sans display wordmark.
- **`Navbar.tsx`:**
  - Integrated canonical `NexaMark` vector.
  - Added `data-intro-target="logo"` attribute to the main header mark.
- **`LandingPage.tsx`:**
  - Synchronized hero headline entrance stagger, `useScrollReveal`, and `useCountUp` live stat counters with `useIntroDone()`.
- **`PRD.md`, `design.md`, `architecture.md`, `memory.md`:**
  - Updated to PRD v2.7.0.
  - Superseded outdated "2 connected circular nodes" wording with canonical "one central connecting nexus core node".
  - Documented complete intro timeline, design rules, and performance guidelines.
- **Intro Animation Fixes (`IntroOverlay.tsx`, `App.tsx`, `index.html`):**
  - **React 19 StrictMode Resilience:** Removed `finishIntro()` from `useEffect` cleanup hook so double-mount simulation in dev mode does not abort playback or set `dataset.intro = 'done'` prematurely.
  - **SVG Group Coordinate Space:** Replaced `<symbol>` with `<g id="nexa-mark">` so slices share the exact SVG `viewBox="250 140 525 558"` coordinate space, preventing viewport offset mismatches and invisible slice clipping.
  - **Direct Synchronous Mounting:** Direct import of `IntroOverlay` in `App.tsx` eliminated async dynamic chunk loading delay.
  - **Accidental Skip Guard:** Added a 500ms grace period on overlay click and removed aggressive `onTouchStart` to eliminate accidental skips on page load.
  - **Z-Index Layering:** Elevated `#intro-root` and overlay to `z-[99999]` with smooth opacity transition on target navbar logo.

#### Assumptions
1. **Session Scope:** Default `INTRO_SCOPE` is `'session'` using `sessionStorage` key `nexalink:intro:v1`, meaning the intro plays once per browser tab session.
2. **Route Scope:** Strictly constrained to the initial boot at pathname `/` (`INTRO_ENABLED_ROUTES = ['/']`).
3. **State-Based Navigation:** In-app SPA tab switches (`activeTab` in `App.tsx`), including the logo "Return to Dashboard" action, never trigger the intro.
4. **4-Slice Geometric Division:** The N monogram is assembled from 4 vertical geometric slices (S1: x 250..340, S2: x 340..512, S3: x 512..683, S4: x 683..770) with 1px overlap to eliminate hairline rendering seams.
5. **Node Ignites Last:** The central node is absent during the assembly phase so that the ignition feels like the "link" that locks the two halves together.
6. **Orange Node Asset Exception:** Sampled exact hex `#FD9C03` from `Logo.png`. Designated as an intrinsic logomark asset attribute (via CSS variable `--nexalink-node`) rather than a UI accent, strictly confined to the logomark vector. Configurable in `src/lib/intro.ts` via `INTRO_NODE_COLOR`.
7. **White-to-Target Color Handoff:** During the FLIP exit, the mark's fill switches to the target logo's computed color in a fast ~60ms step when the overlay background alpha is ~0.5, ensuring readability across the transition.
8. **Lightweight `getPerfTier()`:** Added a pure synchronous performance tier classifier using browser hardware concurrency, device memory, network connection type, and data-saver signals without measuring runtime FPS.

#### New Files
- `src/lib/intro.ts`
- `src/components/brand/NexaMark.tsx`
- `src/components/intro/IntroOverlay.tsx`
- `docs/MANUAL_QA.md`
