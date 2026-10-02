# Design System & UI Specifications: NexaLink v3 "Open Canvas"

## 1. Aesthetic Direction & Open Canvas Principles

NexaLink v3 transitions the platform from a boxed, card-nested layout to an **Open Canvas** design system. Engineered for institutional precision, visual clarity, and typographic discipline, Open Canvas emphasizes content hierarchy over decorative container borders.

### 1.1 Core Principles
1. **Whitespace as Structure:** Boundaries are created primarily through intentional vertical spacing (16px, 24px, 32px, 48px) rather than nested borders and drop shadows.
2. **1px Hairline Dividers:** When separation is necessary, use subtle 1px hairlines (`#E5E7EB`). Never use heavy borders (`border-2`, `border-4`) or solid dark lines.
3. **Single Container Rule:** A screen may contain at most one elevated or tinted container (`#FAFAFA` FocusPanel) for the primary actionable item. All supporting content lives directly on the white canvas.
4. **No Soft Shadows:** Drop shadows are strictly prohibited on public marketing pages (`shadow-none`) and limited to crisp `shadow-sm` or `shadow-2xs` for in-app floating popovers and dropdowns.
5. **Strict Typographic Hierarchy:**
   - **Display:** Outfit font for hero headlines and page titles (`text-3xl sm:text-4xl font-bold tracking-tight`).
   - **Body & UI:** Inter font for all body text, buttons, inputs, and navigation.
   - **Scoped Uppercase:** Raw `uppercase` is strictly forbidden across buttons, card headers, table titles, and section headers. Uppercase with tracking is permitted **only** inside the `<Eyebrow>` primitive (`font-inter text-[11px] font-semibold tracking-[0.06em] uppercase`).
   - **Monospace Restriction:** `font-mono` is restricted exclusively to machine-generated IDs (PRN, Employee ID, Department code, Record UUIDs, OTP codes). Dates, times, emails, and skill badges must never use monospace.
   - **Tabular Numerics:** All numeric metrics and counters enforce `tabular-nums` for stable column and row alignment.
6. **Strict Contrast Compliance:**
   - Text color must achieve ≥ 4.5:1 contrast against its background. Neutral `#6B7280` or darker is required on `#FFFFFF` and `#FAFAFA`. `#9CA3AF` is strictly banned for text.
   - Input borders must achieve ≥ 3:1 contrast against background surfaces (defaulting to border `#6B7280` or `#D1D5DB` with active focus ring `#0A0A0A`).

---

## 2. Color Palette & Semantic Tokens

### 2.1 Monochromatic Base
- **Canvas Background:** `#FFFFFF` (Pure Institutional White)
- **Subtle Surface:** `#FAFAFA` (Focus panels, active list hover, table headers)
- **Secondary Surface:** `#F3F4F6` (Avatar placeholder backgrounds, read-only badges)
- **Primary Ink:** `#0A0A0A` (Deep Obsidian / Pure Black)
- **Secondary Ink:** `#6B7280` (Muted captions, secondary labels; contrast 4.6:1)
- **Structural Hairlines:** `#E5E7EB` (1px dividers and subtle borders)

### 2.2 Semantic Accents (Strictly Scoped)
Semantic colors are reserved exclusively for contextual status indicators, never for decorative gradients:
- **Verified Emerald:** `#065F46` / `#ECFDF5` (Verified alumnus/student status, approval badges, active availability dot)
- **Actionable Amber:** `#B45309` / `#FEF3C7` (Pending review, clarification requests, waitlist alerts, mentee capacity warning)
- **Governance Rose:** `#991B1B` / `#FEE2E2` (Rejected records, safety violations, destructive actions)
- **Academic Indigo:** `#3730A3` / `#EEF2FF` (Role identification badges in portal)
- **Auth Feedback Exception:** On unauthenticated auth screens (Sign-in, Reset, Registration Wizard), Indigo and Amber are excluded; feedback colors are strictly restricted to Governance Rose for error/lockout messages and Verified Emerald for success confirmations, always paired with icon + text.

### 2.3 Logomark Exception
The central nexus core node (`--nexalink-node: #FD9C03`) is an intrinsic vector asset property of the N-Link mark, strictly confined to the logomark icon and isolated from UI styling.

---

## 3. Standardized Open Canvas Component Primitives

All screens across Student, Alumni, Faculty, and Admin workspaces build upon standardized primitives located in `src/components/ui/`:

