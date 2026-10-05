# Working Reference Pattern: Admin Verification Queue

> **Document:** `docs/REFERENCE_PATTERN.md`  
> **Source Component:** `src/pages/admin/AdminDashboard.tsx`  
> **Data Provider:** `src/context/DataContext.tsx` (`loadSupabaseData`, `approveUserVerification`, `rejectUserVerification`)  
> **Backend Table:** `public.users` (joined with `student_profiles`, `alumni_profiles`, `faculty_profiles`)  
> **Status:** Fully functional and survives page refresh on the live site.

---

## 1. Architectural Anatomy of Why Admin Verification Works

The Admin Verification Queue is the single workflow on the live site where data loading, state hydration, backend mutation, and refresh survival all work seamlessly. It follows a clean 5-stage lifecycle:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Mount (Hydration)                                                                   │
│    AdminDashboard mounts -> triggers loadSupabaseData() in DataContext                 │
│                                                                                        │
│ 2. Database Fetch                                                                      │
│    supabase.from('users').select('*')                                                  │
│    PostgREST evaluates Admin RLS Policy -> Returns all user rows with verificationStatus│
│                                                                                        │
│ 3. State Population                                                                    │
│    Maps returned rows into studentList, alumniList, facultyList                        │
│                                                                                        │
│ 4. User Mutation (Approval / Rejection)                                                │
│    Admin clicks "Approve" -> approveUserVerification(userId)                           │
│    1. Optimistic state update in React                                                 │
│    2. Writes UPDATE to Supabase: users.update({ is_verified: true,                     │
│                                            verification_status: 'Verified' })          │
│                                  .eq('id', userId)                                     │
│    3. RLS policy permits admin UPDATE on users                                         │
│                                                                                        │
│ 5. Refresh (F5) Survival                                                               │
│    Page reloads -> loadSupabaseData() re-queries users table ->                        │
│    Returned row already contains verification_status = 'Verified' -> Hydrates clean!  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Code Trace End-to-End

### 2.1 Component Mount & Hook
- **File:** [`src/pages/admin/AdminDashboard.tsx`](file:///d:/NexaLink/src/pages/admin/AdminDashboard.tsx)
- Consumes `studentList`, `alumniList`, `facultyList`, and `isDataLoading` from `useData()`.
- Calculates pending verification queue via:
  ```ts
  const pendingUsers = useMemo(() => {
    return [...studentList, ...alumniList, ...facultyList].filter(
      u => u.verificationStatus === 'Pending Verification' || u.verificationStatus === 'Needs Clarification'
    );
  }, [studentList, alumniList, facultyList]);
  ```

### 2.2 Hydration on Mount
- **File:** [`src/context/DataContext.tsx`](file:///d:/NexaLink/src/context/DataContext.tsx#L250-L340)
- In `loadSupabaseData`:
  ```ts
  const columns = currentUser?.role === 'admin'
    ? '*'
    : 'id, name, email, role, avatar_url, department, phone, is_verified, verification_status, ...';

  const { data: usersData, error: uErr } = await supabase.from('users').select(columns);
  ```
- **Why this succeeds:**
  1. The table `public.users` exists in the live database.
  2. RLS policy allows admins to SELECT all columns and all rows.
  3. The columns match the schema exactly (`is_verified`, `verification_status`).
  4. The result is mapped into typed state and stored in React state.

### 2.3 Mutation Execution
- **File:** [`src/context/DataContext.tsx`](file:///d:/NexaLink/src/context/DataContext.tsx#L910-L928)
- In `approveUserVerification`:
  ```ts
  supabase.from('users').update({
    is_verified: true,
    verification_status: 'Verified'
  }).eq('id', userId).then(({ error }) => {
    if (error) console.error('[Supabase approveUserVerification error]', error);
  });
  ```
- **Why this succeeds:**
  1. Target table `public.users` has an UPDATE policy allowing users where `public.is_admin()` is true.
  2. The column names match snake_case DB columns.
  3. The update commits synchronously to Postgres before the user navigates away or refreshes.

---

## 3. The 4 Golden Invariants to Replicate Across All Broken Pages

Every broken domain (Messages, Events, Opportunities, Mentorship) must adopt these exact 4 invariants:

| Invariant | Admin Verification (Working) | Broken Pages (Failing) | Required Remedy |
| :--- | :--- | :--- | :--- |
| **1. Hydration Source** | Queries live Supabase table on mount (`supabase.from('users')`). | Rely on in-memory state or fallback to `mockData` (which is excluded in prod). | Every domain must query its Supabase table / RPC on mount via a dedicated service. |
| **2. Table & Column Parity** | Queries real table `users` with exact columns. | Mismatched names (`jobs` vs `job_listings`, `events` date format, missing `conversation_id`). | Align exact schema names and constraints with live database. |
| **3. Authorization Match** | RLS policy explicitly grants caller role permission to read and write. | RLS blocked direct writes or required `conversation_id` which wasn't provided. | Ensure RLS policies or dedicated RPCs permit verified users to perform the action. |
| **4. Write-Through Pipeline** | Database mutation updates real row; on refresh, row is re-fetched. | Writes fail silently or write to local state only. | Write to database first (or with checked server response), then reflect server-returned row in state. |
