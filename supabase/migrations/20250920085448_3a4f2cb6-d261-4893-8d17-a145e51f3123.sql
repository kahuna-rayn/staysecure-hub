-- Drop all policies that use the app_role enum temporarily
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage all document assignments" ON public.document_assignments;
DROP POLICY IF EXISTS "Admins can manage document departments" ON public.document_departments;
DROP POLICY IF EXISTS "Admins can manage document roles" ON public.document_roles;
DROP POLICY IF EXISTS "Admins can manage document users" ON public.document_users;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can update certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can delete hardware" ON public.hardware;
DROP POLICY IF EXISTS "Admins can insert hardware" ON public.hardware;
DROP POLICY IF EXISTS "Admins can update hardware" ON public.hardware;
DROP POLICY IF EXISTS "Admins can view all hardware" ON public.hardware;
DROP POLICY IF EXISTS "Admin can manage hardware inventory" ON public.hardware_inventory;
DROP POLICY IF EXISTS "Admin can manage account inventory" ON public.account_inventory;
DROP POLICY IF EXISTS "Admins can manage breach management data" ON public.breach_management_team;
DROP POLICY IF EXISTS "Admins can manage breach team members" ON public.breach_team_members;
DROP POLICY IF EXISTS "Super and Client Admins can manage all CSBA answers" ON public.csba_answers;
DROP POLICY IF EXISTS "Super and Client Admins can manage CSBA questions" ON public.csba_master;
DROP POLICY IF EXISTS "Super and Client Admins can manage all key dates" ON public.key_dates;
DROP POLICY IF EXISTS "Super and Client Admins can manage languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.learning_track_assignments;
DROP POLICY IF EXISTS "Admins can manage department assignments" ON public.learning_track_department_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.learning_track_role_assignments;
DROP POLICY IF EXISTS "Admins can manage track lessons" ON public.learning_track_lessons;
DROP POLICY IF EXISTS "Admins can manage learning tracks" ON public.learning_tracks;
DROP POLICY IF EXISTS "Admins can manage lesson answer translations" ON public.lesson_answer_translations;
DROP POLICY IF EXISTS "Admins can manage lesson answers" ON public.lesson_answers;
DROP POLICY IF EXISTS "Admins can manage lesson node translations" ON public.lesson_node_translations;
DROP POLICY IF EXISTS "Privileged can manage lesson node translations" ON public.lesson_node_translations;
DROP POLICY IF EXISTS "Admins can manage lesson nodes" ON public.lesson_nodes;
DROP POLICY IF EXISTS "Admins can manage lesson translations" ON public.lesson_translations;
DROP POLICY IF EXISTS "Privileged can manage lesson translations" ON public.lesson_translations;
DROP POLICY IF EXISTS "Allow admin users to manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Super admins and authors can manage translation change log" ON public.translation_change_log;

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