### 3.1 `AppShell.tsx`
- Unified geometry wrapper across all authenticated roles.
- Composed of fixed 64px `TopBar`, fixed 240px `SidebarNav` (≥1024px), scrollable main content canvas, and mobile fixed `BottomNav` (<1024px).
- Zero horizontal overflow (`overflow-x: clip; min-width: 0`).

### 3.2 `TopBar.tsx`
- Height: 64px with bottom hairline border (`border-b border-[#E5E7EB]`).
- Brand link navigating directly to dashboard (`setActiveTab('dashboard')`).
- Global search trigger (`⌘K / Ctrl+K`), notification bell trigger, and user profile avatar dropdown.

### 3.3 `SidebarNav.tsx`
- Width: Fixed 240px across all four roles by default.
- **Route-Aware Adaptive Rail:** When the active route is `messaging` on viewports between 1024px and 1279px (`lg:max-xl`), `SidebarNav` automatically collapses into a **72px icon rail** (`w-[72px] xl:w-[240px]`). This eliminates crowded dual-column compression and grants the 340px conversation list and 720px message canvas generous horizontal breathing room.
- Right hairline border (`border-r border-[#E5E7EB]`).
- Active state indicated by a left active bar indicator (3px solid `#0A0A0A`) with subtle `#FAFAFA` background fill.
- System operational status indicator housed cleanly in the sidebar footer.

### 3.4 `PageHeader.tsx`
- Combines optional `<Eyebrow>`, 32–36px Outfit display title, concise subtitle, and right-aligned action buttons without boxing.

### 3.5 `Section.tsx`
- Content grouping primitive with top hairline divider (`border-t border-[#E5E7EB]`), title (18/24px font-semibold), right contextual action, and clean vertical rhythm.

### 3.6 `StatStrip.tsx` & `StatItem.tsx`
- Single horizontal row displaying up to 4 key metrics separated by vertical hairline dividers.
- Values rendered in 28–32px `tabular-nums font-bold text-[#0A0A0A]`.
- Empty state behavior: if all metrics are zero, the strip collapses gracefully into an onboarding checklist.

### 3.7 `ListRow.tsx`
- Unboxed list item representing mentors, jobs, events, advisory requests, and tickets.
- Geometry: Leading icon or avatar, vertical text lockup (title + secondary meta line), trailing status badge or action button.
- Interaction: Smooth `#FAFAFA` hover surface transition with keyboard focus ring.

### 3.8 `FocusPanel.tsx`
- Single unbordered `#FAFAFA` rounded container (12px radius) reserved for the screen's highest-priority item ("Your next step", "Needs attention", or active application status).

### 3.9 `MasterDetail.tsx`
- Split layout for high-density administrative and review queues.
- Left column (360px–420px): dense list of queue items with status, confidence, and SLA indicators.
- Right column (flexible): sticky detail pane showing document preview, comparison table, and action bar.
- Built-in keyboard shortcuts: `J` (next), `K` (previous), `A` (approve), `C` (clarify), `R` (reject).

### 3.10 `RightRail.tsx`
- Quiet secondary column active on viewports ≥1280px (width: 320px).
- Houses secondary context: upcoming deadlines, calendar snapshot, mentee capacity stepper, and department overview.

### 3.11 `UnderlineTabs.tsx`
- Accessible tab switcher with animated bottom underline indicator (`layoutId`), replacing bulky segmented button groups.
- Height: 44px with 1px bottom hairline (`border-b border-[#E5E7EB]`). Supports numeric unread count badges.

### 3.12 `ThreadHeader.tsx`
- Height: strictly locked to 72px (`h-[72px] min-h-[72px] max-h-[72px] px-5 border-b border-[#E5E7EB]`) for mathematically continuous hairline alignment with the conversation list header.
- Avatar with online presence dot rendered **strictly when `contact.online === true`** (clean avatar otherwise).
- Subtitle: 13px/20px leading (`text-[#6B7280]`) with subtle `" · Online"` text suffix when active.
- Right action buttons: standardized 36×36 ghost icon buttons with 8px radius (`w-9 h-9 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A]`).

