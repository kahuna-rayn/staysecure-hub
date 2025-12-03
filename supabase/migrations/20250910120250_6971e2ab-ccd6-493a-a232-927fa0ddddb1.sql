-- Update user_departments RLS policy to allow super_admin and client_admin roles
DROP POLICY IF EXISTS "Admins can manage user departments" ON public.user_departments;

CREATE POLICY "Admins can manage user departments" 
ON public.user_departments 
FOR ALL 
TO public 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
) 
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);