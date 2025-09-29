-- Recreate the has_role function with fully qualified table names
CREATE OR REPLACE FUNCTION public.has_role(user_id_param uuid, role_param app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE public.user_roles.user_id = user_id_param
      AND public.user_roles.role = role_param
  );
$$;