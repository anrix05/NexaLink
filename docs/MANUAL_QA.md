# NexaLink — Manual QA Verification Guide

This document outlines the standard end-to-end verification procedures for the NexaLink platform.

---

## v2.7.0 Intro Animation & Motion Checklist

| # | Test Scenario | Steps to Execute | Expected Outcome | Status |
|---|---|---|---|---|
| **1** | **Cold Boot on `/` (New Tab)** | Open a new browser tab or private window and navigate directly to `http://localhost:5173/`. | The obsidian `#0A0A0A` intro stage renders instantly with no initial content flash. 4 geometric slices assemble from alternating offsets into the N monogram. The live-text "NexaLink" wordmark fades up. The orange central node ignites with a spring pop and single pulse ring. The mark flies smoothly (FLIP) into the navbar logo. Landing hero elements and count-up stats reveal gracefully. | [ ] |
| **2** | **Refresh & In-App Navigation** | Press `F5` / `Cmd+R` on the landing page, then navigate across tabs (e.g. Directory, Opportunities, Return to Dashboard). | The intro **does not replay** on page refresh. Client-side navigation and clicking the NexaLink brand logo never re-trigger the intro. | [ ] |
| **3** | **Deep Link First Load** | In a brand-new tab session, navigate directly to a deep route (e.g. `http://localhost:5173/?tab=privacy` or `/reset-password`). | The intro is **skipped entirely**. The target page renders immediately. Subsequent navigation back to `/` does not trigger the intro because the session is already marked seen. | [ ] |
| **4** | **Supabase Auth Callback Safety** | Open an email confirmation or password recovery URL containing `#access_token=...` or `type=recovery`. | The intro is automatically bypassed. The authentication token is processed without delay, taking the user directly to the password reset / authenticated view. | [ ] |
| **5** | **Manual Replay Triggers** | 1. Navigate to `http://localhost:5173/?intro=1`.<br>2. Click **"REPLAY INTRO"** in the public footer.<br>3. Press `Ctrl+K` and select **"Replay Intro Animation"**. | In all three cases, the intro replays smoothly from start to finish. | [ ] |
| **6** | **Keyboard & Touch Skip Interaction** | Trigger the intro, then press `Esc`, any keyboard key, or tap/click anywhere on the screen. | The intro fades out immediately with a fast 250ms transition. The `ESC / TAP TO SKIP` hint appears after 600ms if not skipped earlier. Body scroll is immediately restored, and focus is not trapped (`inert` attribute removed from `#root`). | [ ] |
| **7** | **Accessibility: Reduced Motion** | Enable OS-level "Reduce Motion" in system settings (or Chrome DevTools: *Rendering > Emulate CSS prefers-reduced-motion*). | The intro is completely skipped. The page mounts immediately with static/accessible layouts. | [ ] |
| **8** | **Hardware & Low-Tier Governor** | In DevTools *Network* tab, enable **Data Saver** (`Save-Data: on`) or emulate a 2G network. | The intro is automatically bypassed on `low` tier devices to conserve bandwidth and CPU resources. | [ ] |
| **9** | **JavaScript Disabled & CPU Throttle Failsafe** | 1. Disable JavaScript in DevTools and refresh.<br>2. Throttle CPU 6x in DevTools *Performance* tab. | 1. With JS disabled, the `<noscript>` style prevents the black overlay from mounting; page content remains visible.<br>2. With 6x CPU throttling, the CSS `@keyframes nexalinkIntroFailsafe` guarantees the overlay auto-hides after 4 seconds. | [ ] |
| **10** | **Mobile Responsiveness (320px, 375px, 430px)** | In DevTools responsive mode, test at widths 320px, 375px, and 430px. | The mark height scales appropriately to `min(40vw, 160px)`, background dots are disabled, hold durations are shortened to ~2.4s total, and the mark lands accurately onto the mobile header logo without horizontal scroll drift. | [ ] |
| **11** | **Color Handoff Verification** | Observe the mark closely during the exit flight phase (2200–3000ms). | The mark transitions from white to the target header color during mid-flight (at overlay alpha ~0.5), remaining clearly visible against the mid-tone background. The central orange node retains its `#FD9C03` accent throughout. | [ ] |
| **12** | **Cumulative Layout Shift (CLS = 0)** | Run a Google Lighthouse Performance audit on `/`. | Cumulative Layout Shift (CLS) remains **0.000**. The intro overlay does not displace any DOM layout containers before, during, or after playback. | [ ] |

---

## v2.8 Student Outreach & Discovery QA Checklist

