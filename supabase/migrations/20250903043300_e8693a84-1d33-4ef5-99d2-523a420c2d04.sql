-- Extend the app_role enum to include super_admin and client_admin
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_admin';

-- Migrate existing admin users to super_admin role
UPDATE public.user_roles 
SET role = 'super_admin'::app_role 
WHERE role = 'admin'::app_role;

-- Update RLS policies to handle new role hierarchy

-- Create helper function for checking admin roles
CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'client_admin'::app_role, 'admin'::app_role)
  );
$$;

-- Create helper function for checking super admin role specifically
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin'::app_role, 'admin'::app_role)
  );
$$;

-- Update lesson management policies to require super_admin
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
CREATE POLICY "Super admins can manage all lessons"
ON public.lessons
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Update lesson translation policies
DROP POLICY IF EXISTS "Admins can manage lesson translations" ON public.lesson_translations;
CREATE POLICY "Super admins can manage lesson translations"
ON public.lesson_translations
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Update lesson node translation policies
DROP POLICY IF EXISTS "Admins can manage lesson node translations" ON public.lesson_node_translations;
CREATE POLICY "Super admins can manage lesson node translations"
ON public.lesson_node_translations
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Update lesson nodes policies
DROP POLICY IF EXISTS "Admins can manage lesson nodes" ON public.lessons_nodes;
CREATE POLICY "Super admins can manage lesson nodes"
ON public.lesson_nodes
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Update lesson answers policies
DROP POLICY IF EXISTS "Admins can manage lesson answers" ON public.lesson_answers;
CREATE POLICY "Super admins can manage lesson answers"
ON public.lesson_answers
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Update learning tracks policies
DROP POLICY IF EXISTS "Admins can manage learning tracks" ON public.learning_tracks;
CREATE POLICY "Super admins can manage learning tracks"
ON public.learning_tracks
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Update learning track lessons policies
DROP POLICY IF EXISTS "Admins can manage track lessons" ON public.learning_track_lessons;
CREATE POLICY "Super admins can manage track lessons"
ON public.learning_track_lessons
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Keep admin access for assignments, analytics, reports, organisation, notifications, templates
-- These will work for both super_admin and client_admin through the is_admin_role function

-- Update assignments policies to use new admin function
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.learning_track_assignments;
CREATE POLICY "Admins can manage all assignments"
ON public.learning_track_assignments
FOR ALL
TO authenticated
USING (public.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage department assignments" ON public.learning_track_department_assignments;
CREATE POLICY "Admins can manage department assignments"
ON public.learning_track_department_assignments
FOR ALL
TO authenticated
USING (public.is_admin_role(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.learning_track_role_assignments;
CREATE POLICY "Admins can manage role assignments"
ON public.learning_track_role_assignments
FOR ALL
TO authenticated
USING (public.is_admin_role(auth.uid()));

-- Update organisation-related policies
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.is_admin_role(auth.uid()));

-- Update other admin policies to use the new function where appropriate
-- Email templates
DROP POLICY IF EXISTS "Allow admin users to manage email templates" ON public.email_templates;
CREATE POLICY "Allow admin users to manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (public.is_admin_role(auth.uid()));

-- Update has_role function to work with new roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role OR 
        (role = 'super_admin'::app_role AND _role = 'admin'::app_role) OR
        (role = 'client_admin'::app_role AND _role = 'admin'::app_role)
      )
  );
$$;