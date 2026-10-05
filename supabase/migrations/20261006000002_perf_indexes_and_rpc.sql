-- phase_b_9_perf_safe.sql
-- Safe replacement for 20261006000002_perf_indexes_and_rpc.sql
-- KEEPS:  get_conversations RPC (now locked to the caller), expand-only indexes, conversation_participants (if missing)
-- DROPS:  RLS policy rewrites and the is_admin() redefinition (they re-created the insecure
--         "Role transitions access" policy and removed the search_path pin on is_admin()).
-- One transaction. The preflight aborts with a list of missing columns, so nothing half-applies.

begin;

-- 0. Preflight ---------------------------------------------------------------
do $$
declare missing text;
begin
  select string_agg(v.t || '.' || v.c, ', ') into missing
  from (values
    ('chat_messages','sender_id'), ('chat_messages','receiver_id'), ('chat_messages','content'),
    ('chat_messages','timestamp'), ('chat_messages','attachments'), ('chat_messages','is_read'),
    ('chat_messages','is_reported'), ('chat_messages','deleted_at'),
    ('users','id'), ('users','name'), ('users','avatar_url'), ('users','role'),
    ('users','department'), ('users','created_at'), ('users','is_verified'), ('users','is_active'),
    ('mentorship_requests','student_id'), ('mentorship_requests','mentor_id'),
    ('mentorship_requests','status'), ('mentorship_requests','requested_date'),
    ('job_applications','applicant_id'), ('job_applications','job_id'),
    ('job_applications','status'), ('job_applications','applied_at'),
    ('jobs','posted_by_alumni_id'), ('jobs','moderation_status'),
    ('jobs','status'), ('jobs','posted_date'),
    ('events','date'), ('events','status'), ('events','department'),
    ('notifications','user_id'), ('notifications','is_read'), ('notifications','created_at')
  ) as v(t, c)
  where not exists (
    select 1 from information_schema.columns ic
    where ic.table_schema = 'public' and ic.table_name = v.t and ic.column_name = v.c
  );
  if missing is not null then
    raise exception 'Preflight failed, missing columns: %', missing;
  end if;
end $$;

-- 1. conversation_participants (star / mute per user) ---------------------------------
create table if not exists public.conversation_participants (
  user_id    uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.users(id) on delete cascade,
  is_starred boolean not null default false,
  is_muted   boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, contact_id)
);

do $$
declare missing text;
begin
  select string_agg(c, ', ') into missing
  from unnest(array['user_id','contact_id','is_starred','is_muted']) as c
  where not exists (
    select 1 from information_schema.columns ic
    where ic.table_schema = 'public' and ic.table_name = 'conversation_participants' and ic.column_name = c
  );
  if missing is not null then
    raise exception 'conversation_participants exists but is missing columns: %', missing;
  end if;
end $$;

alter table public.conversation_participants enable row level security;

drop policy if exists "Users can manage own conversation preferences" on public.conversation_participants;
create policy "Users can manage own conversation preferences" on public.conversation_participants
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 2. Indexes (expand-only) -------------------------------------------------------------
create index if not exists idx_chat_messages_user_thread
  on public.chat_messages (sender_id, receiver_id, "timestamp" desc);
create index if not exists idx_chat_messages_receiver_thread
  on public.chat_messages (receiver_id, sender_id, "timestamp" desc);
create index if not exists idx_chat_messages_unread_partial
  on public.chat_messages (receiver_id, is_read) where is_read = false;
create index if not exists idx_chat_messages_reported_partial
  on public.chat_messages ("timestamp" desc) where is_reported = true;

create index if not exists idx_job_applications_applicant_applied
  on public.job_applications (applicant_id, applied_at desc);
create index if not exists idx_job_applications_job_applied
  on public.job_applications (job_id, applied_at desc);
create index if not exists idx_job_applications_status_applied
  on public.job_applications (status, applied_at desc);

create index if not exists idx_jobs_alumni_mod_status
  on public.jobs (posted_by_alumni_id, moderation_status);
create index if not exists idx_jobs_status_posted_date
  on public.jobs (status, moderation_status, posted_date desc);

