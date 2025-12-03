-- Drop ALL policies on departments table
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to departments" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;

-- Drop ALL policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only super admins can modify roles" ON public.user_roles;

-- Now disable RLS on user_roles and update the enum
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Create the new enum with 'author' and without 'moderator'
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Update the column type
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Re-enable RLS and restore default
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Recreate basic policies
CREATE POLICY "Anyone can view departments" 
ON public.departments FOR SELECT 
USING (true);

CREATE POLICY "Super admins and client admins can manage departments" 
ON public.departments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));