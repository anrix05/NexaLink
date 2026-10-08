# NexaLink — Live Evaluator Demo Script (v2.9.1)

> **Target Duration:** 7 to 10 Minutes  
> **Audience:** Academic Evaluators, Head of Department, Institutional Review Board  
> **Prerequisites:** Run `npm run dev` in local terminal. Open `http://localhost:5173`.  
> **Rescue Tip:** If any widget or session state was modified in previous runs, click **"Reset demo data"** from the bottom-right **Dev login** popover to restore the fresh deterministic seed immediately. Confirm the green **"Seed OK"** badge appears.

---

## 1. Opening Narrative: The Problem (60 Seconds)

**Speaker Script:**
> *"Good morning. Higher educational institutions like Vidyalankar Institute of Technology face a critical structural gap after graduation: alumni contact data decays rapidly, student outreach across corporate mentors is uncoordinated, and institutional governance data for NAAC Metric 5.4.1 and NIRF requires hundreds of hours of manual reconciliation across scattered spreadsheets.*
>
> *NexaLink solves this by providing a unified institutional portal with role-based access for Students, Alumni, Faculty, and Administrators. Today, I'll walk you through our four primary personas and demonstrate how NexaLink streamlines mentorship matching, career opportunities, department governance, and automated accreditation exports — with complete, realistic data populated across every screen."*

---

## 2. Persona 1: Final-Year Student — Aanya Patel (2.5 Minutes)

### Step 1: Login
- Open the bottom-right **Dev login** menu.
- Verify the status indicator displays **"Seed OK"**.
- Click **Aanya Patel** (`student` chip).

### Step 2: Student Home (`/` or Dashboard)
- **What to show:**
  - Notice the **Profile Completion (100%)** badge and verified student status.
  - **Mentorship Hub Tile:** Shows **3** active guidance connections.
  - **Upcoming Registered Events Tile:** Shows **3** registered events (e.g., Google Cloud Distributed Systems Masterclass, US Tech Visa Seminar).
  - **Opportunities & Referrals Tile:** Surfaces high-match openings curated for CMPN (Go, Distributed Systems, React).
  - **Campus Announcements & Notices:** 8 notices visible to students (including 2 pinned notices and urgent lab schedule updates).
- **Talking Point:** *"NexaLink uses a heuristic match score combining department (CMPN), target skills (Go, Distributed Systems, React), and career goals to surface high-relevance alumni and openings right on the student homepage."*

### Step 3: Alumni & Faculty Directory (`/directory`)
- **Navigate to:** **Directory** in the top navigation.
- **Actions:**
  - In the search bar, search for `Google` or filter by department `CMPN`.
  - Toggle **"Accepting Mentees"** to filter mentors with available capacity.
  - Point out that there are 50+ rich profiles with genuine graduation years, roles, and skills.
- **Talking Point:** *"The directory provides verified institutional profiles with strict contact masking. Students can see company and academic credentials without exposing private personal phone numbers or unvetted email addresses."*

### Step 4: Opportunities (`/opportunities`)
- **Navigate to:** **Opportunities** in the top navigation.
- **Actions:**
  - Demonstrate taxonomy filter chips: **All**, **Full-time**, **Internship**, **Referral**, and **Research**.
  - Click the **Referral** chip to show curated employee referral opportunities posted directly by alumni.
  - Filter by City (e.g. `Bengaluru`, `Mumbai`, `Remote`, `San Francisco`).
  - Open **Saved Opportunities** tab: point out Aanya's 4 saved listings (Google SDE-1, Microsoft Azure Intern, Dr. Sangale's Research Fellowship, Closing Soon Senior Backend) with zero broken or dangling references.
  - Open **My Applications** tab: show 4 tracked applications across `submitted`, `viewed`, `shortlisted`, and `not_selected` statuses with transparent timeline tracking.
- **Talking Point:** *"Opportunities span direct alumni job openings, departmental research fellowships, and verified employee referrals. Students can track application review stages transparently."*