create index if not exists idx_events_timeline
  on public.events ("date" asc, status);
create index if not exists idx_events_department_date
  on public.events (department, "date" asc);

create index if not exists idx_mentorship_requests_student_status
  on public.mentorship_requests (student_id, status, requested_date desc);
create index if not exists idx_mentorship_requests_mentor_status
  on public.mentorship_requests (mentor_id, status, requested_date desc);

create index if not exists idx_notifications_user_unread_timeline
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists idx_users_role_verified_active
  on public.users (role, is_verified, is_active);

create index if not exists idx_conversation_participants_user_star
  on public.conversation_participants (user_id, is_starred);

-- audit_logs: the sort column is either created_at or timestamp; index whichever exists
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'created_at') then
    execute 'create index if not exists idx_audit_logs_created_desc on public.audit_logs (created_at desc)';
  elsif exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'timestamp') then
    execute 'create index if not exists idx_audit_logs_timestamp_desc on public.audit_logs ("timestamp" desc)';
  end if;
end $$;

-- 3. get_conversations: ONLY for the caller ----------------------------------------------
create or replace function public.get_conversations(p_user_id uuid)
returns table (
  counterpart_id uuid,
  counterpart_name text,
  counterpart_avatar text,
  counterpart_role text,
  counterpart_department text,
  last_message_id uuid,
  last_message_content text,
  last_message_timestamp timestamptz,
  last_message_sender_id uuid,
  last_message_attachments jsonb,
  unread_count bigint,
  is_starred boolean,
  is_muted boolean
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'Forbidden: you can only list your own conversations' using errcode = '42501';
  end if;

  return query
  with all_counterparts as (
    select case when m.sender_id = p_user_id then m.receiver_id else m.sender_id end as c_id
    from public.chat_messages m
    where m.sender_id = p_user_id or m.receiver_id = p_user_id
    union
    select case when mr.student_id = p_user_id then mr.mentor_id else mr.student_id end
    from public.mentorship_requests mr
    where (mr.student_id = p_user_id or mr.mentor_id = p_user_id)
      and mr.status::text = 'Accepted'
  ),
  ranked_messages as (
    select
      case when m.sender_id = p_user_id then m.receiver_id else m.sender_id end as c_id,
      m.id            as msg_id,
      m.content       as msg_content,
      m."timestamp"   as msg_ts,
      m.sender_id     as msg_sender,
      m.attachments   as msg_attachments,
      row_number() over (
        partition by case when m.sender_id = p_user_id then m.receiver_id else m.sender_id end
        order by m."timestamp" desc
      ) as rn
    from public.chat_messages m
    where (m.sender_id = p_user_id or m.receiver_id = p_user_id)
      and m.deleted_at is null
  ),
  unread_counts as (
    select m.sender_id as c_id, count(*)::bigint as unread_total
    from public.chat_messages m
    where m.receiver_id = p_user_id
      and m.is_read = false
      and m.deleted_at is null
    group by m.sender_id
  )
  select
    ac.c_id::uuid,
    coalesce(u.name::text, 'Unknown user'),
    coalesce(u.avatar_url::text, ''),
    coalesce(u.role::text, 'student'),
    coalesce(u.department::text, ''),
    rm.msg_id::uuid,
    coalesce(rm.msg_content::text, ''),
    rm.msg_ts::timestamptz,
    rm.msg_sender::uuid,
    coalesce(rm.msg_attachments, '[]'::jsonb),
    coalesce(uc.unread_total, 0)::bigint,
    coalesce(cp.is_starred, false),
    coalesce(cp.is_muted, false)
  from all_counterparts ac
  join public.users u on u.id = ac.c_id
  left join ranked_messages rm on rm.c_id = ac.c_id and rm.rn = 1
  left join unread_counts uc on uc.c_id = ac.c_id
  left join public.conversation_participants cp
         on cp.user_id = p_user_id and cp.contact_id = ac.c_id
  order by coalesce(rm.msg_ts, u.created_at, now()) desc;
end;
$$;

revoke execute on function public.get_conversations(uuid) from public, anon;
grant  execute on function public.get_conversations(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
