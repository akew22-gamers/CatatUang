create table chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null default auth.uid(),
  group_id bigint references public.groups(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  data jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table chat_messages enable row level security;

create policy "Users can view own chat messages"
  on chat_messages for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can create own chat messages"
  on chat_messages for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own chat messages"
  on chat_messages for delete
  to authenticated
  using (user_id = auth.uid());

create index chat_messages_user_id_idx on chat_messages(user_id);
create index chat_messages_group_id_idx on chat_messages(group_id);
create index chat_messages_created_at_idx on chat_messages(created_at desc);