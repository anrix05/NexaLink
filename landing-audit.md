# NexaLink Landing Page Audit (landing-audit.md)
**Document Version:** 1.0  
**Date:** 2026-10-01  
**Scope:** Public landing page (`src/pages/LandingPage.tsx`), public navigation header (`src/components/common/Navbar.tsx`), public footer (`src/components/common/Footer.tsx`), spotlight carousel (`src/components/landing/CampusSpotlightCarousel.tsx`), and motion hooks (`useScrollReveal`, `useCountUp`, `intro.ts`).

---

## 1. Executive Summary & Architecture Audit
The current NexaLink landing page is a standard stacked container layout with static elements wrapped in basic IntersectionObserver hooks. Several architectural deficiencies prevent it from operating as a fluid, premium product motion site:
- **Fragile Visibility Gates:** Content visibility is tied directly to `isVisible` state derived from an IntersectionObserver. When JS execution is interrupted, delayed, or when the user scrolls rapidly, sections fail to reveal, producing complete blank gaps between departments and footer (L1).
- **Asymmetrical & Underutilized Hero:** The desktop hero dedicates 100% of its visual weight to a left-aligned typography lockup, leaving the right 50% completely vacant, while pushing the campus imagery below the fold (L3).
- **Typography & Casing Inconsistencies:** Multiple buttons use all-caps and heavy tracking (`ACCESS MEMBER PORTAL`, `ESC / TAP TO SKIP`), and CTAs use discordant phrasing (`Portal Access`, `Explore framework`, `Proceed to login / demo accounts`) (L5, L6).
- **Non-Sanctioned Styling:** Soft box-shadows (`shadow-lg`, `shadow-xl`) remain in the spotlight carousel, violating the 1px-border and high-contrast obsidian design rules (L4).
- **Data Display Flaws:** Live metrics display literal single quotes (`'A+' Grade`), show `0` or awkward singular phrasing (`Across 1 Country` when empty), and use monospace numbers (L2).
- **Redundant Auth Capture:** An embedded quick sign-up mini-form in the benefits section duplicates the authentication page, adding friction and clutter (L7).
- **Broken Grid Balance:** 5 departments (CMPN, INFT, EXTC, EXCS, BIOM) are rendered in a 4-column CSS grid, leaving BIOM as an orphaned single card in row 2 (L8).
- **Accessibility & Contrast Deficits:** Sub-12px monospace text in muted gray on `#FAFAFA` backgrounds fails WCAG AA 4.5:1 contrast requirements (L9, L10).

---

## 2. Section-by-Section Inventory

