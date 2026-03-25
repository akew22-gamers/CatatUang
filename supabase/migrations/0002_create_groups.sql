create table groups (
  id bigint generated always as identity primary key,
  name text not null,
  created_by uuid references public.profiles(id) not null default auth.uid(),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table groups enable row level security;

create policy "Group creators can view their groups"
  on groups for select
  to authenticated
  using (
    id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Users can create groups"
  on groups for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Group owners can update groups"
  on groups for update
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

create policy "Group owners can delete groups"
  on groups for delete
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

create index groups_created_by_idx on groups(created_by);
