-- First, create the new enum
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Add temporary column to user_roles
ALTER TABLE public.user_roles ADD COLUMN role_new app_role_new;

-- Copy data, converting 'moderator' to 'user' 
UPDATE public.user_roles 
SET role_new = CASE 
  WHEN role::text = 'moderator' THEN 'user'::app_role_new
  ELSE role::text::app_role_new
END;

-- Set constraints on new column
ALTER TABLE public.user_roles ALTER COLUMN role_new SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN role_new SET DEFAULT 'user'::app_role_new;

-- Drop the old role column and all its dependencies using CASCADE
ALTER TABLE public.user_roles DROP COLUMN role CASCADE;

-- Rename the new column
ALTER TABLE public.user_roles RENAME COLUMN role_new TO role;

-- Drop old enum and rename new one
DROP TYPE public.app_role CASCADE;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Recreate the essential has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid := _user_id;
  target_role app_role := _role;
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
      AND ur.role = target_role
  );
END;
$$;

-- Recreate the get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;