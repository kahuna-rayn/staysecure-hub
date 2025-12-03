-- Set SECURITY INVOKER on all public views to fix Security Definer View issues
DO $$
DECLARE
  v RECORD;
BEGIN
  FOR v IN (
    SELECT schemaname, viewname
    FROM pg_views
    WHERE schemaname = 'public'
  ) LOOP
    BEGIN
      EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', v.schemaname, v.viewname);
      RAISE NOTICE 'Set security_invoker on view %.%', v.schemaname, v.viewname;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping view %.% due to: %', v.schemaname, v.viewname, SQLERRM;
    END;
  END LOOP;
END $$;