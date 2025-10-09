-- Add RLS policies for learning_track_department_assignments
CREATE POLICY "Admins can manage department learning track assignments"
ON public.learning_track_department_assignments
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

CREATE POLICY "Managers can view department learning track assignments"
ON public.learning_track_department_assignments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM user_departments ud
    WHERE ud.department_id = learning_track_department_assignments.department_id
    AND is_user_in_managed_department(auth.uid(), ud.user_id)
  )
);

-- Add RLS policies for learning_track_role_assignments
CREATE POLICY "Admins can manage role learning track assignments"
ON public.learning_track_role_assignments
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

CREATE POLICY "Users can view role learning track assignments for their roles"
ON public.learning_track_role_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profile_roles upr
    WHERE upr.role_id = learning_track_role_assignments.role_id
    AND upr.user_id = auth.uid()
  )
);