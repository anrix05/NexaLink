-- ============================================================================
-- Migration: 20261005000004_nexachats_attachments_and_send_message_v2.sql
-- (phase_b_7_chat_attachments.sql)
-- Corrected version of the attachments migration (supersedes initial draft).
-- Adds: verified-only messaging, strict attachment paths, real file checks, sender-scoped idempotency,
--       attachment clearing on delete, storage hardening, basic size/rate limits.
-- Type-agnostic for chat_messages.client_message_id (uuid or text).
-- Run in one transaction. The preflight aborts with a list of missing columns if any assumption is wrong.
-- ============================================================================

begin;

-- 0. Preflight ---------------------------------------------------------------
do $$
declare missing text;
begin
  select string_agg(v.t || '.' || v.c, ', ') into missing
  from (values
    ('chat_messages','id'), ('chat_messages','sender_id'), ('chat_messages','sender_name'),
    ('chat_messages','sender_role'), ('chat_messages','sender_avatar'), ('chat_messages','receiver_id'),
    ('chat_messages','content'), ('chat_messages','attachment_name'), ('chat_messages','attachment_url'),
    ('chat_messages','timestamp'), ('chat_messages','is_read'), ('chat_messages','reactions'),
    ('chat_messages','is_reported'),
    ('users','id'), ('users','name'), ('users','role'), ('users','avatar_url'),
    ('users','is_verified'), ('users','is_active')
  ) as v(t, c)
  where not exists (
    select 1 from information_schema.columns ic
    where ic.table_schema = 'public' and ic.table_name = v.t and ic.column_name = v.c
  );
  if missing is not null then
    raise exception 'Preflight failed, missing columns: %', missing;
  end if;
end $$;

-- 1. chat_messages columns ---------------------------------------------------
alter table public.chat_messages alter column content drop not null;
alter table public.chat_messages alter column content set default '';

alter table public.chat_messages add column if not exists client_message_id text;
alter table public.chat_messages add column if not exists attachments jsonb default '[]'::jsonb;
alter table public.chat_messages add column if not exists reply_to_id uuid references public.chat_messages(id) on delete set null;
alter table public.chat_messages add column if not exists reactions jsonb default '[]'::jsonb;
alter table public.chat_messages add column if not exists deleted_at timestamptz;
alter table public.chat_messages add column if not exists is_deleted boolean default false;
alter table public.chat_messages add column if not exists edited_at timestamptz;

create unique index if not exists idx_chat_messages_client_message_id
  on public.chat_messages(client_message_id) where client_message_id is not null;
create index if not exists idx_chat_messages_attachments
  on public.chat_messages using gin(attachments);
create index if not exists idx_chat_messages_sender_receiver
  on public.chat_messages(sender_id, receiver_id);

alter table public.chat_messages replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 2. Storage bucket ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments', 'chat-attachments', false, 10485760,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

-- 3. Storage policies (path: {senderId}/{receiverId}/{file}, ids lowercase) ---------
drop policy if exists "chat upload" on storage.objects;
drop policy if exists "chat read" on storage.objects;
drop policy if exists "Participants can upload chat attachments" on storage.objects;
drop policy if exists "Chat attachments viewable by conversation participants" on storage.objects;
drop policy if exists "Chat attachments access: Authenticated Participants" on storage.objects;
drop policy if exists "Authenticated users can upload chat attachments" on storage.objects;
drop policy if exists "chat_attachments_sender_insert" on storage.objects;
drop policy if exists "chat_attachments_participant_select" on storage.objects;
drop policy if exists "chat_attachments_owner_delete" on storage.objects;

create policy "chat_attachments_sender_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','pdf')
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_verified is true and coalesce(u.is_active, true)
    )
  );

create policy "chat_attachments_participant_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );

create policy "chat_attachments_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'chat-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. JSON helper + send_message_v2 ---------------------------------------------------
create or replace function public.chat_message_to_json(m public.chat_messages, p_duplicate boolean)
returns jsonb language sql stable set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'success', true,
    'duplicate', p_duplicate,
    'id', m.id,
    'client_message_id', m.client_message_id,
    'sender_id', m.sender_id,
    'sender_name', m.sender_name,
    'sender_role', m.sender_role,
    'sender_avatar', m.sender_avatar,
    'receiver_id', m.receiver_id,
    'content', m.content,
    'attachments', coalesce(m.attachments, '[]'::jsonb),
    'reply_to_id', m.reply_to_id,
    'timestamp', m."timestamp"
  );
