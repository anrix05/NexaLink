# Design System & UI Specifications: NexaLink

## 1. Aesthetic Direction & Visual Principles

NexaLink enforces a modern, high-contrast monochromatic design system engineered for institutional precision, visual clarity, and high data density for Vidyalankar Institute of Technology (VIT), Wadala.

### Core Visual Guidelines
* **Palette:** Pure white (`#FFFFFF`) background canvas, near-black (`#0A0A0A`) primary accents & typography, `#6B7280` muted text, `#E5E7EB` 1px hairline borders.
* **No Soft Shadows:** Avoid fuzzy, elevated drop shadows (`shadow-lg`, `shadow-xl`). Use crisp 1px borders and sharp backdrops (`backdrop-blur-md`).
* **Sanctioned Semantic Accents:** Strictly adheres to the obsidian, white, and hairline gray visual system. The four semantic status accents defined in PRD Section 2.1 are the only sanctioned exceptions, reserved exclusively for their defined semantic meaning — no other colors, decorative gradients, or ad hoc accent usage are permitted:
  - **Verified Emerald:** `#065F46` / `#ECFDF5` (Verified alumnus/student status, approval badges)
  - **Actionable Amber:** `#B45309` / `#FEF3C7` (Pending review, clarification requests, waitlist alerts)
  - **Governance Rose:** `#991B1B` / `#FEE2E2` (Rejected records, safety warnings)
  - **Academic Indigo:** `#3730A3` / `#EEF2FF` (Role identification badges)
* **Logomark:** Geometric "N-Link" Monogram built from two interlocking halves with precision 45° chamfers and one central connecting nexus core node (orange ring with white inner dot).
* **Logomark Color Exception:** The central node color (`--nexalink-node: #FD9C03`) is an intrinsic logomark asset attribute, not a UI accent, strictly confined to the logomark vector across light and dark displays.
* **Typography:** Clean sans-serif and display typography (`Inter` / `Outfit` font families) with uppercase tracking on labels.

---

## 2. Motion System & Micro-Interactions

### 2.1 One-Time Logo Intro Animation (`src/components/intro/IntroOverlay.tsx`)
A cinematic opening sequence that plays once per browser session on initial load at `/`.

#### Intro Timeline Table
| Phase | Desktop Timing | Mobile Timing | Description & Micro-Interactions |
| :--- | :--- | :--- | :--- |
| **0. Blackout** | 0–150ms | 0–100ms | Flat `#0A0A0A` obsidian canvas; 10–12 drifting network dots on `high` tier. |
| **1. Assemble** | 150–1100ms | 100–900ms | 4 vertical slices (S1: x 250..340, S2: x 340..512, S3: x 512..683, S4: x 683..770) start with alternating vertical offsets (±24px to ±60px) and ±3–4° rotations, opacity 0, `#4A4A4A`. S2/S3 lead, S1/S4 follow (+80ms stagger from center outwards). Easing: `cubic-bezier(0.16, 1, 0.3, 1)`. |
| **2. Settle** | 1100–1500ms | 900–1200ms | Slices swap seamlessly to a single un-clipped `<use>` symbol. Mark scales 0.96 → 1.0, brightens to `#FFFFFF`. Live-text "NexaLink" wordmark fades up from 1200ms (opacity 0 → 1, translateY 8px → 0). |
| **3. Ignite** | 1500–1900ms | 1200–1550ms | Central nexus core node (`#FD9C03`) pops in with spring physics (`stiffness: 500, damping: 20`), white dot flashes once, and a single pre-rendered stroke ring scales 1 → 2.4 while fading. |
| **4. Hold** | 1900–2200ms | 1550–1750ms | Gentle 2% scale breath across the entire brand lockup. |
| **5. Exit (FLIP)** | 2200–3000ms | 1750–2400ms | Wordmark fades out (200ms). Mark executes FLIP translation and scale to the navbar logo (`data-intro-target="logo"`). Overlay background fades to transparent (600ms). At mid-alpha (~250ms into exit), mark fill executes a fast 60ms color handoff to match target logo color. |

#### Design & Performance Rules
- **Pure Vector Architecture:** Powered by `NexaMark.tsx` without stretched bitmaps.
- **Strictly No Blurs/Filters:** No `filter: blur`, `backdrop-filter`, or `<canvas>`.
- **Keyboard & Touch Dismissal:** Instant 250ms fade skip on click, tap, `Esc`, or any key.
- **Failsafe Standard:** CSS failsafe hides `#intro-root` after 4 seconds; `<noscript>` keeps UI immediately interactive if JavaScript is disabled.

### 2.2 Core Motion Primitives
* **Framer Motion Physics:** Consistent spring physics (`stiffness: 400, damping: 17`, `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.95 }}`) across interactive buttons, cards, and modal triggers.
* **Sliding Layout Pills:** Synchronized background pill indicators via `layoutId` across auth mode toggles, role selectors, opportunity sub-tabs, and bottom navigation.
* **Smooth Height Resizing:** Dynamic height transitions (`layout` + `<AnimatePresence mode="wait">`) on auth cards and collapsible sections.
* **Animated Checkmarks (`AnimatedCheckIcon`):** Real SVG `strokeDasharray` and `pathLength` animations for approval, verification confirmation, and task completion.
* **Scroll Reveal:** Reusable `useScrollReveal` hook using `IntersectionObserver` to trigger smooth slide and fade-up entrance animations.
* **GPU-Accelerated Stat Counters:** Reusable `useCountUp` hook powering live accreditation metrics on scroll into view.
* **Accessibility:** Full `prefers-reduced-motion` compliance across all animations.