| Section | Current Implementation | Animation / Interaction | Bugs & Regressions Identified | Planned Solution |
| :--- | :--- | :--- | :--- | :--- |
| **5.0 Intro Preloader** | `src/components/intro/IntroOverlay.tsx` (2.2s–2.75s SVG slice assembly, ignited node, FLIP flight to navbar) | Framer Motion SVG slices + portal overlay | Blocks interaction for >2.2s; LCP can be delayed on slower connections; flight target bounding box can mismatch responsive layouts. | Streamline to 1.2s skippable monogram stroke-dash draw + wipe reveal; hero renders immediately underneath; skippable on any key/tap; respect `prefers-reduced-motion` and session flag. |
| **5.1 Hero Section** | Left-aligned 3-line headline with CSS opacity delays; right half is completely empty; CTAs are basic buttons. | Simple CSS transition delays (150ms, 250ms, 350ms, 450ms, 550ms); basic magnetic hover. | Hero right half empty (L3); carousel pushed below fold; inconsistent CTA naming ("Explore framework"); missing institutional trust bar. | 100svh split layout: Left has `<SplitText>` headline + subline + unified CTAs ("Sign in", "See how it works") + institutional trust bar. Right has interactive canvas/R3F alumni network with 60–90 drifting nodes, cursor attraction, and city labels, falling back to static SVG. |
| **5.2 Live Metrics Strip** | 4-card grid below carousel: verified alumni, active mentorships, job referrals, accreditation. | `useCountUp` hook with cubic ease-out; triggers on `galleryReveal.isVisible`. | Displays `'A+' Grade` with literal quotes; displays 0 alumni with "Across 1 country" (L2); monospace font used instead of Inter tabular numbers. | Redesign with 4 clean stat tiles using Inter `tabular-nums`; honest empty framing ("Be among the first verified alumni" when 0); clean "A+ Grade" without stray quotes; "Live from the platform" indicator. |
| **5.3 Scrollytelling (New)** | Currently missing entirely — page jumps directly from stats to "Architecture" cards. | None. | Misses the opportunity to clearly explain the core problem (fragmented alumni data) and transition to NexaLink solution and accreditation reports. | Build 3-beat pinned scrollytelling container (~300vh runway): Beat 1: Scattered chaos (WhatsApp, sheets, emails); Beat 2: Snaps into verified NexaLink grid with checkmarks; Beat 3: Condenses into NAAC 5.4.1/NIRF report card with export action. |
| **5.4 Features Stacking Cards** | 3-card static flex grid ("1:1 structured mentorship", "Verified alumni directory", "Exclusive opportunities"). | CSS translate-y fade triggered by `useScrollReveal`. | Static and non-interactive; CTA labels lack cohesion ("Explore mentors", "View directory", "Browse opportunities"). | Implement sticky stacking cards with slight scale-down of prior cards. Embed lightweight HTML/CSS animated UI mocks (mentor match %, verification badge flow, job apply press). Hover border darkens + arrow nudge; zero shadows. |
| **5.5 Role Journeys (New)** | Missing — value proposition is just a 4-bullet grid on gray background. | Simple scroll reveal fade. | Generic bullet list does not highlight the 4 distinct stakeholder workflows (Student, Alumni, Faculty, Admin). | Interactive segmented tabs with sliding `layoutId` pill. Dynamic 3-bullet value list + animated role UI mock (requests waiting, top matches, verification queue). Auto-advance every 6s, roving tabindex keyboard navigation, pause on hover. |
| **5.6 Campus Spotlight Gallery** | `src/components/landing/CampusSpotlightCarousel.tsx` (mobile swipe card; desktop shingled accordion rail). | Framer Motion layout animations, swipe drag gestures. | Desktop shingled rail uses soft shadows (`shadow-lg`, `shadow-xl`) (L4); can clip at certain breakpoints; captions use harsh black gradients. | Upgrade to pinned horizontal scroll gallery on desktop (vertical scroll translates photos horizontally with parallax framing); retain touch-drag swipe card for mobile; eliminate all `shadow-*` utility classes; ensure CLS = 0 with explicit aspect ratios. |
| **5.7 Trust & Accreditation** | Minimal mentions in footer and stats row. | None. | Institutional strengths (NAAC A+, NBA accredited, AICTE approved, MU affiliated) are buried; Criteria 5.4.1 workflow is not demonstrated. | Full-bleed `#0A0A0A` dark inverted section. Kinetic headline ("Accreditation-ready from day one."), infinite horizontal marquee of institutional facts, and interactive/animated data export pipeline mock (raw database -> NAAC 5.4.1 CSV/PDF). |
| **5.8 Academic Departments** | 4-column grid with 5 cards: CMPN, INFT, EXTC, EXCS, and orphan BIOM in row 2. | Basic border hover. | Orphan "BIOM" department card creates an unbalanced, visually jarring grid (L8). | 5-item horizontal interactive accordion/list on desktop (CMPN, INFT, EXTC, EXCS, BIOM); smooth height/width expansion revealing HOD, established year, and curriculum focus; vertical accordion on mobile. |
| **5.9 Final Call-to-Action** | Embedded quick sign-up form with input fields for Name & Email. | Basic form submit. | Duplicates sign-in/auth page functionality (L7); mentions demo accounts prematurely. | Remove embedded form. Create expansive closing statement ("Ready to reconnect?") with dual primary/secondary magnetic buttons ("Sign in" and "Create account") and subtle network lines background. |
| **5.10 Testimonial** | Footer quote block with Rushabh Sanghavi testimonial. | Minimal fade. | Positioned awkwardly inside the footer border; lacked prominent styling. | Elevated single quiet pull-quote section with verified alumnus credentials (Rushabh Sanghavi, Senior SWE at Google, CMU Alum, VIT Wadala). |
| **5.11 Public Footer** | 4 columns + top quote + bottom row. Left area is visually unbalanced; low contrast links on white/gray. | Minimal fade. | Empty left column; legal links row has text contrast below #6B7280; links point to dead hashes or unrouted pages (L9, L10). | Rebalanced 4-column grid with institutional address, real mailto/tel links, legal links, "Replay intro", and "Reduce motion" toggle; large faint "NexaLink" typography watermark sliding up on scroll. |

---

## 3. Detailed Verification of Known Bugs (L1 – L10)

### Bug L1: Blank Sections Between Departments and Footer
- **Root Cause:** `useScrollReveal` in `LandingPage.tsx` and `Footer.tsx` initializes `isVisible = false` and gates on `introDone`. If `IntersectionObserver` callback is delayed, fails in older browsers, or if JS thread is busy, elements remain styled with `opacity: 0` and `translate-y-8`, causing blank voids.
- **Fix:** Progressive enhancement. Content starts fully visible via CSS. Motion animations only attach when JavaScript confirms DOM readiness and reduced motion is inactive. `<Reveal>` primitive must have a fail-safe fallback (`once: true`, default visible style).

