-- Fix user_departments table security - Remove anonymous access

-- Drop the dangerous anonymous access policy
DROP POLICY IF EXISTS "Allow anonymous access to user departments for testing" ON public.user_departments;

-- Drop duplicate user policies and consolidate
DROP POLICY IF EXISTS "Users can view their own departments" ON public.user_departments;
DROP POLICY IF EXISTS "Users can view their own department assignments" ON public.user_departments;

-- Create consolidated user policy (requires authentication)
CREATE POLICY "Users can view their own department assignments"
ON public.user_departments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own department assignments (e.g., set is_primary)
CREATE POLICY "Users can update their own department assignments"
ON public.user_departments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- The existing policies remain and are secure:
-- "Managers can view department assignments for their departments" - already exists
-- "Admins can manage user departments" - already exists

-- Ensure RLS is enabled
ALTER TABLE public.user_departments ENABLE ROW LEVEL SECURITY;

-- Add a comment for documentation
COMMENT ON TABLE public.user_departments IS 'Department assignments for users. RLS policies ensure users can only see their own assignments, managers see their department members, and admins see all.';