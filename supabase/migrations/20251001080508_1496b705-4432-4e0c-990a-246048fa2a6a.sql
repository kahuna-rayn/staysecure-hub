-- Update learning_track_assignments policy to use super_admin instead of admin
DROP POLICY IF EXISTS "Admins can create learning track assignments" ON public.learning_track_assignments;

CREATE POLICY "Admins can create learning track assignments"
ON public.learning_track_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Create helper function to check if a user is in a manager's primary department
CREATE OR REPLACE FUNCTION public.is_user_in_managed_department(_manager_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_departments ud
    WHERE ud.user_id = _user_id
      AND ud.is_primary = true
      AND ud.department_id IN (
        SELECT id FROM departments WHERE manager_id = _manager_id
      )
  );
END;
$$;

-- Manager policies for hardware_inventory
CREATE POLICY "Managers can view hardware for their department users"
ON public.hardware_inventory
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.full_name = hardware_inventory.asset_owner
      AND is_user_in_managed_department(auth.uid(), p.id)
  )
);

-- Manager policies for account_inventory
CREATE POLICY "Managers can view accounts for their department users"
ON public.account_inventory
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  account_inventory.user_id IS NOT NULL AND
  is_user_in_managed_department(auth.uid(), account_inventory.user_id)
);

-- Manager policies for profiles
CREATE POLICY "Managers can view profiles in their departments"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), profiles.id)
);

-- Manager policies for certificates
CREATE POLICY "Managers can view certificates for their department users"
ON public.certificates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), certificates.user_id)
);

-- Manager policies for user_departments
CREATE POLICY "Managers can view department assignments for their departments"
ON public.user_departments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  department_id IN (
    SELECT id FROM departments WHERE manager_id = auth.uid()
  )
);

-- Manager policies for document_assignments
CREATE POLICY "Managers can view document assignments for their department users"
ON public.document_assignments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), document_assignments.user_id)
);

-- Manager policies for hardware table
CREATE POLICY "Managers can view hardware for their department users"
ON public.hardware
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), hardware.user_id)
);

-- Manager policies for learning_track_assignments
CREATE POLICY "Managers can view learning track assignments for their department users"
ON public.learning_track_assignments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_user_in_managed_department(auth.uid(), learning_track_assignments.user_id)
);