### 1. Functional Verification
- [ ] **Student:** Master toggle starts OFF by default. Turn it on and choose fields. The student appears in an alumnus's Discover list with initials only and no phone or email. Turn it off and the student disappears immediately.
- [ ] **Student Invitations:** An invitation shows in Find a Mentor → Invitations with the reason text fully rendered. Accept opens a chat and the sender can then open the resume. Decline blocks re-invites for 60 days. Block and report stops all future invitations and records a moderation block.
- [ ] **Profile Views Transparency:** "Who viewed my profile (last 30 days)" lists viewers once per day per viewer.
- [ ] **Alumni:** Sees only opted-in students. Cannot send an invitation without a reason of 20 to 200 characters. The counter shows N of 5 left, and the sixth attempt in 7 days is refused by the server (enforced via database RPC). Cannot invite a student who blocked them. Can withdraw a pending invitation.
- [ ] **Suggested Students Card:** Shows reasons ("Shared skills: React, Node. Same department"), not percentages, and sits as the last card in the main column (below "Requests waiting for your response").
- [ ] **Faculty:** Sees all verified students of their own department (with PRN and photo) and only opted-in students from other departments.
- [ ] **Privacy Boundary:** As an alumnus, query the student tables directly through the Supabase client; access is denied. A signed resume URL fails for a sender without an accepted invitation and expires after ~10 minutes.
- [ ] **Empty States:** When no students are opted in, shows "No students are open to outreach yet. Check back as more students join." When filters return no results, shows "No students match these filters." with a "Reset filters" button. Never shows the filter message when no filter is applied.
- [ ] **Regression:** Sign in, Register, NexaChats, Alumni Directory "Message" button, opportunities, admin console, and all existing navigation look and behave exactly as before.

### 2. Responsive Device Matrix Verification
Test each screen: Field Privacy card, Invitations tab, Discover students tab, Suggested students card, Invite sheet, Filter sheet.
- [ ] **Portrait Tiers:**
  - 320×568 (Tier 1): 1 column, full-width buttons, filters behind Filter button sheet, horizontal tab scroll, clamped padding, no clipping with 200% zoom.
  - 375×667 (Tier 2): 1 column, stable layout, 44px touch targets.
  - 390×844 & 430×932 (Tier 3): Suggested students is a horizontal snap row with peek hint (`min(82vw, 300px)`).
  - 540×960 & 640×900 (Tiers 4-5): Grid flows to 2 columns at ≥640px, search + selects wrap smoothly, Invite sheet remains bottom sheet capped at 560px and centered.
  - 768×1024 & 834×1194 (Tier 6): 2-column grid, invitation rows show inline actions on right, BottomNav remains active.
- [ ] **1023px vs 1024px Boundary (Tier 7):** Sidebar appears at 1024px; content width drops sharply and auto-fill grid reflows without clipped cards; sheets turn into centered dialogs (max-w-[480px]).
- [ ] **Desktop Tiers (Tiers 8-10):**
  - 1025–1279px: Filter row inline, grid 2 columns.
  - 1280–1439px: Grid 2-3 columns by container width.
  - 1440–1920px+: Content stays inside existing max-width container; maximum 3 columns.
- [ ] **Landscape Phones (667×375 & 844×390):** Sheet takes full viewport height with internal scroll and sticky action bar.
- [ ] **200% Browser Zoom:** Tested at 320px with 200% text scaling; nothing clips or overlaps.
- [ ] **No Sideways Page Scroll:** Body does not scroll horizontally at any viewport width; only tab row and suggested students snap row scroll with `overflow-x: auto`.
- [ ] **BottomNav Clearance:** Last card and "Load more" button have sufficient bottom padding and are never obscured behind fixed `BottomNav`.
- [ ] **iOS Safari Inputs:** Focusing reason textarea does not trigger browser auto-zoom (16px font below 1024px); on-screen keyboard does not cover textarea or "Send invitation" button.
- [ ] **Sheet Ergonomics:** Swipe down, scrim tap, `Esc` key, and visible close button all dismiss sheets; background page is scroll-locked; notch/home-indicator safe areas respected.
- [ ] **Performance & CLS:** Skeleton-to-content swap causes zero layout shift (Lighthouse mobile CLS = 0).

---

## v2.9.1 Demo Data Completion & Dual-Mode Guard Checklist

