create table if not exists public.checkin_state (
  key text primary key,
  records jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.checkin_state enable row level security;

drop policy if exists "checkin_state_read" on public.checkin_state;
drop policy if exists "checkin_state_insert" on public.checkin_state;
drop policy if exists "checkin_state_update" on public.checkin_state;

create policy "checkin_state_read"
on public.checkin_state
for select
to anon
using (key = 'records');

create policy "checkin_state_insert"
on public.checkin_state
for insert
to anon
with check (key = 'records');

create policy "checkin_state_update"
on public.checkin_state
for update
to anon
using (key = 'records')
with check (key = 'records');
