-- Post-Migration Fixes
-- This file contains fixes that need to be applied after schema restoration
-- but aren't included in the main schema dump
--
-- Apply this file after running onboard-client.sh or schema restoration

-- Set search path to ensure we're using the public schema
SET search_path = public;

-- Ensure app_role type exists (should be in schema dump, but check to be safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'app_role type does not exist. Schema restoration may have failed. Please ensure backups/schema.dump was restored successfully.';
    END IF;
END $$;

-- ========================================
-- Fix: learning_tracks RLS Policies
-- ========================================
-- NOTE: These policies ARE in the schema.dump, but kept here as safety net
-- The UPDATE policy was missing WITH CHECK clause which is required for UPDATE operations
-- Issue: "failed to save learning track" error when saving learning tracks
-- Date: 2025-11-03

-- Drop and recreate the UPDATE policy with both USING and WITH CHECK clauses
DROP POLICY IF EXISTS "Super admins and authors can update learning tracks" ON public.learning_tracks;

CREATE POLICY "Super admins and authors can update learning tracks" 
ON public.learning_tracks 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::public.app_role) OR 
  has_role(auth.uid(), 'author'::public.app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::public.app_role) OR 
  has_role(auth.uid(), 'author'::public.app_role)
);

-- Ensure SELECT policy exists for reading learning tracks
-- This allows super admins and authors to view tracks, and all authenticated users to view published tracks
DROP POLICY IF EXISTS "Super admins and authors can view all learning tracks" ON public.learning_tracks;

CREATE POLICY "Super admins and authors can view all learning tracks"
ON public.learning_tracks 
FOR SELECT 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::public.app_role) OR 
  has_role(auth.uid(), 'author'::public.app_role) OR
  status = 'published'
);

-- ========================================
-- Fix: Profile Creation via Trigger
-- ========================================
-- Ensure handle_new_user function can insert profiles via trigger
-- These are required for user creation workflow
-- Date: Applied during onboarding (original setup)

-- Ensure handle_new_user function is owned by postgres (for SECURITY DEFINER to work correctly)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant INSERT permission to postgres role (for SECURITY DEFINER functions)
GRANT INSERT ON public.profiles TO postgres;

-- Grant permissions to service_role for edge functions (if not already restored from dump)
-- Service role needs USAGE on schema and SELECT/INSERT on profiles for create-user edge function
-- Note: These should be included in schema.dump now, but kept here as fallback
DO $$
BEGIN
    -- Only grant if not already granted (to avoid errors on re-runs)
    IF NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'service_role'
    ) THEN
        RAISE NOTICE 'service_role does not exist, skipping grants';
    ELSE
        GRANT USAGE ON SCHEMA public TO service_role;
        GRANT SELECT, INSERT ON public.profiles TO service_role;
        GRANT SELECT, INSERT ON public.account_inventory TO service_role;
        GRANT SELECT ON public.user_roles TO service_role;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if permissions already exist
    NULL;
END $$;

-- Create RLS policy to allow trigger inserts
-- Policy applies to all roles, GRANT is what gives postgres permission
DROP POLICY IF EXISTS "System can insert profiles via trigger" ON public.profiles;
CREATE POLICY "System can insert profiles via trigger" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- ========================================
-- Fix: Anon Role Permissions
-- ========================================
-- NOTE: This grant IS in the schema.dump (GRANT ALL), but kept here as safety net
-- Grant necessary permissions for anon role to access public tables
-- Date: Applied during onboarding (original setup)

-- Grant SELECT permission on languages table for public access
GRANT SELECT ON public.languages TO anon;

-- ========================================
-- Fix: Auth Users Trigger
-- ========================================
-- Create trigger on auth.users to fire handle_new_user function when new users are created
-- Date: Applied during onboarding (original setup)

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- Fix: Storage Bucket Policies for Lesson Media Uploads
-- ========================================
-- The avatars bucket is used for lesson media uploads (lesson-media/ path)
-- Issue: "Failed to upload media file" error when uploading in lesson editor
-- Date: 2025-11-03
--
-- Note: Storage bucket policies use the storage.objects table
-- These policies allow super_admins and authors to upload/download lesson media

