-- Fix RLS policies for user_profile_roles table
DROP POLICY IF EXISTS "Admins can manage user profile roles" ON public.user_profile_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_profile_roles;

CREATE POLICY "Admins can manage user profile roles"
ON public.user_profile_roles
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Users can view their own roles"
ON public.user_profile_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Fix RLS policies for user_departments table
DROP POLICY IF EXISTS "Admins can manage user departments" ON public.user_departments;
DROP POLICY IF EXISTS "Users can view their own departments" ON public.user_departments;

CREATE POLICY "Admins can manage user departments"
ON public.user_departments
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Users can view their own departments"
ON public.user_departments
FOR SELECT
USING (auth.uid() = user_id);

-- Fix RLS policies for roles table
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;

CREATE POLICY "Admins can manage roles"
ON public.roles
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Anyone can view roles"
ON public.roles
FOR SELECT
USING (true);

-- Fix RLS policies for departments table
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;

CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);