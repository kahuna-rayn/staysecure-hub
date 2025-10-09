-- Comprehensive fixes for flagged tables

-- ========================================
-- A) Secure user_learning_track_progress
-- ========================================
DROP POLICY IF EXISTS "Allow anonymous track progress management for development" ON public.user_learning_track_progress;
DROP POLICY IF EXISTS "Users can manage their own track progress" ON public.user_learning_track_progress;

-- Users: read/update their own progress
CREATE POLICY "Users can view their own learning progress"
ON public.user_learning_track_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress"
ON public.user_learning_track_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Managers: read progress for users in their managed departments
CREATE POLICY "Managers can view learning progress for their department users"
ON public.user_learning_track_progress
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), user_learning_track_progress.user_id)
);

-- Admins: full control
CREATE POLICY "Admins can manage all learning progress"
ON public.user_learning_track_progress
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

-- Service role can insert (background jobs)
CREATE POLICY "Service role can insert learning progress"
ON public.user_learning_track_progress
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);

-- ========================================
-- B) Secure customer_product_licenses
-- ========================================
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customer_product_licenses;

-- Admins only
CREATE POLICY "Admins can view customer product licenses"
ON public.customer_product_licenses
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Admins can manage customer product licenses"
ON public.customer_product_licenses
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

-- Ensure RLS enabled on both tables
ALTER TABLE public.user_learning_track_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_product_licenses ENABLE ROW LEVEL SECURITY;