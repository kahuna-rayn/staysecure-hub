-- Create the new enum first
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Add a new temporary column with the new enum type
ALTER TABLE public.user_roles ADD COLUMN role_new app_role_new;

-- Copy data from old column to new column (excluding 'moderator' values)
UPDATE public.user_roles 
SET role_new = CASE 
  WHEN role::text = 'moderator' THEN 'user'::app_role_new
  ELSE role::text::app_role_new
END;

-- Make the new column NOT NULL
ALTER TABLE public.user_roles ALTER COLUMN role_new SET NOT NULL;

-- Set default for new column
ALTER TABLE public.user_roles ALTER COLUMN role_new SET DEFAULT 'user'::app_role_new;

-- Drop the old column (this should remove all policy dependencies)
ALTER TABLE public.user_roles DROP COLUMN role;

-- Rename the new column to the original name
ALTER TABLE public.user_roles RENAME COLUMN role_new TO role;

-- Drop the old enum type
DROP TYPE public.app_role;

-- Rename the new enum type
ALTER TYPE public.app_role_new RENAME TO app_role;