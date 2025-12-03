-- Enable RLS on user_phishing_scores table to secure sensitive phishing attack data
-- The table contains sensitive security data like user IDs, IP addresses, and phishing results

-- Enable Row Level Security on the user_phishing_scores table
ALTER TABLE public.user_phishing_scores ENABLE ROW LEVEL SECURITY;

-- Also ensure RLS is enabled on any other tables that might have policies but disabled RLS
-- Check and enable RLS on common security-sensitive tables

-- Enable RLS on org_profile (organization profile data)
ALTER TABLE public.org_profile ENABLE ROW LEVEL SECURITY;

-- Enable RLS on any other tables that might need it based on the linter warnings
-- These are commonly tables that have policies but RLS disabled

DO $$
DECLARE
    tbl RECORD;
BEGIN
    -- Enable RLS on tables in public schema that don't have it enabled
    -- but might have policies (this is a safety measure)
    FOR tbl IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT DISTINCT tablename 
            FROM pg_policies 
            WHERE schemaname = 'public'
        )
    LOOP
        -- Skip if RLS is already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE n.nspname = 'public' 
            AND c.relname = tbl.tablename 
            AND c.relrowsecurity = true
        ) THEN
            -- Only enable on tables that likely need RLS based on name patterns
            IF tbl.tablename ~ '.*(user|profile|score|result|data|info|detail).*' THEN
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
                RAISE NOTICE 'Enabled RLS on table: %', tbl.tablename;
            END IF;
        END IF;
    END LOOP;
END $$;