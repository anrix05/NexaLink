# Design System & UI Specifications: NexaLink

## 1. Aesthetic Direction & Visual Principles

NexaLink enforces a modern, high-contrast monochromatic design system engineered for institutional precision, visual clarity, and high data density.

### Core Visual Guidelines
* **Palette:** Pure white (`#FFFFFF`) background canvas, near-black (`#0A0A0A`) primary accents & typography, `#6B7280` muted text, `#E5E7EB` 1px hairline borders.
* **No Soft Shadows:** Avoid fuzzy, elevated drop shadows (`shadow-lg`, `shadow-xl`). Use crisp 1px borders and sharp backdrops (`backdrop-blur-md`).
* **Sanctioned Semantic Accents:** Strictly adheres to the obsidian, white, and hairline gray visual system. The four semantic status accents defined in PRD Section 2.1 (Verified Emerald `#065F46`, Actionable Amber `#B45309`, Governance Rose `#991B1B`, Academic Indigo `#3730A3`) are the only sanctioned exceptions, reserved exclusively for their defined semantic meaning — no other colors, decorative gradients, or ad hoc accent usage are permitted.
* **Logomark:** Geometric "N" Monogram with 2 connected circular network nodes forming a diagonal bridge.
* **Typography:** Clean sans-serif and display typography (`Inter` / `Outfit` font families) with uppercase tracking on labels.

---

## 2. Shared Component Primitives (`src/components/common/UIComponents.tsx`)

* **`Button`:** Tactile spring-animated component (`whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.95 }}`, `stiffness: 400, damping: 17`) with `primary`, `secondary`, `ghost`, and `danger` variants.
* **`Card`:** Framer Motion container with subtle hover lift (`y: -2px`, `scale: 1.01`) and hairline border highlights.
* **`Modal` & `Toast`:** Animated dialog and notification containers with smooth backdrop blur and spring transitions.
* **`AnimatedCheckIcon`:** SVG stroke-dasharray/pathLength animation for approval and verification confirmation.
* **`SegmentedTabs`:** High-contrast pill tab switcher using `layoutId` for smooth gliding indicator transitions.
* **`StatCard`:** Metrics container featuring mono-formatted count numbers and live computed statistics.

---

## 3. Motion System & Micro-Interactions

* **Framer Motion Physics:** Consistent spring physics (`stiffness: 400, damping: 17`) across all interactive buttons, cards, and modal triggers.
* **Sliding Layout Pills:** Synchronized background pill indicators via `layoutId` across auth mode toggles, user type selectors, and dashboard tabs.
* **Smooth Height Resizing:** Dynamic height transition (`layout` + `<AnimatePresence mode="wait">`) on auth cards and collapsible drawers.
* **Hero Load Sequence:** Staggered mount reveal on [LandingPage.tsx](file:///d:/NexaLink/src/pages/LandingPage.tsx) and [AuthPage.tsx](file:///d:/NexaLink/src/pages/AuthPage.tsx) for badges, headline, subtext, and action buttons.
* **Scroll Reveal:** Reusable `useScrollReveal` hook using `IntersectionObserver` to trigger smooth slide & fade-up entrance animations.
* **GPU-Accelerated Stat Counters:** Reusable `useCountUp` hook powering live metrics on scroll into view.
* **Accessibility:** Full `prefers-reduced-motion` media query compliance across all animations.

---

## 4. Primary Screen Layouts

1. **Public Landing & Auth Pages ([LandingPage.tsx](file:///d:/NexaLink/src/pages/LandingPage.tsx), [AuthPage.tsx](file:///d:/NexaLink/src/pages/AuthPage.tsx)):**
   - Full-bleed hero banner, interactive campus gallery, animated stat counters, 3-pillar architecture cards, quick entry form, accredited department cards grid, and promotional footer.
   - AuthPage features top-aligned hero layout (`items-start`), staggered form fields, and instant demo access chips.

2. **Authenticated App Shell ([App.tsx](file:///d:/NexaLink/src/App.tsx), [Navbar.tsx](file:///d:/NexaLink/src/components/common/Navbar.tsx), [SidebarNav.tsx](file:///d:/NexaLink/src/components/common/SidebarNav.tsx)):**
   - Fixed header navbar with global Command Palette (`Ctrl+K`) trigger and notification drawer.
   - 3-column workspace layout with sticky left sidebar navigation.

3. **Admin Console ([AdminDashboard.tsx](file:///d:/NexaLink/src/pages/admin/AdminDashboard.tsx), [UserManagementTable.tsx](file:///d:/NexaLink/src/components/admin/UserManagementTable.tsx)):**
   - High-density verification queue, reported messages queue, bulk provisional graduation tab, audit logs with text search & category filters, and announcement creation/retraction panel.

