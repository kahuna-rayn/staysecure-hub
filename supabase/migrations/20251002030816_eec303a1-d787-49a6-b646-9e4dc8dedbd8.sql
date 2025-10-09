-- Remove foreign key constraint from account_inventory.user_id to allow historical preservation
-- This allows us to keep user_id values even after the user is deleted from auth.users
ALTER TABLE account_inventory 
DROP CONSTRAINT IF EXISTS account_inventory_user_id_fkey;

-- Add a comment to document this is intentional for audit purposes
COMMENT ON COLUMN account_inventory.user_id IS 'User ID preserved for audit trail. May reference deleted users. Cross-reference with user_deletion_audit table.';