$$;

create or replace function public.send_message_v2(
  p_client_message_id uuid,
  p_receiver_id uuid,
  p_content text default '',
  p_attachments jsonb default '[]'::jsonb,
  p_reply_to_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_sender_id uuid := auth.uid();
  v_sender public.users%rowtype;
  v_receiver public.users%rowtype;
  v_msg public.chat_messages%rowtype;
  v_content text := coalesce(trim(p_content), '');
  v_in jsonb := coalesce(p_attachments, '[]'::jsonb);
  v_clean jsonb := '[]'::jsonb;
  v_att jsonb;
  v_count int;
  v_path text;
  v_name text;
  v_mime text;
  v_size bigint;
  v_meta jsonb;
begin
  if v_sender_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;
  if p_receiver_id is null or p_receiver_id = v_sender_id then
    raise exception 'Invalid recipient' using errcode = '22023';
  end if;
  if char_length(v_content) > 4000 then
    raise exception 'Message too long (max 4000 characters)' using errcode = '22023';
  end if;
  if jsonb_typeof(v_in) <> 'array' then
    raise exception 'Attachments must be an array' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(v_in);
  if v_content = '' and v_count = 0 then
    raise exception 'Message must have text or an attachment' using errcode = '22023';
  end if;
  if v_count > 4 then
    raise exception 'Maximum 4 attachments per message' using errcode = '22023';
  end if;

  select * into v_sender from public.users where id = v_sender_id;
  if not found or v_sender.is_verified is not true or coalesce(v_sender.is_active, true) = false then
    raise exception 'Your account must be verified before you can send messages' using errcode = '42501';
  end if;

  select * into v_receiver from public.users where id = p_receiver_id;
  if not found or v_receiver.is_verified is not true or coalesce(v_receiver.is_active, true) = false then
    raise exception 'Recipient is not available' using errcode = '42501';
  end if;

  -- Idempotency (scoped to the sender)
  if p_client_message_id is not null then
    select * into v_msg from public.chat_messages
      where sender_id = v_sender_id and client_message_id::text = p_client_message_id::text
      limit 1;
    if found then
      return public.chat_message_to_json(v_msg, true);
    end if;
  end if;

  -- Basic rate limit
  if (select count(*) from public.chat_messages
        where sender_id = v_sender_id and "timestamp" > now() - interval '1 minute') >= 30 then
    raise exception 'Too many messages, please slow down' using errcode = '54000';
  end if;

  -- Reply target must be in the same conversation
  if p_reply_to_id is not null and not exists (
    select 1 from public.chat_messages r
    where r.id::text = p_reply_to_id::text
      and ((r.sender_id = v_sender_id and r.receiver_id = p_receiver_id)
        or (r.sender_id = p_receiver_id and r.receiver_id = v_sender_id))
  ) then
    raise exception 'Reply target not found in this conversation' using errcode = '22023';
  end if;

  -- Attachments: strict path, real file must exist, real type and size, rebuilt clean
  for i in 0..v_count - 1 loop
    v_att := v_in -> i;
    if jsonb_typeof(v_att) <> 'object' then
      raise exception 'Invalid attachment' using errcode = '22023';
    end if;

    v_path := v_att->>'path';
    if v_path is null
       or v_path !~ ('^' || v_sender_id::text || '/' || p_receiver_id::text || '/[^/]+$')
       or position('..' in v_path) > 0 then
      raise exception 'Invalid attachment path' using errcode = '42501';
    end if;

    select o.metadata into v_meta
      from storage.objects o
      where o.bucket_id = 'chat-attachments' and o.name = v_path;
    if not found then
      raise exception 'Attachment was not uploaded: %', v_path using errcode = '22023';
    end if;

    v_mime := coalesce(v_meta->>'mimetype', v_att->>'mime');
    begin
      v_size := coalesce((v_meta->>'size')::bigint, (v_att->>'size')::bigint);
    exception when others then
      v_size := null;
    end;

    if v_mime is null or v_mime not in ('image/jpeg','image/png','image/webp','application/pdf') then
      raise exception 'Attachment type not allowed: %', v_mime using errcode = '22023';
    end if;
    if v_size is null or v_size <= 0 or v_size > 10485760 then
      raise exception 'Attachment size invalid or over 10 MB' using errcode = '22023';
    end if;

    v_name := left(coalesce(nullif(trim(v_att->>'name'), ''), 'file'), 200);

    v_clean := v_clean || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'path', v_path,
      'name', v_name,
      'mime', v_mime,
      'size', v_size,
      'width',  case when (v_att->>'width')  ~ '^[0-9]{1,5}$' then (v_att->>'width')::int end,
      'height', case when (v_att->>'height') ~ '^[0-9]{1,5}$' then (v_att->>'height')::int end
    )));
  end loop;

  begin
    insert into public.chat_messages (
      client_message_id, sender_id, sender_name, sender_role, sender_avatar,
      receiver_id, content, attachments, attachment_name, attachment_url,
      reply_to_id, "timestamp", is_read, reactions, is_reported
    ) values (
      p_client_message_id, v_sender_id, v_sender.name, v_sender.role, coalesce(v_sender.avatar_url, ''),
      p_receiver_id, v_content, v_clean, null, null,
      p_reply_to_id, now(), false, '[]'::jsonb, false
    )
    returning * into v_msg;
  exception when unique_violation then
    select * into v_msg from public.chat_messages
      where sender_id = v_sender_id and client_message_id::text = p_client_message_id::text
      limit 1;
    if not found then
      raise;
    end if;
    return public.chat_message_to_json(v_msg, true);
  end;

  return public.chat_message_to_json(v_msg, false);
