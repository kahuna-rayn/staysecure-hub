-- Fix profiles table RLS policies to prevent unauthorized access to employee data

-- First, drop any existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Policy 4: Super admins can manage all profiles (insert, update, delete)
CREATE POLICY "Super admins can manage all profiles"
ON public.profiles
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

-- The existing manager policy remains:
-- "Managers can view profiles in their departments" - already exists from previous migration

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ensure the profiles table user_id column is NOT nullable to prevent security issues
-- This is critical for RLS policies to work correctly
-- Note: We're checking the 'id' column which references auth.users(id)
DO $$
BEGIN
  -- Add a check to ensure id column is properly constrained
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_not_null' 
    AND table_name = 'profiles'
  ) THEN
    -- The id column should already be NOT NULL from the table creation
    -- This is just a safety check
    ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
  END IF;
END $$;