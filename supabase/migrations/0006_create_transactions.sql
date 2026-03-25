create table transactions (
  id bigint generated always as identity primary key,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric not null check (amount > 0),
  description text not null,
  transaction_date timestamptz not null default timezone('utc'::text, now()),
  
  -- For income/expense
  wallet_id bigint references public.wallets(id),
  category_id bigint references public.categories(id),
  
  -- For transfer
  from_wallet_id bigint references public.wallets(id),
  to_wallet_id bigint references public.wallets(id),
  
  -- Metadata
  created_by uuid references public.profiles(id) not null default auth.uid(),
  group_id bigint references public.groups(id) on delete cascade not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  
  -- Validation constraints
  constraint check_income_expense_wallet
    check ((type in ('income', 'expense') and wallet_id is not null) or type = 'transfer'),
  constraint check_transfer_wallets
    check (type = 'transfer' and from_wallet_id is not null and to_wallet_id is not null),
  constraint check_not_both_wallets
    check (type in ('income', 'expense') or (from_wallet_id is null and to_wallet_id is null))
);

alter table transactions enable row level security;

create policy "Group members can view transactions"
  on transactions for select
  to authenticated
  using (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Group members can create transactions"
  on transactions for insert
  to authenticated
  with check (
    group_id in (
      select group_id from group_members
      where user_id = auth.uid()
    )
  );

create policy "Users can update own transactions"
  on transactions for update
  to authenticated
  using (created_by = auth.uid());

create policy "Users can delete own transactions"
  on transactions for delete
  to authenticated
  using (created_by = auth.uid());

-- Indexes for performance
create index transactions_group_id_idx on transactions(group_id);
create index transactions_created_by_idx on transactions(created_by);
create index transactions_type_idx on transactions(type);
create index transactions_date_idx on transactions(transaction_date);
create index transactions_wallet_id_idx on transactions(wallet_id);
create index transactions_category_id_idx on transactions(category_id);
