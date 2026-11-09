-- Family chat database. Run once in the Supabase SQL editor.
-- Every access rule lives here; the browser is never trusted.

create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table public.allowed_emails (
  email text primary key check (email = lower(email) and email like '%@%'),
  display_name text check (char_length(display_name) <= 40),
  is_owner boolean not null default false,
  blocked boolean not null default false,
  added_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (char_length(name) between 1 and 40),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('family', 'direct')),
  direct_key text unique,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id),
  body text not null default '' check (char_length(body) <= 8000),
  attachment_path text,
  attachment_name text check (char_length(attachment_name) <= 200),
  attachment_type text check (char_length(attachment_type) <= 120),
  attachment_size bigint,
  created_at timestamptz not null default now(),
  check (char_length(body) > 0 or attachment_path is not null)
);
create index messages_by_conversation on public.messages (conversation_id, created_at desc);

create table public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ---------- Identity checks ----------
create function public.is_family() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'google'
    and exists (
      select 1 from public.allowed_emails a
      where a.email = lower(auth.jwt() ->> 'email') and not a.blocked
    );
$$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_family() and exists (
    select 1 from public.allowed_emails a
    where a.email = lower(auth.jwt() ->> 'email') and a.is_owner
  );
$$;

create function public.can_access(conv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_family() and exists (
    select 1 from public.conversations c
    where c.id = conv and (
      c.kind = 'family' or exists (
        select 1 from public.conversation_members m
        where m.conversation_id = c.id and m.user_id = auth.uid()
      )
    )
  );
$$;

create function public.can_access_path(object_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare folder text := split_part(object_name, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_access(folder::uuid);
end $$;

-- ---------- Owner protection ----------
create function public.protect_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.is_owner then
    if tg_op = 'DELETE' or new.blocked then
      raise exception 'owner_is_protected';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger allowed_emails_protect_owner
  before update or delete on public.allowed_emails
  for each row execute function public.protect_owner();

-- ---------- Row security ----------
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;

create policy owner_reads_allowed on public.allowed_emails for select to authenticated using (public.is_owner());
create policy owner_adds_allowed on public.allowed_emails for insert to authenticated with check (public.is_owner() and not is_owner);
create policy owner_updates_allowed on public.allowed_emails for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_removes_allowed on public.allowed_emails for delete to authenticated using (public.is_owner());

create policy family_reads_profiles on public.profiles for select to authenticated using (public.is_family());
create policy self_updates_profile on public.profiles for update to authenticated
  using (public.is_family() and id = auth.uid()) with check (id = auth.uid());

create policy family_reads_conversations on public.conversations for select to authenticated using (public.can_access(id));
create policy family_reads_members on public.conversation_members for select to authenticated using (public.can_access(conversation_id));

create policy family_reads_messages on public.messages for select to authenticated using (public.can_access(conversation_id));
create policy family_sends_messages on public.messages for insert to authenticated with check (
  public.can_access(conversation_id)
  and sender_id = auth.uid()
  and (attachment_path is null or split_part(attachment_path, '/', 1) = conversation_id::text)
);

create policy self_reads_reads on public.conversation_reads for select to authenticated using (user_id = auth.uid());

-- Least privilege: only what the app really needs.
revoke all on public.allowed_emails, public.profiles, public.conversations,
  public.conversation_members, public.messages, public.conversation_reads from anon, authenticated;
grant select, delete on public.allowed_emails to authenticated;
grant insert (email, display_name) on public.allowed_emails to authenticated;
grant update (blocked, display_name) on public.allowed_emails to authenticated;
grant select on public.profiles, public.conversations, public.conversation_members, public.conversation_reads to authenticated;
grant update (name) on public.profiles to authenticated;
grant select, insert on public.messages to authenticated;

-- ---------- App functions ----------
create function public.ensure_profile() returns json
language plpgsql security definer set search_path = '' as $$
declare
  jwt_email text := lower(auth.jwt() ->> 'email');
  meta jsonb := auth.jwt() -> 'user_metadata';
  given text;
  result json;
begin
  if not public.is_family() then
    raise exception 'not_allowed';
  end if;
  select display_name into given from public.allowed_emails where email = jwt_email;
  insert into public.profiles (id, email, name, avatar_url)
  values (
    auth.uid(), jwt_email,
    left(coalesce(given, meta ->> 'full_name', meta ->> 'name', split_part(jwt_email, '@', 1)), 40),
    meta ->> 'avatar_url'
  )
  on conflict (id) do update set avatar_url = excluded.avatar_url;
  select json_build_object('id', p.id, 'email', p.email, 'name', p.name,
    'avatar_url', p.avatar_url, 'is_owner', public.is_owner())
    into result from public.profiles p where p.id = auth.uid();
  return result;
end $$;

create function public.open_direct(other uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  k text;
  conv uuid;
begin
  if not public.is_family() or other = me
     or not exists (select 1 from public.profiles where id = other) then
    raise exception 'not_allowed';
  end if;
  k := least(me::text, other::text) || ':' || greatest(me::text, other::text);
  insert into public.conversations (kind, direct_key) values ('direct', k)
    on conflict (direct_key) do update set direct_key = excluded.direct_key
    returning id into conv;
  insert into public.conversation_members (conversation_id, user_id)
    values (conv, me), (conv, other) on conflict do nothing;
  return conv;
end $$;

create function public.mark_read(conv uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_access(conv) then raise exception 'not_allowed'; end if;
  insert into public.conversation_reads (conversation_id, user_id) values (conv, auth.uid())
    on conflict (conversation_id, user_id) do update set last_read_at = now();
end $$;

create function public.my_conversations()
returns table (id uuid, kind text, other_id uuid, last_body text, last_attachment text,
               last_at timestamptz, last_sender uuid, unread bigint)
language sql stable security definer set search_path = '' as $$
  select c.id, c.kind,
    (select m.user_id from public.conversation_members m
      where m.conversation_id = c.id and m.user_id <> auth.uid() limit 1),
    l.body, l.attachment_name, l.created_at, l.sender_id,
    (select count(*) from public.messages x
      where x.conversation_id = c.id and x.sender_id <> auth.uid()
        and x.created_at > coalesce(
          (select r.last_read_at from public.conversation_reads r
            where r.conversation_id = c.id and r.user_id = auth.uid()),
          '-infinity'::timestamptz))
  from public.conversations c
  left join lateral (
    select * from public.messages m where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) l on true
  where public.can_access(c.id);
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_family(), public.is_owner(), public.can_access(uuid),
  public.can_access_path(text), public.ensure_profile(), public.open_direct(uuid),
  public.mark_read(uuid), public.my_conversations() to authenticated;

-- ---------- Files (private, family only) ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

create policy family_reads_files on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.can_access_path(name));
create policy family_uploads_files on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and public.can_access_path(name));

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.messages;

-- ---------- Starting data ----------
insert into public.conversations (id, kind)
values ('00000000-0000-4000-8000-000000000001', 'family');
insert into public.allowed_emails (email, is_owner)
values ('owner@example.com', true); -- replace with the owner's real Google address before running