end;
$$;

-- 5. Insert guard: covers EVERY insert path (RPC and direct PostgREST insert) ---------
create or replace function public.trg_chat_messages_insert_guard()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if auth.uid() is not null then
    if new.sender_id is distinct from auth.uid() then
      raise exception 'sender_id must be the caller' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_verified is true and coalesce(u.is_active, true)
    ) then
      raise exception 'Your account must be verified before you can send messages' using errcode = '42501';
    end if;
    if jsonb_typeof(new.attachments) = 'array' and jsonb_array_length(new.attachments) > 0 then
      if jsonb_array_length(new.attachments) > 4
         or exists (
           select 1 from jsonb_array_elements(new.attachments) a
           where coalesce(a->>'path', '') !~ ('^' || new.sender_id::text || '/' || new.receiver_id::text || '/[^/]+$')
         ) then
        raise exception 'Invalid attachments' using errcode = '42501';
      end if;
    end if;
  end if;

  new."timestamp"   := now();
  new.is_read       := false;
  new.is_reported   := false;
  new.report_reason := null;
  new.reactions     := '[]'::jsonb;
  new.edited_at     := null;
  new.deleted_at    := null;
  new.is_deleted    := false;
  return new;
end $$;

drop trigger if exists trg_chat_messages_insert_guard on public.chat_messages;
create trigger trg_chat_messages_insert_guard
  before insert on public.chat_messages
  for each row execute function public.trg_chat_messages_insert_guard();

-- 6. Deleted messages must not keep attachments ------------------------------------------
-- Named trg_zz_* so it fires after the other BEFORE UPDATE triggers (alphabetical order).
create or replace function public.trg_chat_clear_attachments_on_delete()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.is_deleted is true or new.deleted_at is not null then
    new.attachments := '[]'::jsonb;
    new.attachment_name := null;
    new.attachment_url := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_zz_chat_clear_attachments_on_delete on public.chat_messages;
create trigger trg_zz_chat_clear_attachments_on_delete
  before update on public.chat_messages
  for each row execute function public.trg_chat_clear_attachments_on_delete();

-- 7. Grants -------------------------------------------------------------------------------
revoke execute on function public.send_message_v2(uuid, uuid, text, jsonb, uuid) from public, anon;
grant  execute on function public.send_message_v2(uuid, uuid, text, jsonb, uuid) to authenticated;
revoke execute on function public.chat_message_to_json(public.chat_messages, boolean) from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
