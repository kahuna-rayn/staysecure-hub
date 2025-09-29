-- Enable RLS if not already enabled
ALTER TABLE public.user_profile_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_profile_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_profile_roles;
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_profile_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_profile_roles;

-- Create policies that allow admins to manage all user profile roles
CREATE POLICY "Super admins and client admins can manage all user profile roles"
ON public.user_profile_roles
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_profile_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view all roles if they have admin privileges
CREATE POLICY "Admins can view all user roles"
ON public.user_profile_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);