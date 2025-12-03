-- Add 'author' role and remove 'moderator' role from app_role enum
ALTER TYPE public.app_role ADD VALUE 'author';

-- Remove 'moderator' from app_role enum (requires recreating the enum)
-- First, create a temporary enum without moderator
CREATE TYPE public.app_role_new AS ENUM ('admin', 'user', 'super_admin', 'client_admin', 'manager', 'author');

-- Update all tables using the old enum to use the new one
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Update the policy to use lowercase 'author' instead of 'Author'
DROP POLICY IF EXISTS "Super admins and authors can manage translation change log" ON public.translation_change_log;

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