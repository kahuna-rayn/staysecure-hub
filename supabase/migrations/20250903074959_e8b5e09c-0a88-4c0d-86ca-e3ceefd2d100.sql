-- Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- Create new policies: client_admins and super_admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON profiles FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Users can only view profiles (including their own and others)
CREATE POLICY "Users can view all profiles" 
ON profiles FOR SELECT 
USING (true);