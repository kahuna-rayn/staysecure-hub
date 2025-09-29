-- Fix the has_role function by using different variable names internally
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id uuid := _user_id;
  target_role app_role := _role;
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
      AND ur.role = target_role
  );
END;
$$;