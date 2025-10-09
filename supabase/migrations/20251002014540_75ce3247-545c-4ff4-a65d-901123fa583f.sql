-- Drop foreign key constraint on account_inventory.user_id if it exists
-- This allows the user_id to be preserved for audit trail when profiles are deleted

DO $$ 
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'account_inventory_user_id_fkey' 
        AND table_name = 'account_inventory'
    ) THEN
        ALTER TABLE public.account_inventory 
        DROP CONSTRAINT account_inventory_user_id_fkey;
    END IF;
END $$;

-- Add a comment to document this is intentional for audit purposes
COMMENT ON COLUMN public.account_inventory.user_id IS 
'User ID preserved for audit trail. No foreign key constraint to allow orphaned records when users are deleted.';