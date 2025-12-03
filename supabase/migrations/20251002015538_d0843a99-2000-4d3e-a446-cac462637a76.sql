-- Change created_by from text to uuid and fix user_id preservation
-- Step 1: Drop the trigger first
DROP TRIGGER IF EXISTS before_account_inventory_insert ON public.account_inventory;

-- Step 2: Drop the function (now safe since trigger is gone)
DROP FUNCTION IF EXISTS public.set_account_inventory_created_by();

-- Step 3: Add new created_by_uuid column
ALTER TABLE public.account_inventory ADD COLUMN IF NOT EXISTS created_by_uuid uuid;

-- Step 4: Drop the old created_by text column
ALTER TABLE public.account_inventory DROP COLUMN IF EXISTS created_by;

-- Step 5: Rename the new column to created_by
ALTER TABLE public.account_inventory RENAME COLUMN created_by_uuid TO created_by;

-- Step 6: Update the modified_by column to also be uuid if it isn't already
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'account_inventory' 
        AND column_name = 'modified_by' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE public.account_inventory ADD COLUMN modified_by_uuid uuid;
        ALTER TABLE public.account_inventory DROP COLUMN modified_by;
        ALTER TABLE public.account_inventory RENAME COLUMN modified_by_uuid TO modified_by;
    END IF;
END $$;

-- Step 7: Add default for created_by to use the authenticated user if not explicitly set
ALTER TABLE public.account_inventory 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Step 8: Ensure user_id has no cascade behavior (add comment for clarity)
COMMENT ON COLUMN public.account_inventory.user_id IS 
'User ID preserved for audit trail. No foreign key constraint to prevent deletion when user is removed.';

COMMENT ON COLUMN public.account_inventory.created_by IS 
'UUID of the user who created this account record (either via bulk upload or manual creation).';