-- Update RLS policies for learning_track_assignments to include client_admin
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.learning_track_assignments;

CREATE POLICY "Admins can manage all assignments" 
ON public.learning_track_assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Update RLS policies for learning_track_department_assignments to include client_admin
DROP POLICY IF EXISTS "Admins can manage department assignments" ON public.learning_track_department_assignments;

CREATE POLICY "Admins can manage department assignments" 
ON public.learning_track_department_assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Update RLS policies for learning_track_role_assignments to include client_admin
DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.learning_track_role_assignments;

CREATE POLICY "Admins can manage role assignments" 
ON public.learning_track_role_assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);