### Bug L2: Stats Formatting & Empty Status Anomalies
- **Root Cause:** `LandingPage.tsx` line 275 has literal `'A+' Grade` in JSX string; `uniqueCountriesCount` defaults to `1` even when `alumniList` is empty, displaying "Across 1 country" alongside "0 Verified Alumni". Numbers were displayed with monospace or unformatted fonts.
- **Fix:** Remove quotes from `A+ Grade`; display honest empty states ("Be among the first verified alumni") when alumni count is 0; use Inter font with `tabular-nums` for rock-solid tabular alignment.

### Bug L3: Asymmetrical Empty Hero & Displaced Carousel
- **Root Cause:** Hero section only uses a `max-w-4xl` left container. The right half of desktop screens (viewport widths > 1024px) is empty space. The campus carousel is placed below the fold in section 1.2 instead of giving the hero a signature visual anchor.
- **Fix:** Build a split-screen 100svh Hero with SplitText headline on the left and an interactive canvas/WebGL alumni network scene on the right (with smooth drift, node attraction, and city markers).

### Bug L4: Soft Shadows in Carousel and Cards
- **Root Cause:** `CampusSpotlightCarousel.tsx` uses Tailwind classes `shadow-lg`, `shadow-xl`, and `shadow-2xs`.
- **Fix:** Strip all `shadow-*` utility classes. Rely on pure obsidian monochrome contrast: 1px `#E5E7EB` or `#0A0A0A` borders with `#FAFAFA` and `#0A0A0A` surface fills.

### Bug L5: All-Caps Buttons and Tracking Excess
- **Root Cause:** Buttons and labels across sections used uppercase transforms (`ACCESS MEMBER PORTAL`, `ESC / TAP TO SKIP`, `VIDYALANKAR AUDITORIUM`).
- **Fix:** Enforce strict sentence case across all interactive elements, navigation links, and section titles. Uppercase with tracking is reserved exclusively for tiny eyebrow badges (<= 3 words, e.g., `ACCREDITATION · NAAC A+`).

### Bug L6: Fragmented CTA Terminology
- **Root Cause:** Disparate calls to action: "Portal Access", "Access Member Portal", "Explore framework", "Proceed to login / demo accounts".
- **Fix:** Standardize systematically on two clear verbs: Primary: "Sign in", Secondary: "Create account" (or in-page smooth scroll "See how it works").

### Bug L7: Redundant Mini Sign-Up Form
- **Root Cause:** `LandingPage.tsx` lines 434–475 render an inline form with name and email text fields that redirect to the auth tab, causing confusing UX.
- **Fix:** Remove the embedded form completely; replace with a clean, high-impact final CTA section.

### Bug L8: Orphan BIOM Department Card
- **Root Cause:** `DEPARTMENTS` array contains 5 departments (CMPN, INFT, EXTC, EXCS, BIOM). Rendered in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, resulting in 4 cards on row 1 and 1 isolated card on row 2.
- **Fix:** Replace with an interactive 5-item horizontal list/accordion on desktop that smoothly balances all 5 disciplines equally, collapsing into a clean vertical accordion on mobile.

### Bug L9 & L10: Footer Contrast & Layout Deficits
- **Root Cause:** Footer left column was empty, legal link text used muted `#9CA3AF` or `#D1D5DB` on light backgrounds, failing contrast guidelines (minimum 4.5:1). Monospace tags under 12px had insufficient legibility.
- **Fix:** Fill left column with brand mark and mission statement; raise all muted text to `#6B7280` or `#374151` on light backgrounds; ensure all font sizes are >= 12px for body and labels.

---

## 4. Motion Architecture & Implementation Plan
1. **Motion Tokens (`motion.ts`):** Standardize durations (0.2s, 0.5s, 0.9s), easings (cubic-bezier(0.22, 1, 0.36, 1)), springs (UI: 400/20; large: 120/20), and stagger (0.06s).
2. **Smooth Scroll Provider (`SmoothScroll.tsx`):** Integrate Lenis, automatically disabled on `prefers-reduced-motion` and touch devices if jank occurs; smooth anchor jumps with navbar offset.
3. **Core Reusable Primitives (`src/components/landing/motion/`):**
   - `SplitText`: word-level masked translate-Y reveals with full screen reader accessibility.
   - `Reveal`: IntersectionObserver fade/slide-up with CSS-first visibility fallback.
   - `ScrollProgress`: 2px top fixed bar.
   - `Marquee`: Infinite smooth horizontal loop with hover & reduced-motion pause.
   - `MagneticButton`: Cursor attraction (max 8px) on `pointer: fine` devices.
   - `PinnedSection`: Sticky scrollytelling container.
4. **Hero Alumni Network (`AlumniNetworkHero.tsx`):** Lightweight 60-90 node canvas with drift, cursor proximity lines, and labeled city hubs, with static SVG fallback.
5. **Quality & Performance Validation:** Typecheck, oxlint, responsive sweep across 320px–1920px, reduced-motion validation, and bundle audit.
