-- Profiles RLS
create policy "Users can view own profile"
  on profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Groups RLS
create policy "Group members can view groups"
  on groups for select to authenticated
  using (
    id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Users can create groups"
  on groups for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Group owners can update groups"
  on groups for update to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

create policy "Group owners can delete groups"
  on groups for delete to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

-- Group Members RLS
create policy "Members can view group members"
  on group_members for select to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Owners/admins can add members"
  on group_members for insert to authenticated
  with check (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
    )
  );

create policy "Users can leave groups"
  on group_members for delete to authenticated
  using (auth.uid() = user_id);

create policy "Owners can remove members"
  on group_members for delete to authenticated
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
    )
  );

-- Wallets RLS
create policy "Group members can view wallets"
  on wallets for select to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group members can create wallets"
  on wallets for insert to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group admins can update wallets"
  on wallets for update to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = wallets.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create policy "Group admins can delete wallets"
  on wallets for delete to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = wallets.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Categories RLS
create policy "Group members can view categories"
  on categories for select to authenticated
  using (
    group_id is null or
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group members can create categories"
  on categories for insert to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group admins can update categories"
  on categories for update to authenticated
  using (
    group_id is null or
    exists (
      select 1 from group_members
      where group_id = categories.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create policy "Group admins can delete categories"
  on categories for delete to authenticated
  using (
    group_id is null or
    exists (
      select 1 from group_members
      where group_id = categories.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

-- Transactions RLS
create policy "Group members can view transactions"
  on transactions for select to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group members can create transactions"
  on transactions for insert to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update own transactions"
  on transactions for update to authenticated
  using (created_by = auth.uid());

create policy "Users can delete own transactions"
  on transactions for delete to authenticated
  using (created_by = auth.uid());

-- AI Confirmations RLS
create policy "Users can view own confirmations"
  on ai_confirmations for select to authenticated
  using (user_id = auth.uid());

create policy "Users can create own confirmations"
  on ai_confirmations for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own confirmations"
  on ai_confirmations for update to authenticated
  using (user_id = auth.uid());