### 3.13 `Composer` & Attachment Trays
- Container Geometry: centered `max-w-[720px] mx-auto` wrapped in `#F3F4F6` background with 14px radius (`rounded-[14px]`).
- Focus Architecture: Container uses `:focus-within` ring (`focus-within:ring-2 focus-within:ring-[#0A0A0A]`) with zero default border. Inner `<textarea>` is completely transparent (`bg-transparent border-0 outline-none ring-0 shadow-none focus-visible:!outline-none`) with `style={{ outline: 'none' }}` to eliminate nested focus outlines.
- Action Buttons:
  - Send button: 36px circular pill (`w-9 h-9 rounded-full bg-[#0A0A0A] text-white`).
  - Attach & Emoji triggers: 36×36 ghost icon buttons (`w-9 h-9 rounded-lg hover:bg-neutral-200/60`).
- Keyboard Affordance: Desktop-only helper text `"Press Enter to send, Shift + Enter for a new line"` rendered strictly when `isComposerFocused`.

### 3.14 `AttachmentGrid.tsx` & `AttachmentPdfCard.tsx`
- Zero-CLS image layout: calculated aspect-ratio grid (1, 2, 3, or 4 tiles) rendered outside black bubbles with instant Lightbox view.
- PDF cards: standalone documents displaying filename, readable byte size (`1.8 MB`), and direct download/preview triggers.

### 3.15 `ReactionChips.tsx` & `ReactionBar.tsx`
- Micro-pill design (`text-xs bg-[#FAFAFA] border border-[#E5E7EB] rounded-full px-2 py-0.5`).
- 1-reaction-per-user-per-message policy with active black accent indicator.

### 3.16 `CapacityMeter.tsx` & `Switch.tsx`
- `CapacityMeter`: Segmented visual stepper indicating active advisory capacity (e.g., "Mentoring 2 of 5") with immediate decrement/increment controls.
- `Switch`: Accessible toggle control for advisory availability with emerald active state.

---

## 4. Screen-by-Screen Layout Specifications

### 4.1 Auth Screen (`AuthPage.tsx` & `CampusHeroPanel.tsx`)
- **Two-Column Unbordered Layout:**
  - Left column: Editorial list highlighting platform pillars + full-bleed grayscale architectural campus photograph with sentence-case caption `"Campus grounds, Wadala"`.
  - Right column: Clean form canvas with `UnderlineTabs` ("Sign in" / "Create account"), dynamic domain helper text based on role, single-line submit button, and 3-step wizard for new registrations requiring personal recovery email.
- **Dev-Only Persona Popover:** Demo switcher extracted out of the production form into a floating `import.meta.env.DEV` badge.

### 4.2 Student Dashboard (`StudentDashboard.tsx`)
- `PageHeader` with profile completion progress bar.
- `FocusPanel`: "Your next step" guidance recommendation.
- `StatStrip`: Active mentorship requests, smart matches, open opportunities, and registered events.
- Main column: Recommended mentors rendered as `ListRow` items.
- `RightRail`: Upcoming events and deadlines.

### 4.3 Faculty Dashboard (`FacultyDashboard.tsx`)
- `PageHeader`: Avatar, department badge, and employee ID.
- Advisory requests, posted opportunities, and departmental events rendered as unboxed `ListRow` items.
- Rating displayed with monochrome star and "No ratings yet" empty state.
- `RightRail`: Mentee capacity stepper (`CapacityMeter`), availability toggle (`Switch`), and department snapshot.

### 4.4 Alumni Dashboard (`AlumniDashboard.tsx`)
- `PageHeader`: Verified alumnus badge and current company/role.
- `StatStrip`: "Your impact" (mentored students, job referrals, events hosted).
- Pending mentorship requests and posted opportunities rendered as `ListRow` items.
- `RightRail`: Mentee capacity stepper and mentorship availability toggle.

### 4.5 Admin Dashboard & Verification Console (`AdminDashboard.tsx`)
- Unified navigation via single `UnderlineTabs` bar (`Command center`, `Verification queue`, `User roster`, `Opportunity moderation`, `Reported messages`, `Graduation tool`, `Audit logs`).
- `FocusPanel`: "Needs attention" alert box (or calm "All clear" state when queue is empty).
- `StatStrip`: Pending verifications, reported messages, active members, and open opportunities.
- `MasterDetail` Verification Queue:
  - Left: Candidate list with match score, SLA age, and status badge.
  - Right: 60-second signed document previewer, registrar record comparison table, SLA indicators, and keyboard shortcuts (`J/K`, `A`, `C`, `R`).

