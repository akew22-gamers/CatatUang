-- Enable Supabase Realtime for all CatatUang tables
-- Realtime respects RLS policies by default

-- Add all tables to supabase_realtime publication
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_members;
alter publication supabase_realtime add table wallets;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table ai_confirmations;

-- Set replica identity for update tracking
alter table profiles replica identity using index profiles_pkey;
alter table groups replica identity using index groups_pkey;
alter table group_members replica identity using index group_members_pkey;
alter table wallets replica identity using index wallets_pkey;
alter table categories replica identity using index categories_pkey;
alter table transactions replica identity using index transactions_pkey;
alter table ai_confirmations replica identity using index ai_confirmations_pkey;

-- Verify: select * from pg_publication_tables where pubname = 'supabase_realtime';

-- Rollback: alter publication supabase_realtime drop table <table_name>;
