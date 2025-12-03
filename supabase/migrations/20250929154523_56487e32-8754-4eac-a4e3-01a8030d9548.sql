-- Add missing INSERT policy for learning_track_assignments table
-- This allows admins to create assignments for users
CREATE POLICY "Admins can create learning track assignments" 
ON public.learning_track_assignments 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);