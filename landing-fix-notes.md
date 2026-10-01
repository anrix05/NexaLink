# NexaLink Landing Page Fix Notes (landing-fix-notes.md)
**Date:** 2026-10-01  
**Scope:** Public landing page fix pass following the initial motion redesign.

---

## 1. Reproduction & Root Cause Analysis

### P0-1. Transformation Section: Overlapping Text and Leftover Cards
- **Observed Symptoms:**
  - During step 2, step 1 headline text remains faintly visible underneath step 2 (~25% opacity).
  - During step 3, step 1 headline, eyebrow, and paragraph re-appear or stay visible overlapping step 3 text, and step 2 cards remain visible behind the report card.
  - Screen readers and keyboard navigation traverse all three beats simultaneously because non-active beats are merely styled with `opacity: 0` without `visibility: hidden`, `inert`, or `aria-hidden="true"`.
- **Root Causes:**
  1. **Non-Exclusive Crossfade Windows:** The previous opacity transforms were `beat1: [0, 0.28, 0.36] -> [1, 1, 0]`, `beat2: [0.32, 0.38, 0.62, 0.68] -> [0, 1, 1, 0]`, `beat3: [0.64, 0.72, 1] -> [0, 1, 1]`. The crossfade ranges overlapped heavily (e.g., at progress 0.34, both beat 1 and beat 2 had opacity ~0.3–0.5).
  2. **Lack of Single Grid-Cell Stacking:** The text beats were rendered inside `absolute inset-0` containers inside a parent with arbitrary height, which caused text stacking context collisions and height mismatches.
  3. **Visual Layer Leakage:** The cards in beat 2 and report card in beat 3 were rendered in separate containers without strict exclusive visibility gating. The cards container faded to 0 opacity but stayed rendered in the DOM right behind the report card.
  4. **No Visibility / Inert Guards:** Non-active beats lacked `visibility: hidden` and `inert`, causing them to capture pointer events and remain accessible in the accessibility tree.

### P0-2. Hero Network Collapse
- **Observed Symptoms:**
  - Resizing the window causes node positions to get out of sync with canvas bounds because `width` and `height` updated in `resize()` without proportionally rescaling existing node positions (`x`, `y`).
  - Switching tabs pauses `rAF`. On tab return, un-clamped delta time causes sudden jumping.
  - Cursor attraction used a global `window` mousemove listener with no minimum distance guard or falloff clamp, pulling nodes into a single point. On mouseleave, nodes did not spring back to their home anchors.
  - City labels did not run collision/overlap checks, allowing labels to collide on narrower viewports.

### P1-1. Invented Statistics and Contradictions
- **Observed Symptoms:**
  - Beat 1 cards claimed "40% outdated emails" and "12% open rate", which are arbitrary invented statistics not backed by institutional facts.
  - Beat 2 did not dynamically transform the card copy during the transition.
  - Beat 3 report card showed "Audit compliance 100%", which contradicted the real platform status when the database had 0 or different records.

### P1-2. Hero Badge Semantic Colors
- **Observed Symptoms:**
  - Hero badge used `bg-emerald-500` green pulsing dot and literal `"Live verified network"` regardless of whether verified alumni existed.
  - Requirement mandates strict obsidian monochrome (no emerald or semantic colors on the public landing page).

### P2. Typography, Casing, and Spacing Inconsistencies
- **Observed Symptoms:**
  - Multiple varied eyebrow implementations with uppercase and monospace styling.
  - Monospace font was applied to numbers and labels like "Step X of 3", "Alumni contribution", and "Verified".
  - Nav link said "Transformation" while secondary CTA said "See how it works", pointing to mismatched anchors.
  - Nav at scroll 0 had a faint background band on mobile instead of being purely transparent.
  - Pinned stage had excess vertical whitespace before and after.

---

## 2. Action Plan

1. **P0-1 Fix:**
   - Rebuild `ScrollytellingSection.tsx` with one sticky stage (`position: sticky; top: 0; height: 100svh`), centered content (`flex, items-center`), single CSS grid cell stacking (`grid-area: 1 / 1`).
   - Implement `beatStyle(progress, start, end, fade = 0.06)` helper ensuring outgoing beat reaches 0 opacity before incoming beat reaches 0.2.
   - Attach `useMotionValueEvent` to toggle `visibility: hidden`, `inert`, and `aria-hidden="true"` when opacity < 0.05.
   - Ensure visual layer morphs cleanly (scattered cards -> verified cards -> report card) and completely hides non-active elements.
   - Set 400vh desktop runway with 30% dwell on beat 3.

2. **P0-2 Fix:**
   - Update `AlumniNetworkCanvas.tsx`: clamp frame delta to max 1/30s; listen to `document.visibilitychange`; use `ResizeObserver` with proportional rescaling (`xRatio`, `yRatio`).
   - Restrict pointer tracking to canvas bounding box; enforce minimum distance guard (~15px) and max force with soft spring return to `homeX`/`homeY`.
   - Add label collision prevention with Mumbai as highest priority.

3. **P1-1 & P1-2 Fix:**
   - Update beat 1 copy to purely qualitative descriptions; add "Illustrative example" caption.
   - Connect beat 3 report card to `useData()` for live verified count with empty state fallback.
   - Replace hero emerald badge with neutral ink dot (40% opacity) and dynamic/illustrative text.

4. **P2 Fix:**
   - Create shared `<Eyebrow>` component.
   - Convert labels and numbers to Inter `tabular-nums`.
   - Standardize anchor to `#how-it-works` and nav label to "How it works".
   - Refine nav scroll transition (0px: 100% transparent, 40px: white 90% backdrop-blur).
   - Standardize section vertical margins (96px desktop, 64px mobile).
