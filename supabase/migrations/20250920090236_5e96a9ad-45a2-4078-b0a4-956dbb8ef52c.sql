-- Find and drop all policies that might reference app_role
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    -- Get all policies and drop them if they reference has_role function
    FOR pol_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE definition LIKE '%has_role%' OR definition LIKE '%app_role%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol_record.policyname, 
                      pol_record.schemaname, 
                      pol_record.tablename);
    END LOOP;
END $$;

-- Remove default value temporarily
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Create new enum without 'moderator' and with 'author'
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Add back default value
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;