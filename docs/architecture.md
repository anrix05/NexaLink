# System Architecture & Data Schema: NexaLink

## 1. High-Level Architecture Overview

NexaLink is structured around a client-side React 18 / TypeScript architecture driven by React Context state containers (`AuthContext`, `DataContext`) for real-time reactivity, coupled with a Node.js/Express backend and SQLite database foundation ready for Phase 4 deployment.

```
+-----------------------------------------------------------------------+
|                             NexaLink UI                               |
| (Navbar, SidebarNav, CommandPalette, RoleGate, UIComponents, Modals) |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         React Context Layer                           |
|       +------------------------+    +------------------------+        |
|       |      AuthContext       |    |      DataContext       |        |
|       |  (Role Auth & Lockout) |    | (Unified Data Store)   |        |
|       +------------------------+    +------------------------+        |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    Application Services & Modules                     |
|  +--------------+  +--------------+  +---------------+  +----------+  |
|  | User Admin   |  | Mentorship   |  | Jobs & Events |  | NexaChats|  |
|  | Verification |  | Rec Engine   |  | Opportunities |  | Messaging|  |
|  +--------------+  +--------------+  +---------------+  +----------+  |
|  +--------------+  +--------------+  +---------------+  +----------+  |
|  | Role Change  |  | Accreditation|  | Admin Handoff |  | Motion & |  |
|  | Transitions  |  | Reports Export| | & Invites     |  | Physics  |  |
|  +--------------+  +--------------+  +---------------+  +----------+  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                       Backend & Database Layer                        |
|        Node.js / Express REST API  <--->  SQLite Database            |
+-----------------------------------------------------------------------+
```

---

## 2. Core Data Models (`src/types/index.ts`)

### User & Role Interfaces
- **`User` (Base Interface):** `id`, `name`, `email`, `role`, `department`, `avatar`, `isVerified`, `verificationStatus`, `clarificationRequest`, `clarificationRequested`, `proofDocumentName`, `verificationDocumentUrl`, `verificationDocumentName`, `isActive`.
- **`AlumniProfile` (Extends Base):** `personalEmail`, `graduationYear`, `company`, `designation`, `higherEducationInstitute`, `higherStudies`, `employmentDataPending`, `location`, `country`, `experience`, `professionalAchievements`, `bio`, `isMentoringAvailable`, `maxMentees`, `activeMenteesCount`.
- **`StudentProfile` (Extends Base):** `enrollmentNo`, `prn`, `currentYear`, `semester`, `expectedGraduationYear`, `cgpa`, `skills`, `areasOfInterest`, `careerGoal`, `preferredIndustry`, `preferredHigherStudies`, `certifications`, `projects`, `targetCompanies`, `resumeUrl`.
- **`FacultyProfile` (Extends Base):** `employeeId`, `designation`, `specialization`, `researchAreas`, `subjectsTaught`, `publications`, `industryInterests`, `ongoingResearch`.

### Administrative Governance Models
- **`AdminInvite`:** `id`, `invitedEmail`, `invitedByAdminId`, `invitedAt`, `status` (`'pending' | 'accepted' | 'revoked'`), `acceptedAt`.
- **`RoleTransitionRequest`:** `id`, `userId`, `requestedRole`, `status`, `requestedAt`, `reviewedAt`, `reviewedByAdminId`, `rejectionReason`, `proposedAlumniData`.
- **`ChatMessage`:** `id`, `senderId`, `receiverId`, `content`, `timestamp`, `category`, `isRead`, `attachmentName`, `senderRole`, `isReported`.
- **`AuditLogEntry`:** `id`, `timestamp`, `action`, `performedBy`, `details`, `targetUserId`.

---

## 3. Key Context State Handlers (`DataContext.tsx`)

| Handler Method | Scope & Functionality |
| :--- | :--- |
| `approveUserVerification(userId)` | Sets `isVerified: true`, `verificationStatus: 'Verified'`, logs `USER_VERIFIED`. |
| `rejectUserVerification(userId, reason)` | Sets `verificationStatus: 'Rejected'`, stores rejection reason, logs `USER_REJECTED`. |
| `requestUserClarification(userId, promptText)` | Sets `verificationStatus: 'Needs Clarification'`, attaches `clarificationRequested` prompt object. |
| `resubmitUserVerification(userId, docName, docUrl)` | Clears `clarificationRequested`, updates proof document links, resets status to `'Pending Verification'`. |
| `submitRoleTransitionRequest(userId, data)` | Generates student-to-alumni role change request containing `personalEmail` and proof doc links. |
| `approveRoleTransition(requestId, adminId)` | Migrates student profile to `alumniList` preserving user ID, chat history, and mentorship logs. |
| `inviteNewAdmin(email, adminId)` | Creates `AdminInvite` record; checks active admin count before step-down. |
| `acceptAdminInvite(inviteId, name, password)` | Converts invite to active Admin user account and authenticates. |
| `getReportedMessages()` | Returns all flagged chat messages for admin moderation review. |
| `dismissMessageReport / actionMessageReport` | Clears report flag or issues warning / removes message from chat thread. |

---

## 4. UI Primitives & Motion Architecture (`src/components/common/UIComponents.tsx`)

1. **Button Motion Physics:** Built with `motion.button` and spring physics (`stiffness: 400, damping: 17`, `scale: 1.03` hover, `scale: 0.95` tap).
2. **Card Interactions:** Subtle elevation on hover (`y: -2px`, `scale: 1.01`) with spring damping.
3. **Animated Checkmark (`AnimatedCheckIcon`):** SVG path length animation for verification and approval state feedback.
4. **Sliding Highlight Pills (`layoutId`):** Synchronized tab indicator gliding across auth and dashboard views.
5. **Command Palette (`CommandPalette.tsx`):** Role-scoped modal (`Ctrl+K`) with instant keyboard navigation, shortcut filters, and action execution.

---

## 5. Security & Privacy Model

1. **Role Isolation & Guarding:** Page routes and action components are wrapped in `<RoleGate allow={[...]}>` to prevent unauthorized cross-role access.
2. **Messaging Privacy Guard:** Admins cannot view private P2P chat content unless explicitly flagged by a user via the "Report to Admin" button.
3. **Password Rate Limiting:** 5 consecutive failed login attempts activate a 15-minute account lockout.
4. **Post-Graduation Auth Safety:** College email `@student.vit.edu.in` deactivation handled gracefully via `personalEmail` mapping.

