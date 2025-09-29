-- Drop the remaining policy that uses app_role
DROP POLICY IF EXISTS "Allow client_admin and super_admin access to roles" ON public.roles;

-- Remove default value temporarily
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Create new enum without 'moderator' and with 'author'
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Add back default value
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Recreate essential policies with updated enum
CREATE POLICY "Allow client_admin and super_admin access to departments" 
ON public.departments
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

CREATE POLICY "Anyone can view departments" 
ON public.departments
FOR SELECT 
USING (true);

CREATE POLICY "Super admins and authors can manage translation change log"
ON public.translation_change_log
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);