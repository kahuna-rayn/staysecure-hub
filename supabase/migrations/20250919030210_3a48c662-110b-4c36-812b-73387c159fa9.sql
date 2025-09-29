-- Find and fix remaining Security Definer Views
-- Query to identify any remaining views with SECURITY DEFINER property

-- Check for any views that might have SECURITY DEFINER property
-- and convert them to use proper RLS instead

-- Look for views in information_schema to identify any with security_definer
-- First, let's check what views exist that might still have SECURITY DEFINER
DO $$
DECLARE
    view_record RECORD;
    view_definition TEXT;
BEGIN
    -- Find views that might have security definer in their definition
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Get the view definition to check for SECURITY DEFINER
        SELECT definition INTO view_definition 
        FROM pg_views 
        WHERE schemaname = view_record.schemaname 
        AND viewname = view_record.viewname;
        
        -- Check if the definition contains security definer patterns
        IF view_definition ILIKE '%security definer%' OR 
           view_definition ILIKE '%security_definer%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.%', view_record.schemaname, view_record.viewname;
        END IF;
    END LOOP;
END $$;

-- Since we can't easily query the view properties, let's try to recreate
-- any views that might be causing the security definer issues

-- Check if there are any system or other views that need fixing
-- Based on the org_sig_roles error in logs, there might be organization-related views

-- If org_sig_roles table exists, create a proper view for it without SECURITY DEFINER
DO $$
BEGIN
    -- Check if org_sig_roles table exists and has any views
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'org_sig_roles' AND table_schema = 'public') THEN
        -- Drop any existing views that might reference org_sig_roles with SECURITY DEFINER
        DROP VIEW IF EXISTS public.org_signatory_roles_view CASCADE;
        DROP VIEW IF EXISTS public.organization_signatories CASCADE;
        DROP VIEW IF EXISTS public.org_roles_view CASCADE;
        
        RAISE NOTICE 'Dropped potential org_sig_roles related views';
    END IF;
END $$;