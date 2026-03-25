create table categories (
  id bigint generated always as identity primary key,
  name text not null,
  group_id bigint references public.groups(id) on delete cascade,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table categories enable row level security;

create policy "Group members can view categories"
  on categories for select
  to authenticated
  using (
    group_id is null or
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group members can create categories"
  on categories for insert
  to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group admins can update categories"
  on categories for update
  to authenticated
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
  on categories for delete
  to authenticated
  using (
    group_id is null or
    exists (
      select 1 from group_members
      where group_id = categories.group_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
  );

create index categories_group_id_idx on categories(group_id);

-- Insert default "Umum" category for each new group
create or replace function public.create_default_category()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (name, group_id, is_default)
  values ('Umum', new.id, true);
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row
  execute procedure public.create_default_category();