### Step 5: Campus Events (`/events`)
- **Navigate to:** **Events** in the top navigation.
- **Actions:**
  - Highlight the 9 upcoming events spread across this week and this month.
  - Filter by category chips (Sentence-case categories: *Alumni meet*, *Guest lecture*, *Career workshop*, *Hackathon*, *Technical symposium*).
  - Highlight the *Google Cloud Distributed Systems Masterclass*: note that it is **fully booked with an active waitlist**.
  - Show the **Registered** badge on Aanya's 3 attending events.
  - Switch to **Past Events** tab to show 5 completed events with historical attendee counts.
- **Talking Point:** *"Campus events integrate automated capacity caps, waitlists, and attendance logging, giving department heads instant visibility into co-curricular student engagement."*

### Step 6: Mentorship Hub (`/mentorship`)
- **Navigate to:** **Mentorship** tab.
- **Actions:**
  - Show the **"My Requests"** tab with Aanya's 3 active requests:
    1. *Pending review* with Dr. Ravindra Sangale (Distributed Systems Research Guidance).
    2. *Accepted & active* with Rushabh Sanghavi (SDE-1 System Design & Referral Strategy).
    3. *Completed* session with Dr. Snehal More with student rating and feedback submitted.
- **Talking Point:** *"Mentorship is purpose-driven rather than casual messaging. Requests require structured intent: Placement Preparation, Research Collaboration, or Higher Education."*

### Step 7: Messages (`/messages`)
- **Navigate to:** **Messages** in the top navigation.
- **Actions:**
  - Show the populated inbox with **16 conversations** (10 alumni, 5 faculty, 1 admin).
  - Highlight the **6 unread thread badges** and **3 starred conversations** pinned to the top.
  - Open the thread with **Rushabh Sanghavi**: scroll through the 32-message technical discussion demonstrating code snippet rendering and PDF attachment preview cards (`Aanya_Patel_Resume_2026.pdf`).
- **Talking Point:** *"NexaLink enforces role isolation rules to protect student safety while enabling rich technical discussions with code highlighting and verified attachment scans."*

---

## 3. Persona 2: Silicon Valley Alumnus — Rushabh Sanghavi (2 Minutes)

### Step 1: Switch Persona
- Open bottom-right **Dev login** popover.
- Click **Rushabh Sanghavi** (`alumni` chip).

### Step 2: Alumni Home & Mentorship Dashboard
- **What to show:**
  - **Mentee Capacity:** Shows **3 of 5** active mentees.
  - **Advisory Rating:** Shows **4.6 / 5.0** derived from 5 genuine student reviews.
  - **Pending Guidance Asks:** 4 actionable student requests waiting in the queue.
- **Talking Point:** *"Alumni control their commitment boundaries with adjustable mentee caps. They never get overwhelmed by open-ended spam."*

### Step 3: Actioning a Mentorship Ask
- **Actions:**
  - Click on a pending student request card from the queue.
  - Click **Accept** or **Decline** (with optional soft-decline guidance).
  - Observe the counter update in real-time.
- **Talking Point:** *"Every mentorship action is logged with structured scheduling, providing accountability for institutional co-curricular records."*

### Step 4: Posted Opportunities & Applicant Review
- **Actions:**
  - Navigate to **Opportunities** → **Your postings** (or Manage Postings).
  - Highlight the *Google Cloud Infrastructure SDE-1* listing showing **6 applicants**.
  - Highlight the *Stripe Senior Backend Engineer* listing showing **3 applicants**.
  - Click into the applicants list to inspect applicant match scores, candidate resumes, and student notes.
- **Talking Point:** *"Alumni can bring verified job and internship openings directly to their alma mater with zero recruitment agency overhead."*

---

## 4. Persona 3: Academic Department Head — Dr. Ravindra Sangale (1.5 Minutes)

### Step 1: Switch Persona
- Open **Dev login** popover.
- Click **Dr. Ravindra Sangale** (`faculty` chip).

### Step 2: Faculty Dashboard & Department Metrics
- **What to show:**
  - Head of Department (CMPN) badge.
  - Department roster counts: CMPN current students and verified alumni derived directly from the system records.
  - 4 pending academic collaboration asks from undergraduate researchers.
- **Talking Point:** *"Faculty leaders gain instant visibility into departmental student research trends and alumni mentorship density without chasing manual faculty surveys."*

### Step 3: Research Collaboration & Department Postings
- **Actions:**
  - View the posted *Distributed Systems & Edge Computing Fellowship* listed under faculty opportunities.
  - Show the upcoming departmental research seminar hosted by Dr. Sangale in the Events schedule.
