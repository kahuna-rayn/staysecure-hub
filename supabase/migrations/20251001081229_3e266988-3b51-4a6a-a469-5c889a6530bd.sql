-- Fix all four security issues identified in the security scan

-- ========================================
-- 1. FIX CUSTOMERS TABLE - Remove public access
-- ========================================
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;

-- Only super admins and client admins can view customer data
CREATE POLICY "Admins can view customer data"
ON public.customers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Admins can manage customer data
CREATE POLICY "Admins can manage customer data"
ON public.customers
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

-- ========================================
-- 2. FIX PROFILES TABLE - Remove overly permissive policy
-- ========================================
-- Drop the policy that allows ANY authenticated user to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Note: The correct policies we created earlier are already in place:
-- - Users can view their own profile
-- - Managers can view profiles in their departments
-- - Super admins can view/manage all profiles

-- ========================================
-- 3. FIX ORG_PROFILE TABLE - Restrict access to organizational data
-- ========================================
-- Enable RLS if not already enabled
ALTER TABLE public.org_profile ENABLE ROW LEVEL SECURITY;

-- Only super admins and client admins can view org profile
CREATE POLICY "Admins can view org profile"
ON public.org_profile
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Admins can manage org profile
CREATE POLICY "Admins can manage org profile"
ON public.org_profile
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

-- ========================================
-- 4. FIX USER_PHISHING_SCORES TABLE - Restrict access to security data
-- ========================================
-- Enable RLS if not already enabled
ALTER TABLE public.user_phishing_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own phishing scores
CREATE POLICY "Users can view their own phishing scores"
ON public.user_phishing_scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all phishing scores
CREATE POLICY "Admins can view all phishing scores"
ON public.user_phishing_scores
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Admins can manage phishing scores
CREATE POLICY "Admins can manage phishing scores"
ON public.user_phishing_scores
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

-- Managers can view phishing scores for users in their departments
CREATE POLICY "Managers can view phishing scores for their department users"
ON public.user_phishing_scores
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), user_phishing_scores.user_id)
);