-- Temporarily disable RLS on all tables that might have policies using app_role
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.breach_management_team DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.breach_team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_department_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_role_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_track_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_answer_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_node_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_translations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.csba_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.csba_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_change_log DISABLE ROW LEVEL SECURITY;

-- Remove default from user_roles
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Create new enum and update
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Add back default
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;