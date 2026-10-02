# 📋 NexaLink: To-Do Checklist for Next Session
> **Saved on:** October 3, 2026 (Before Break)  
> **Branch:** `fix/sprint-1-p0-security`  
> **Status:** Sprint 1 P0 Security fixes pushed to GitHub. Ready for Full-Stack Persistence & Data Flow Sprint.

---

## 🎯 The Big Goal: "Make Everything Save & Persist Across Page Refresh"

Right now, several features work in the browser, but revert or disappear as soon as you press **Refresh (F5)** because they are saving to temporary React memory instead of persisting into Supabase database tables and Storage buckets.

Here is the exact checklist to work through together when you get back:

---

### 1. 💬 Chat Messages Disappearing on Refresh
- [ ] **Problem:** When you send a peer message in NexaChats and refresh the page, the message is gone.
- [ ] **Root Cause:** Frontend needs to query `public.chat_messages` / `get_inbox()` on initial component load for the active conversation, instead of falling back to empty local state.
- [ ] **Fix & Test:**
  - Verify that `send_message_v2` inserts rows into `chat_messages`.
  - Ensure `MessagingPage` queries Supabase for past messages when opening a conversation.
  - Test: Send a message, refresh browser, confirm message is still there with correct timestamp and delivery status.

---

### 2. 📄 Registration Proof Document Upload & Admin Verification Viewer
- [ ] **Problem:** During registration, when a student or alumnus uploads their ID card / degree document, it doesn't show up or open in the Administrator verification queue (`AdminDashboard`).
- [ ] **Root Cause:**
  - File upload might be failing silently, or the path in `users.proof_document_url` is not stored properly.
  - Storage bucket `proof-documents` is private, requiring a 60-second signed URL (`supabase.storage.from('proof-documents').createSignedUrl(...)`) which the admin modal might be missing.
- [ ] **Fix & Test:**
  - Verify file upload successfully saves to the `proof-documents` Supabase bucket.
  - Ensure the admin verification table fetches the document URL and generates a working signed preview link/modal.
  - Test: Sign up with a test ID image -> Log in as Admin -> Open verification modal -> Verify document image displays properly and can be approved/rejected.

---

### 3. 📅 Campus Events Persistence
- [ ] **Problem:** Creating a new event in `EventComposerPage` disappears after page refresh.
- [ ] **Fix & Test:**
  - Wire up event creation form to `supabase.from('events').insert(...)`.
  - Ensure `EventsPage` loads live rows from `events` table on mount.
  - Test RSVP action: Confirm RSVP counter increases and persists across refresh.

---

### 4. 💼 Opportunities & Job Referrals Persistence
- [ ] **Problem:** Posting a job/internship referral doesn't persist across refresh.
- [ ] **Fix & Test:**
  - Wire up opportunity posting to `supabase.from('job_listings').insert(...)`.
  - Ensure `JobPortalPage` and `OpportunitiesPage` fetch live listings.
  - Test applying: Ensure student applications are recorded in `opportunity_applications`.

---

### 5. 🤝 Mentorship Requests & Acceptance Lifecycle
- [ ] **Problem:** Sending a guidance request to a mentor, or an alumnus accepting a mentee, is not saved to the database.
- [ ] **Fix & Test:**
  - Wire up "Request Mentorship" button to `supabase.from('mentorship_requests').insert(...)`.
  - Wire up "Accept / Decline" buttons to update the status in the database.
  - Verify that accepted mentorships persist and update the mentor's open slot counter.

---

### 6. 🔐 Auth, OTP & Reset Password Flow
- [ ] Verify standard login works smoothly with **Email + Password** (no rate limits).
- [ ] Verify "Forgot Password" sends an OTP or reset link cleanly.
- [ ] Verify unverified accounts are properly stopped at the `VerificationPendingPage` until the admin approves them.

---

## 🚀 How We Will Start When You Come Back:
1. Open this file: `TODO_NEXT_SESSION.md`.
2. Pick **Item 1 (Chat Messages Persistence)** and **Item 2 (Proof Document in Admin Page)** first.
3. Test each one together in the browser so you can visually see them saving and surviving page refresh!

*Take your break! Everything is committed, secured, and pushed to GitHub.*
