# Data Governance Addendum: Student Outreach & Discovery (v2.8)

*This addendum provides ready-to-paste governance clauses for institutional policy documentation regarding opt-in student discovery by verified alumni and faculty.*

---

## 1. Principles of Sovereign Student Consent

1. **Opt-in Master Control**: Student discovery in NexaLink operates strictly on an opt-in basis. By default, `open_to_outreach` is set to `FALSE` for every student upon account creation.
2. **Invitation-Only Interaction**: Discovery permits verified alumni and faculty to submit structured invitations to connect. Direct unsolicited messaging, external email disclosure, or phone exposure is strictly prevented at the database RLS layer.
3. **Conversation Gating**: 1:1 chat channels and communication pathways only open when the student explicitly reviews and accepts the invitation.
4. **Instant Revocation**: When a student toggles "Open to mentorship and referrals" to OFF, their profile is instantly excluded from discovery queries across all roles.

---

## 2. Role-Based Data Exposure & Masking Matrix

| Viewer Role | Eligible Students | Discoverable Fields | Post-Acceptance Access |
|---|---|---|---|
| **Verified Alumni** | Opted-in students only (`open_to_outreach = true`) | Full Name, Department, Academic Year / Semester, Skills (if toggled ON), Career Goal (if toggled ON), Areas of Interest (if toggled ON). **Privacy initials avatar only; photos and PRN are never exposed.** | Photo, signed resume URL (10-minute validity), login email. |
| **Verified Faculty (Own Department)** | All verified departmental students (academic mandate) | Full Name, Department, Academic Year / Semester, PRN, Photo, Skills, Career Goal, Areas of Interest. | Signed resume URL. |
| **Verified Faculty (Cross Department)** | Opted-in students only (`open_to_outreach = true`) | Same fields as alumni. | Signed resume URL. |
| **Unverified / Public / Anyone** | None | No access. Functions reject unauthorized calls at the database boundary. | No access. |

---

## 3. Strict Prohibitions

Under no circumstances does NexaLink expose:
- Student mobile or landline phone numbers
- Verification proof documents (identity cards, admission fee receipts)
- Institutional roll numbers or private emails to alumni prior to student acceptance

---

## 4. Abuse Prevention & Rate Limiting

1. **Invitation Cap**: Verified alumni and faculty may transmit a maximum of 5 outreach invitations per rolling 7-day period.
2. **Decline Cooldown**: If a student declines an outreach invitation, the platform imposes a mandatory 60-day cooldown during which the sender cannot transmit further invitations to that student.
3. **Block & Incident Reporting**: Students can choose "Block and report". This immediately terminates the invitation, places the sender on a permanent block list, and creates a moderation ticket.
4. **Automatic Expiration**: Unanswered invitations expire after 14 days.

---

## 5. Audit Logging & Retention Policy

1. **Profile View Audit Log**: When a member inspects a student's discovery card or opens an invite modal, a view record is written to `public.student_profile_views` (deduplicated to at most one record per viewer per day).
2. **Student Transparency**: Students can view a 30-day chronological log of all alumni and faculty members who inspected their profile.
3. **Retention & Scheduled Purge**: Profile view audit logs have a mandatory retention lifecycle of 90 days. Records older than 90 days must be purged by the daily database vacuum/maintenance worker:
   ```sql
   DELETE FROM public.student_profile_views
   WHERE viewed_on < (CURRENT_DATE - INTERVAL '90 days');
   ```