### 4.6 Verification Pending Gate (`VerificationPendingPage.tsx`)
- Centered `max-w-2xl` Open Canvas column.
- 1-business-day review ETA notice ("Usually reviewed within 1 business day").
- "Replace document" button available while account is in Pending state.
- 3-step connected horizontal timeline (Submitted → In review → Decision).
- Supabase Realtime auto-advance with `AnimatedCheckIcon` upon approval.

### 4.7 Enterprise Messenger Workspace (`MessagingPage.tsx`)
- **Dual-Pane Geometry & Hairline Alignment:**
  - Left Conversation Pane: strictly 340px width (`w-full md:w-[340px] border-r border-[#E5E7EB]`).
  - Pane Header: strictly locked to 72px (`h-[72px] min-h-[72px] max-h-[72px] px-5 border-b border-[#E5E7EB]`), aligning perfectly with the Thread Header.
  - Tabs: 44px minimal underline tabs (`All`, `Unread`, `Starred`) with animated indicator.
  - Search: 40px height, 8px radius (`rounded-lg`), `#F3F4F6` background, borderless.
  - Rows: 72px height, 44px avatars, online-only green presence dot, and selected state featuring `#F3F4F6` fill with 2px left black bar (`border-l-2 border-[#0A0A0A]`). No horizontal row divider lines.
- **Thread Reading Canvas:**
  - Centered column: `max-w-[720px] mx-auto w-full px-6 py-6`.
  - Max bubble width: strictly restricted to `max-w-[70%]` (max 504px, guaranteeing ≤ 80 characters per line for optimal reading ergonomics).
  - 5-Minute Sender Clustering: consecutive messages from the same sender within 5 minutes are grouped with `mt-0.5` (2px); inter-group gap is `mt-4` (16px).
  - Bubble Radii: `rounded-[18px]` standard. Only the trailing bubble in a cluster receives the 6px tail corner (`rounded-br-[6px]` for sent, `rounded-bl-[6px]` for received).
  - Metadata Line: rendered strictly once per group below the last bubble (`isGroupEnd`). Formatted as `11px #6B7280`.
  - Delivery Status: status word + ticks (`2:37 am · Sent ✓` / `Read ✓✓`) appear **only on the very last sent message of the thread**.
  - Soft-Delete Tombstone: quiet, muted italic text with trash icon (no background box, no borders, no ticks).
  - Edited Indicator: relocated from inside bubble to metadata line (`Edited · 12:50 am`).
  - DEV QA Fixture: 200-message benchmark toggle button for instant virtualized scroll testing.

---

## 5. Responsive Strategy: 4 Fluid Tiers

| Tier | Range | Target Devices | Layout Behavior |
| :--- | :--- | :--- | :--- |
| **Phone** | `<640px` | iPhone SE, iPhone 14/15/16, Pixel, Galaxy | Single-column canvas, fixed `BottomNav`, bottom sheet modals, full-width buttons. In Messages: single-pane thread view with back arrow to conversation list. |
| **Tablet** | `640–1023px` | iPad, iPad Mini, Galaxy Tab | 2-column cards, modal dialogs, fixed `BottomNav`, top bar search. In Messages: dual-column layout with 340px list and flexible thread. |
| **Compact Desktop** | `1024–1279px` | iPad Pro landscape, MacBook Air 13" | Fixed 240px `SidebarNav` (default). **Route Exception:** On `/messages`, `SidebarNav` auto-collapses to a **72px icon rail** (`w-[72px] xl:w-[240px]`), allocating full space to the 340px list and 720px thread. |
| **Full Desktop** | `≥1280px` | iMac, 1080p/4K monitors, MacBook Pro 16" | Fixed 240px `SidebarNav`, main content canvas + 320px `RightRail`, split `MasterDetail` queues. In Messages: 240px sidebar + 340px list + 720px centered thread canvas. |

---

## 6. Accessibility & Motion Standards

1. **Axe-Core Compliance:** Zero serious or critical violations across all views.
2. **Keyboard Navigation:** Complete tab-order coverage, visible `:focus-visible` rings (`ring-2 ring-[#0A0A0A] ring-offset-2`), and `Esc` dismissal for sheets/modals. Composite inputs (such as the message composer) maintain a single focus ring on the outer container.
3. **Reduced Motion:** All Framer Motion variants respect `useReducedMotion()`. When enabled, transforms are reduced to instant opacity transitions.
4. **Touch Targets:** Strict minimum 44×44px interactive bounding box on mobile devices.