- [ ] **Diagnostic Self-Check Badge:** Open Dev login popover in the bottom-right corner. Confirm a green **"Seed OK"** badge appears with `[Seed Check: ALL PASS]` in browser console.
- [ ] **Production Build Isolation Guard:** Run `npm run build`. Confirm Vite production bundle compiles with zero TypeScript errors and `scripts/assert-no-mock.mjs` exits with code 0 (zero mock markers in `dist/`).
- [ ] **Dual-Mode Dev Fallback:** When running locally with Supabase credentials present in `.env` but with empty database tables, verify that `DataContext` automatically falls back to dev mock data rather than wiping lists to `[]`.
- [ ] **Student Persona (Aanya Patel):**
  - [ ] **Home Dashboard:**
    - Profile completion reads 100% with verified badge.
    - Mentorship Hub tile shows non-zero count (3 active/pending connections).
    - Registered Events tile shows 3 upcoming events.
    - Matched Opportunities tile shows high-relevance listings (>=60% skill match).
    - Campus Announcements widget displays 8 notices (including 2 pinned and urgent lab update).
  - [ ] **Directory (`/directory`):** 50+ alumni and faculty profiles render. Filters for department (CMPN), company (Google), and "Accepting Mentees" toggle return active rows.
  - [ ] **Opportunities (`/opportunities`):**
    - 32 total listings across 8 distinct cities (Bengaluru, Mumbai, Pune, Hyderabad, Remote, etc.).
    - Filter chips (Full-time, Internship, Referral, Research) all return active listings.
    - Saved tab shows exactly 4 active listings with zero dangling/empty cards.
    - Applications tab shows 4 applications across statuses (submitted, viewed, shortlisted, not_selected).
  - [ ] **Events (`/events`):**
    - 9 upcoming events spread across this week and month.
    - Categories match exact sentence-case (`Alumni meet`, `Guest lecture`, `Career workshop`, `Hackathon`, `Technical symposium`).
    - At least 1 event is fully booked with waitlist enabled ("Google Cloud Distributed Systems Masterclass").
    - Aanya has registered status on 3 events.
    - Past events tab displays 5 completed events.
  - [ ] **Mentorship (`/mentorship`):**
    - My Requests shows 3 requests (1 pending with Dr. Sangale, 1 accepted with Rushabh Sanghavi, 1 completed with review).
  - [ ] **Messages (`/messages`):**
    - 16 conversation threads visible in contact list (10 alumni, 5 faculty, 1 admin).
    - 6 unread badges and 3 starred pinned threads.
    - 32-message thread with Rushabh Sanghavi displays code snippet formatting and PDF attachment card (`Aanya_Patel_Resume_2026.pdf`).
- [ ] **Alumni Persona (Rushabh Sanghavi):**
  - [ ] Mentee capacity shows 3 of 5 active mentees.
  - [ ] Advisory rating tile shows 4.6 / 5.0 with 5 real reviews.
  - [ ] 4 pending student mentorship requests are actionable (Accept / Decline updates count).
  - [ ] "Your postings" in Opportunities shows 3 listings: Google SDE-1 (6 applicants), Stripe Senior Backend (3 applicants), Datadog Intern (2 applicants). Inspecting applicants displays student match scores and notes.
  - [ ] Rushabh shows registered status for 2 campus events.
- [ ] **Faculty Persona (Dr. Ravindra Sangale):**
  - [ ] Head of Department (CMPN) badge displayed.
  - [ ] Department roster counts match directory counts.
  - [ ] 4 pending student academic collaboration asks.
  - [ ] Posted research fellowship opening ("Distributed Systems & Edge Computing Fellowship").
- [ ] **Admin Persona (Dr. Sunita Rawat):**
  - [ ] Overview KPI widgets and department charts (CMPN, INFT, EXTC, EXCS, BIOM) are fully populated.
  - [ ] Verification Queue shows 10 pending verifications with placeholder SVG watermarked credentials; 2 marked "Needs Clarification".
  - [ ] Message Moderation shows 4 reported messages flagged for policy review.
  - [ ] Opportunity Moderation shows 2 pending postings awaiting approval.
  - [ ] Graduation Transition lists 14 candidates (4 flagged with missing personal email).
  - [ ] Audit Log displays 72 tamper-evident rows spanning 30 days. Clicking "Audit log" tab in Admin Console preserves/loads audit records.
  - [ ] Reports & Accreditation exports NAAC Metric 5.4.1 and NIRF data with authentic populated rows.
- [ ] **Session Mutation & Reset:**
  - Send a chat message, RSVP to an event, or approve a verification.
  - Click **"Reset demo data"** in the Dev login popover.
  - Verify that state returns cleanly to initial deterministic seed and the green **"Seed OK"** badge remains active.


