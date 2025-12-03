-- Disable RLS temporarily to avoid policy conflicts
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Remove default value
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Drop all existing policies that use has_role function
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to departments" ON public.departments;
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to roles" ON public.roles;
DROP POLICY IF EXISTS "Super and Client Admins can manage all CSBA answers" ON public.csba_answers;
DROP POLICY IF EXISTS "Super and Client Admins can manage CSBA questions" ON public.csba_master;
DROP POLICY IF EXISTS "Super and Client Admins can manage all key dates" ON public.key_dates;
DROP POLICY IF EXISTS "Super and Client Admins can manage languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.learning_track_assignments;
DROP POLICY IF EXISTS "Admins can manage department assignments" ON public.learning_track_department_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.learning_track_role_assignments;
DROP POLICY IF EXISTS "Super admins and authors can manage translation change log" ON public.translation_change_log;

-- Create new enum
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Update the table
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;

-- Drop old enum and rename
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Re-enable RLS and add default
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Recreate essential policies
CREATE POLICY "Allow client_admin and super_admin access to departments" 
ON public.departments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

CREATE POLICY "Anyone can view departments" 
ON public.departments FOR SELECT 
USING (true);

CREATE POLICY "Super admins and authors can manage translation change log"
ON public.translation_change_log FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'author'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'author'::app_role));