-- Ensure the avatars bucket exists (this should be created during schema setup, but verify)
-- If bucket doesn't exist, it needs to be created manually via Supabase Dashboard or API

-- Storage bucket policies for avatars bucket (lesson-media path)
-- Note: Use public.has_role() since storage.objects is in storage schema and function is in public schema

-- Allow super_admins and authors to upload lesson media
DROP POLICY IF EXISTS "Super admins and authors can upload lesson media" ON storage.objects;
CREATE POLICY "Super admins and authors can upload lesson media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (name)::text LIKE 'lesson-media/%' AND
  (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'author'::public.app_role))
);

-- Allow super_admins and authors to read lesson media
DROP POLICY IF EXISTS "Super admins and authors can read lesson media" ON storage.objects;
CREATE POLICY "Super admins and authors can read lesson media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name)::text LIKE 'lesson-media/%' AND
  (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'author'::public.app_role))
);

-- Allow all authenticated users to read lesson media (for viewing lessons)
DROP POLICY IF EXISTS "Authenticated users can read lesson media" ON storage.objects;
CREATE POLICY "Authenticated users can read lesson media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name)::text LIKE 'lesson-media/%'
);

-- Allow super_admins and authors to delete lesson media
DROP POLICY IF EXISTS "Super admins and authors can delete lesson media" ON storage.objects;
CREATE POLICY "Super admins and authors can delete lesson media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name)::text LIKE 'lesson-media/%' AND
  (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'author'::public.app_role))
);

-- Allow super_admins and authors to update lesson media
DROP POLICY IF EXISTS "Super admins and authors can update lesson media" ON storage.objects;
CREATE POLICY "Super admins and authors can update lesson media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name)::text LIKE 'lesson-media/%' AND
  (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'author'::public.app_role))
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (name)::text LIKE 'lesson-media/%' AND
  (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'author'::public.app_role))
);

-- ========================================
-- Fix: Secure Views in Public Schema (Security Issue)
-- ========================================
-- NOTE: These grants MAY be in the schema.dump, but kept here as safety net
-- Views in public schema are accessible via Supabase API
-- Issue: Views in public schema are exposed via PostgREST API and may bypass RLS
-- Date: 2025-01-XX
--
-- Views that need securing:
-- - CSBA views (aggregate assessment data - most sensitive):
--   - csba_assessment_summary_view
--   - csba_detailed_insights_view
--   - csba_domain_score_view
--   - csba_key_insights_view
-- - Other views:
--   - daily_notification_summary
--   - learning_template_variables
--   - template_performance
--   - template_variables_by_category
--
-- These views query tables which have RLS enabled, but views don't automatically
-- inherit RLS when accessed via PostgREST API.
-- Solution: Revoke public/anon access and grant only to authenticated users.
-- The underlying tables' RLS policies will still apply.

-- Revoke public/anon access from all views
REVOKE ALL ON public.csba_assessment_summary_view FROM anon, public;
REVOKE ALL ON public.csba_detailed_insights_view FROM anon, public;
REVOKE ALL ON public.csba_domain_score_view FROM anon, public;
REVOKE ALL ON public.csba_key_insights_view FROM anon, public;
REVOKE ALL ON public.daily_notification_summary FROM anon, public;
REVOKE ALL ON public.learning_template_variables FROM anon, public;
REVOKE ALL ON public.template_performance FROM anon, public;
REVOKE ALL ON public.template_variables_by_category FROM anon, public;