---

## 3. Mobile Native App Experience (<1024px)

* **Standardized 5-Tab Fixed Bottom Navigation (`BottomNav.tsx`):**
  - High-precision bottom bar (`grid grid-cols-5`) for Student, Alumni, and Faculty: **Home, Directory, Opportunities, Guidance, Chats**.
  - Safe-area inset support (`pb-safe`) and sliding indicator pill.
* **Slide-Up Bottom-Sheet Modals:**
  - Full bottom-sheet presentation with centered grab handle, fluid swipe/tap dismissal, and safe-area padding.
* **Streamlined Top Bar:**
  - Authenticated mobile top bar with `[🔍 Search]`, `[🔔 Notifications]`, and `[Avatar]` trigger opening an interactive popover (Name, Email, Role, Settings, Log Out).
* **Native Touch Polish:**
  - Momentum touch scrolling (`.momentum-scroll`) across horizontal chips and card lists.
  - Form input font sizes locked at `16px` on mobile to prevent iOS Safari auto-zooming.
* **Admin Mobile Interstitial (`AdminMobileInterstitial.tsx`):**
  - Dedicated notification modal alerting admins that complex governance tables and verification queues are optimized for desktop displays, with an emergency bypass hatch.

---

## 4. Key Screen Layouts & Domain Redesigns

### 4.1 Account Verification Gate & Connected Stepper (`VerificationPendingPage.tsx` & `RoleGate.tsx`)
- **Un-nested Canvas Layout:** Content sits directly on a centered `max-w-2xl` column canvas with generous margins.
- **Connected Horizontal Stepper:** 3 nodes (Registration / Verification / Access Portal) connected by an animated line draw track (`scaleX: 0 -> 1`) and gentle continuous aura pulse on the active Verification node.
- **Focal Status Centerpiece:** Large hero heading and live pulsing status pill (`Verification in Progress`).
- **Quiet Profile Reference List:** Divided label/value list (Full Name, Role, Department, Email, ID No, Document status) replacing heavy grid cards.

### 4.2 Unified Opportunities Hub (`OpportunitiesPage.tsx`)
- Merges **Jobs & Internships** and **Campus Events & Talks** into a single cohesive destination.
- Top-level `SegmentedTabs` switcher (`layoutId="opportunitiesSubTabPill"`) displaying live counts for active listings and upcoming events.
- Deep-linking support via `initialSubTab` allowing stat cards and command palette shortcuts to open target sub-tabs directly.

### 4.3 Student Home Summary Dashboard (`StudentDashboard.tsx`)
- **Scope Reduction:** Compact horizontally-scrollable "Top Matches" preview row linking to Guidance (`mentorship`).
- **Consolidated Profile Completion:** Single source of truth progress card with embedded resume status (`Resume: ... ✓ On File`).
- **2×2 Stat Grid:** Interactive metric cards (Active Requests, Smart Matches, Job Openings, Campus Events) with deep links.

### 4.4 Alumni Directory & Multi-Filter Search (`AlumniDirectoryPage.tsx`)
- Consolidated search experience replacing heavy hero cards with a streamlined multi-filter row (Department, Company/University, Technical Skills, Mentor Toggle).
- Lightweight autocomplete typeahead for master organization lookups bound to Company/University input.
- Role tabs (All Members, Alumni Profiles, Faculty Profiles) dynamically reflect applied cross-filters.
- **Direct Messaging Access:** Contextual "Message" buttons added to profile modals for verified users, enabling seamless 1:1 NexaChat creation directly from directory search.

### 4.5 Profile Settings & Storage Persistence (`SettingsPage.tsx`, `storage.ts`)
- **Native File Pickers:** Direct `<input type="file">` integrations for uploading resumes, proof documents, and avatars.
- **Instant Persistence:** Avatar uploads run through `uploadAvatar` (Supabase Storage) and instantly persist to user database records and active session state (`updateCurrentUserState`), preventing data loss on page refresh.
- **Clean Default State:** Blank states for unpopulated arrays/strings rather than dummy autofill data.

### 4.6 Global Session Security & Public Legal Pages (`App.tsx`, `Navbar.tsx`)
- **Public Legal Pages:** Terms of Service, Privacy Policy, and Data Governance pages are un-gated in the root router (`App.tsx`).
- **View-Derived Navbar Isolation:** `isPublicView` ensures `Navbar.tsx` only renders public navigation links on public routes.
- **Global Scroll Restoration:** Top-level `useEffect` listening to `activeTab` triggers `window.scrollTo(0, 0)` ensuring SPA transitions always start from the top of the viewport.
- **Interactive Brand Logo Navigation:** Clicking NexaLink logo smoothly scrolls to top and opens the Landing page, displaying `[ ->| RETURN TO DASHBOARD ]` for authenticated sessions to return seamlessly.
