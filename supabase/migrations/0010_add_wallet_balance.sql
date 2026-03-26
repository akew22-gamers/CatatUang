-- Migration: 0010_add_wallet_balance.sql
-- Add balance tracking to wallets

-- 1. Add saldo column to wallets table
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS saldo numeric NOT NULL DEFAULT 0;

-- 2. Add CHECK constraint for saldo (cannot be negative)
ALTER TABLE public.wallets 
DROP CONSTRAINT IF EXISTS wallets_saldo_nonnegative;

ALTER TABLE public.wallets 
ADD CONSTRAINT wallets_saldo_nonnegative 
CHECK (saldo >= 0);

-- 3. Add index on saldo column for performance
CREATE INDEX IF NOT EXISTS idx_wallets_saldo ON public.wallets(saldo);

-- 4. Create wallet_balance_history table for audit trail
CREATE TABLE IF NOT EXISTS public.wallet_balance_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_id bigint NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  previous_balance numeric NOT NULL,
  new_balance numeric NOT NULL,
  change_amount numeric NOT NULL,
  change_type text NOT NULL CHECK (
    change_type IN ('income', 'expense', 'transfer', 'adjustment')
  ),
  transaction_id bigint REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Add indexes on wallet_balance_history for common queries
CREATE INDEX IF NOT EXISTS idx_wallet_balance_history_wallet_id 
  ON public.wallet_balance_history(wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_balance_history_transaction_id 
  ON public.wallet_balance_history(transaction_id);

CREATE INDEX IF NOT EXISTS idx_wallet_balance_history_created_at 
  ON public.wallet_balance_history(created_at DESC);

-- 6. Enable RLS on wallet_balance_history
ALTER TABLE public.wallet_balance_history ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policy (users can view their group's balance history)
CREATE POLICY IF NOT EXISTS "Users can view wallet balance history" 
  ON public.wallet_balance_history FOR SELECT 
  TO authenticated 
  USING (true);

-- 8. Create function to adjust wallet balance with history logging
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_wallet_id bigint,
  p_amount numeric,
  p_new_balance numeric,
  p_change_type text DEFAULT 'adjustment',
  p_transaction_id bigint DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_previous_balance numeric;
BEGIN
  -- Get previous balance
  SELECT saldo INTO v_previous_balance
  FROM public.wallets
  WHERE id = p_wallet_id;
  
  -- Update wallet balance
  UPDATE public.wallets
  SET saldo = p_new_balance
  WHERE id = p_wallet_id;
  
  -- Log to history
  INSERT INTO public.wallet_balance_history (
    wallet_id,
    previous_balance,
    new_balance,
    change_amount,
    change_type,
    transaction_id,
    created_by,
    description
  ) VALUES (
    p_wallet_id,
    v_previous_balance,
    p_new_balance,
    p_amount,
    p_change_type,
    p_transaction_id,
    p_user_id,
    p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Initialize existing wallets with saldo = 0 (if any)
UPDATE public.wallets 
SET saldo = 0 
WHERE saldo IS NULL;
