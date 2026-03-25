create table wallets (
  id bigint generated always as identity primary key,
  name text not null,
  group_id bigint references public.groups(id) on delete cascade not null,
  created_by uuid references public.profiles(id) not null default auth.uid(),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table wallets enable row level security;

create policy "Group members can view wallets"
  on wallets for select
  to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group members can create wallets"
  on wallets for insert
  to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group admins can update wallets"
  on wallets for update
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = wallets.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create policy "Group admins can delete wallets"
  on wallets for delete
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = wallets.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create index wallets_group_id_idx on wallets(group_id);
create index wallets_created_by_idx on wallets(created_by);
