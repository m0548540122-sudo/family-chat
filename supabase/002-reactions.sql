-- Emoji reactions on messages. Run once after schema.sql.
create table public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create function public.can_access_message(msg uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.messages m where m.id = msg and public.can_access(m.conversation_id));
$$;

alter table public.message_reactions enable row level security;
create policy family_reads_reactions on public.message_reactions for select to authenticated
  using (public.can_access_message(message_id));
create policy family_adds_reactions on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_message(message_id));
create policy self_removes_reactions on public.message_reactions for delete to authenticated
  using (user_id = auth.uid() and public.can_access_message(message_id));

revoke all on public.message_reactions from anon, authenticated;
grant select, insert, delete on public.message_reactions to authenticated;
revoke execute on function public.can_access_message(uuid) from public, anon;
grant execute on function public.can_access_message(uuid) to authenticated;
