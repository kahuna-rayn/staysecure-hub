-- Add client_admin permission to update learning_tracks (for schedule settings)
-- This allows client_admin to update schedule settings on learning tracks
-- Note: The UI restricts client_admin to only editing schedule fields (canEditSchedule)

-- Update learning_tracks UPDATE policy to include client_admin
DROP POLICY IF EXISTS "Super admins and authors can update learning tracks" ON public.learning_tracks;

CREATE POLICY "Admins and authors can update learning tracks" 
ON public.learning_tracks 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role) OR
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role) OR
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Add client_admin permission to manage learning_track_lessons
-- This is required because updating a track's schedule settings also updates learning_track_lessons
-- Note: The UI still restricts client_admin from changing which lessons are in a track

DROP POLICY IF EXISTS "Super admins and authors can manage track lessons" ON public.learning_track_lessons;
DROP POLICY IF EXISTS "Admins and authors can manage track lessons" ON public.learning_track_lessons;

CREATE POLICY "Admins and authors can manage track lessons" 
ON public.learning_track_lessons 
FOR ALL 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role) OR
  has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role) OR
  has_role(auth.uid(), 'client_admin'::app_role)
);