-- Grant SELECT only to authenticated role
-- This ensures only authenticated users can access via API
-- The underlying tables' RLS policies will filter the data appropriately
GRANT SELECT ON public.csba_assessment_summary_view TO authenticated;
GRANT SELECT ON public.csba_detailed_insights_view TO authenticated;
GRANT SELECT ON public.csba_domain_score_view TO authenticated;
GRANT SELECT ON public.csba_key_insights_view TO authenticated;
GRANT SELECT ON public.daily_notification_summary TO authenticated;
GRANT SELECT ON public.learning_template_variables TO authenticated;
GRANT SELECT ON public.template_performance TO authenticated;
GRANT SELECT ON public.template_variables_by_category TO authenticated;

-- Note: If you need to allow service_role access (for edge functions),
-- add: GRANT SELECT ON public.<view_name> TO service_role;

-- ========================================
-- Fix: Foreign Key Constraints (Safety Net)
-- ========================================
-- Foreign keys ARE in the schema.dump, but pg_restore may not apply them correctly
-- This section ensures all foreign keys are applied even if restore misses them
-- Date: 2025-01-XX
--
-- Note: These are extracted from schema.dump and should match what's in the dump
-- We use DO blocks to handle errors gracefully - if constraints already exist, they'll be skipped

DO $$
BEGIN
    -- Apply foreign keys with error handling
    -- Wrap each in a separate DO block so one failure doesn't stop the rest
    BEGIN
        ALTER TABLE ONLY public.account_inventory ADD CONSTRAINT account_inventory_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES public.profiles(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.breach_management_team ADD CONSTRAINT breach_management_team_member_fkey FOREIGN KEY (member) REFERENCES public.profiles(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.csba_answers ADD CONSTRAINT csba_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.csba_master(question_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.csba_answers ADD CONSTRAINT csba_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.customer_product_licenses ADD CONSTRAINT customer_product_licenses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.customer_product_licenses ADD CONSTRAINT customer_product_licenses_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.departments ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.document_assignments ADD CONSTRAINT document_assignments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.document_departments ADD CONSTRAINT document_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.document_departments ADD CONSTRAINT document_departments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.document_roles ADD CONSTRAINT document_roles_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.document_roles ADD CONSTRAINT document_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.document_users ADD CONSTRAINT document_users_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.email_layouts ADD CONSTRAINT email_layouts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.email_notifications ADD CONSTRAINT email_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.email_preferences ADD CONSTRAINT email_preferences_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.email_preferences ADD CONSTRAINT email_preferences_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.email_templates ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.email_templates ADD CONSTRAINT email_templates_layout_id_fkey FOREIGN KEY (layout_id) REFERENCES public.email_layouts(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.user_profile_roles ADD CONSTRAINT fk_user_profile_roles_role_id FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.user_profile_roles ADD CONSTRAINT fk_user_profile_roles_user_id FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_answer_translations ADD CONSTRAINT lesson_answer_translations_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.lesson_answers(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_answer_translations ADD CONSTRAINT lesson_answer_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES public.languages(code);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_answer_translations ADD CONSTRAINT lesson_answer_translations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_answer_translations ADD CONSTRAINT lesson_answer_translations_translated_by_fkey FOREIGN KEY (translated_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_node_translations ADD CONSTRAINT lesson_node_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES public.languages(code);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_node_translations ADD CONSTRAINT lesson_node_translations_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.lesson_nodes(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_node_translations ADD CONSTRAINT lesson_node_translations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_node_translations ADD CONSTRAINT lesson_node_translations_translated_by_fkey FOREIGN KEY (translated_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_translations ADD CONSTRAINT lesson_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES public.languages(code);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_translations ADD CONSTRAINT lesson_translations_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_translations ADD CONSTRAINT lesson_translations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE ONLY public.lesson_translations ADD CONSTRAINT lesson_translations_translated_by_fkey FOREIGN KEY (translated_by) REFERENCES auth.users(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    -- Apply remaining foreign keys (all 94 total)
    -- Note: The above covers the most critical translation-related ones
    -- Additional foreign keys are applied via foreign_keys.sql file (see onboarding script)
END $$;


-- ========================================
-- Add more post-migration fixes below
-- ========================================

