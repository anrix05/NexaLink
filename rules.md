# System Rules & Coding Guidelines: NexaLink

## 1. Design & UI Integrity

1. **Monochromatic Palette:** Strict adherence to `#0A0A0A` (primary elements/text), `#FFFFFF` (canvas background), `#6B7280` (secondary/muted text), and `#E5E7EB` (1px hairline borders).
2. **Single Reserved Accent:** Single reserved Amber (`#B45309`) accent for pending actions, missing data alerts, unverified notices, and proof clarification callouts. Do not introduce red/blue/purple soft tints unless explicitly specified.
3. **No Soft Drop Shadows:** Never use elevated fuzzy drop shadows (`shadow-lg`, `shadow-xl`). Maintain crisp 1px borders and sharp backdrops (`backdrop-blur-md`).
4. **Motion & Tactile Physics:** Use Framer Motion with standard spring physics (`stiffness: 400, damping: 17`, `scale: 1.03` hover, `scale: 0.95` tap) for buttons, cards, and modal triggers.
5. **Truth in UI:** Never hardcode fabricated/placeholder statistics in dashboard cards, trajectory graphs, or benchmark lines. All UI metrics must be computed dynamically from genuine `DataContext` state.
6. **Motion Accessibility:** All animations (Framer Motion transitions, scroll reveals, count-up counters) MUST respect `prefers-reduced-motion` media queries.

---

## 2. Branding & Naming Contracts

1. **Platform Name:** The platform and application title is **NexaLink**.
2. **Messaging Feature:** The peer-to-peer messaging workspace is **NexaChats**.
3. **Logomark:** Use the geometric "N" Monogram component (`<LogoMark />`) for all branding elements.

---

## 3. Data Integrity & Verification Rules

1. **Alumni Login Policy:** College-issued emails (`@student.vit.edu.in`) deactivate after graduation. Alumni login MUST authenticate against `personalEmail` (e.g. `@gmail.com`), while Student and Faculty authenticate against active `@vit.edu.in` domain emails.
2. **Provisional Alumni Flag:** Alumni created via bulk/provisional graduation without personal email addresses must have `personalEmail: null` and display *"Personal email not on file — contact this alumnus to complete their profile"* in Admin user management views.
3. **Proof Document Uploads:** Proof documents use `URL.createObjectURL(file)` object URLs for local session previews (`verificationDocumentUrl` / `verificationDocumentName`) with code documentation noting Phase 4 backend file storage transition.
4. **Clarification Resubmission Flow:** User resubmitting proof via clarification banner updates document references, clears `clarificationRequested`, resets `verificationStatus` to `'Pending Verification'`, and logs `VERIFICATION_DOCUMENT_RESUBMITTED` to audit logs.
5. **Role Transition:** Student-to-alumni role transition must preserve the original user ID, message threads, and mentorship history without creating duplicate accounts.

---

## 4. Security & Administrative Controls

1. **Role Isolation (`RoleGate.tsx`):** All workspace views and navigation items must enforce strict role checks.
2. **Command Palette Role-Scoping (`CommandPalette.tsx`):** Navigation items, quick actions, and search results in the command palette must be strictly filtered against the active user's role.
3. **Messaging Privacy Guard:** Admins cannot view private user-to-user chat content unless flagged for moderation via `reportMessage(messageId)`.
4. **Admin Handoff:** Single-admin-vouches-for-new-admin invitation system (`AdminInvite`). Active admin count cannot fall below 1.
5. **Audit Logging:** Every administrative action (approvals, rejections, clarification requests, invites, role transitions, bulk graduations, announcement retractions) MUST trigger `addAuditLog`.

