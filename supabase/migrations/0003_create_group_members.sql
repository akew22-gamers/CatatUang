create table group_members (
  user_id uuid references public.profiles(id) not null,
  group_id bigint references public.groups(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, group_id)
);

alter table group_members enable row level security;

create policy "Members can view group members"
  on group_members for select
  to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Owners can add members"
  on group_members for insert
  to authenticated
  with check (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
    )
  );

create policy "Users can leave groups"
  on group_members for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Owners can remove members"
  on group_members for delete
  to authenticated
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
    )
  );

create index group_members_user_id_idx on group_members(user_id);
create index group_members_group_id_idx on group_members(group_id);
