-- Drop all policies that depend on the role column
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage breach management data" ON public.breach_management_team;
DROP POLICY IF EXISTS "Admins can manage breach team members" ON public.breach_team_members;
DROP POLICY IF EXISTS "Admins can manage lesson translations" ON public.lesson_translations;
DROP POLICY IF EXISTS "Admins can manage lesson node translations" ON public.lesson_node_translations;
DROP POLICY IF EXISTS "Allow admin users to manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to roles" ON public.roles;
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage lesson answer translations" ON public.lesson_answer_translations;
DROP POLICY IF EXISTS "Privileged can manage lesson translations" ON public.lesson_translations;
DROP POLICY IF EXISTS "Privileged can manage lesson node translations" ON public.lesson_node_translations;
DROP POLICY IF EXISTS "Admins can manage all quiz attempts" ON public.quiz_attempts;

-- Now create the new enum and update the column
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Add temporary column
ALTER TABLE public.user_roles ADD COLUMN role_new app_role_new;

-- Copy data, converting 'moderator' to 'user'
UPDATE public.user_roles 
SET role_new = CASE 
  WHEN role::text = 'moderator' THEN 'user'::app_role_new
  ELSE role::text::app_role_new
END;

-- Make new column NOT NULL with default
ALTER TABLE public.user_roles ALTER COLUMN role_new SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN role_new SET DEFAULT 'user'::app_role_new;

-- Drop old column and rename new one
ALTER TABLE public.user_roles DROP COLUMN role;
ALTER TABLE public.user_roles RENAME COLUMN role_new TO role;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;