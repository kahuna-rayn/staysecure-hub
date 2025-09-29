-- Comprehensive fix for Security Definer Views
-- Query system catalogs to find and fix views with SECURITY DEFINER

-- Use PostgreSQL system catalogs to find views with SECURITY DEFINER
-- and recreate them without SECURITY DEFINER

DO $$
DECLARE
    view_row RECORD;
    view_sql TEXT;
    new_view_sql TEXT;
BEGIN
    -- Find all views in public schema and check their definition
    FOR view_row IN 
        SELECT 
            schemaname,
            viewname,
            definition
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Check if the view definition contains SECURITY DEFINER
        IF view_row.definition ILIKE '%security_definer%' OR 
           view_row.definition ILIKE '%security definer%' THEN
            
            RAISE NOTICE 'Processing SECURITY DEFINER view: %.%', view_row.schemaname, view_row.viewname;
            
            -- Get the full view definition
            view_sql := view_row.definition;
            
            -- Remove SECURITY DEFINER from the definition
            new_view_sql := regexp_replace(view_sql, 'SECURITY\s+DEFINER\s*', '', 'gi');
            new_view_sql := regexp_replace(new_view_sql, 'SECURITY_DEFINER\s*', '', 'gi');
            
            -- Drop and recreate the view without SECURITY DEFINER
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_row.schemaname, view_row.viewname);
            EXECUTE format('CREATE VIEW %I.%I AS %s', view_row.schemaname, view_row.viewname, new_view_sql);
            
            RAISE NOTICE 'Recreated view %.% without SECURITY DEFINER', view_row.schemaname, view_row.viewname;
        END IF;
    END LOOP;
    
    -- Additional cleanup: Check for any materialized views or functions that might have SECURITY DEFINER
    -- and need attention (though these would be separate linter issues)
    
END $$;

-- Also ensure that any remaining views that might be causing issues are properly secured
-- by enabling RLS on any tables they reference (if not already enabled)

-- Create a comprehensive check for any views that might bypass RLS
DO $$
DECLARE
    table_row RECORD;
BEGIN
    -- Enable RLS on any public tables that don't have it enabled yet
    FOR table_row IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true
            AND t.schemaname = 'public'
        )
    LOOP
        -- Enable RLS on tables that don't have it
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', table_row.schemaname, table_row.tablename);
        RAISE NOTICE 'Enabled RLS on table: %.%', table_row.schemaname, table_row.tablename;
    END LOOP;
END $$;