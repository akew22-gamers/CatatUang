create table ai_confirmations (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  group_id bigint references public.groups(id) on delete cascade not null,
  original_message text not null,
  parsed_data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  expires_at timestamptz not null default (timezone('utc'::text, now()) + interval '24 hours'),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table ai_confirmations enable row level security;

create policy "Users can view own confirmations"
  on ai_confirmations for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create own confirmations"
  on ai_confirmations for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own confirmations"
  on ai_confirmations for update
  to authenticated
  using (user_id = auth.uid());

-- Index for cleanup queries
create index ai_confirmations_expires_at_idx on ai_confirmations(expires_at);
create index ai_confirmations_user_id_idx on ai_confirmations(user_id);
create index ai_confirmations_status_idx on ai_confirmations(status);

-- Auto-delete expired confirmations
create or replace function public.cleanup_expired_confirmations()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.ai_confirmations
  where expires_at < now();
end;
$$;