- **Talking Point:** *"Academic projects bridge into funded undergraduate research grants with structured mentor assignments."*

---

## 5. Persona 4: Institutional Administrator — Dr. Sunita Rawat (2 Minutes)

### Step 1: Switch Persona
- Open **Dev login** popover.
- Click **Admin Console** / **Dr. Sunita Rawat** (`admin` chip).

### Step 2: Institutional Analytics & Governance (`/admin`)
- **Navigate to:** **Overview** in the sidebar.
- **What to show:**
  - Populated conversion rate widgets, queue status gauges, department distribution across all 5 engineering departments (CMPN, INFT, EXTC, EXCS, BIOM), and Top Alumni Employers.
- **Talking Point:** *"Every single chart and metric in this dashboard derives dynamically from system records, not static mocked numbers."*

### Step 3: Verification Queue (`verification-queue`)
- **Navigate to:** **Verification** in the sidebar.
- **Actions:**
  - Show the 10 pending student/alumni verification records.
  - Open a verification item: click the proof document preview to show the generated placeholder document with official watermarking.
  - Highlight the 2 records flagged with **"Needs Clarification"**.
  - Approve or reject a candidate and observe immediate audit logging.
- **Talking Point:** *"NexaLink eliminates manual registrar queues by staging student ID cards and alumni degree pass-certificates with audit logs for approve, reject, or clarification requests."*

### Step 4: Moderation & Governance (`moderation`)
- **Navigate to:** **Moderation** in the sidebar.
- **Actions:**
  - Show the **4 reported messages** flagged for policy review with reporter IDs, reported content, and moderation actions.
  - Show the **2 pending opportunity postings** staged for institutional approval before going live to students.
- **Talking Point:** *"Student safety is paramount. All flagged messages and external postings require administrative clearance before visibility."*

### Step 5: Graduation Transition & Audit Logs (`audit-log`)
- **Navigate to:** **Audit log** in the sidebar.
- **Actions:**
  - Show the 72 tamper-evident audit records spanning 30 days of platform activity (user approvals, opportunity postings, message reports, role changes).
- **Talking Point:** *"Every governance action is cryptographically tracked in tamper-evident logs."*

### Step 6: Automated NAAC Metric 5.4.1 & NIRF Export (`reports`)
- **Navigate to:** **Reports & accreditation** in the sidebar.
- **Actions:**
  - Select **NAAC Metric 5.4.1** or **NIRF Student Progression**.
  - Click **Download Excel (.xlsx)** or **Download PDF**.
- **Talking Point:** *"For accreditation audits, generating Metric 5.4.1 reports historically took weeks of manual labor. In NexaLink, tamper-evident Excel ledgers with attendance headcounts and verifiable certificate IDs download in seconds."*

---

## 6. Extra Dev Personas & Resilience Demonstration (1 Minute)

### Extra Scenarios (Demonstrating Edge States):
1. **New Student Account (Karan Mehta):**
   - Click **Dev login** → **Karan Mehta (Student: new account)**.
   - Shows honest clean empty states, onboarding prompts, and profile completion banner.
2. **Pending Verification Student (Aarav Deshpande):**
   - Click **Dev login** → **Aarav Deshpande (Pending verification)**.
   - Lands directly on the **Verification Pending** stage with the multi-step verification status stepper.
3. **Rejected Student (Pooja Kulkarni):**
   - Click **Dev login** → **Pooja Kulkarni (Rejected state)**.
   - Shows the rejection alert explaining why the document was unreadable and the re-upload pathway.

---

## 7. Closing Security & Architecture Pitch (60 Seconds)

**Speaker Script:**
> *"To conclude, I'd like to highlight our separation architecture. Everything you saw today runs entirely on our deterministic, in-memory local developer fixtures with zero mock data touching any network or production database.
>
> When NexaLink is built for production with `npm run build`, our automated build guard asserts that every mock persona, mock message, and developer chip is tree-shaken and completely absent from `dist/`. Real deployments connect strictly to Supabase with Row-Level Security, Argon2/Bcrypt credential hashing, and encrypted document storage.
>
> Thank you, and I look forward to your questions."*
