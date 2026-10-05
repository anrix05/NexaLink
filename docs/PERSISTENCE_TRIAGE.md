# Page Persistence & Hydration Triage Matrix

> **Document:** `docs/PERSISTENCE_TRIAGE.md`  
> **Status:** Step 1 Field-by-Field Failure Confirmation & Payload Mapping

---

## 1. Step 1 Failure Confirmation & Real Error Mapping

| Feature / Table | Operation | Missing / Invalid Payload Field | Real PostgREST / Storage Error | Failure Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Peer Messaging** (`chat_messages`) | `POST /chat_messages` or `rpc/send_message` | `sender_name`, `sender_role`, `sender_avatar` (NULL without photo); `content` NULL on attachments; missing columns `client_message_id`, `reactions` | `23502` (null value in column violates not-null constraint)<br>`42703` (column does not exist)<br>`PGRST202` (function not found) | Live table requires `sender_name`, `sender_role`, `sender_avatar`, `content` NOT NULL without default. If sender has no photo or attachment-only message has no text, write is rejected. `send_message` RPC does not exist. |
| **Events** (`events`) | `POST /events` | `speaker_designation`, `speaker_company`, `banner_image`, `time`, `location_or_url`; `date` string format; `department` enum | `23502` (not-null violation)<br>`22P02` (invalid input syntax for type date or enum) | Five required fields have no defaults. UI composer omits some. Passing full department string like `"Computer Engineering"` violates enum `department_code` (`CMPN`). Non-ISO dates fail `date` parsing. |
| **Mentorship** (`mentorship_requests`) | `POST /mentorship_requests` | `student_year`, `area_of_guidance`, `mentor_company_or_dept`; `status` casing; `student_department` | `23502` (not-null violation)<br>`22P02` (invalid input value for enum `mentorship_status` or `department_code`) | Over 8 columns have NO defaults. Client types use lowercase `'pending'`, but PostgreSQL enum requires `'Pending'`, `'Accepted'`, etc. Full department names violate enum `department_code`. |
| **Opportunities** (`jobs`) | `POST /jobs` | `application_deadline` NOT NULL; `department` enum array | `23502` (not-null violation)<br>`22P02` (invalid enum array) | `application_deadline` is required. |
| **Job Applications** | `POST /job_applications` | Entire table missing | `PGRST205` / `42P01` (relation does not exist) | Live database does not have `job_applications` table. Student applications are purely in-memory. |
| **Storage (Avatars, Resumes)** | `POST /storage/v1/object/...` with `upsert: true` | Missing UPDATE policy on `storage.objects` | `42501` (new row violates row-level security policy for table "objects") | Initial upload succeeds via INSERT policy; subsequent upload with `{ upsert: true }` issues an UPDATE, which fails because storage policies only define INSERT and SELECT. |
| **Storage (Certificates)** | `POST /storage/v1/object/event-certificates` | Missing INSERT policy | `42501` (RLS policy violation) | `event-certificates` bucket has a SELECT policy but NO INSERT policy. |
| **Storage (Proof Docs)** | `GET /storage/v1/object/proof-documents` | Private bucket with expired / unauthenticated URL | `400` / `403` | Private bucket requires signed URL. Static URL stored in `verification_document_url` cannot be viewed by admin. |
| **Realtime Chat** | WebSocket broadcast | Table not in publication | Realtime silent drop | `chat_messages` table is not added to `supabase_realtime` publication. |

---

## 2. The Mock Resurrection Trap
Because writes failed silently (promises un-awaited with `console.error`), tables in Supabase remained at 0 rows. On page refresh (F5), `DataContext.tsx` detected 0 rows and populated synthetic `mockData`. To the user, it appeared as if "everything disappeared on refresh".
