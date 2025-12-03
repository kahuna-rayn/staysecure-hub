-- First, add 'author' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'author';

-- Drop existing permissive policies for lessons
DROP POLICY IF EXISTS "Allow anonymous lesson creation for development" ON public.lessons;
DROP POLICY IF EXISTS "Allow anonymous lesson management for development" ON public.lessons;

-- Create new restrictive policies for lessons
CREATE POLICY "Super admins and authors can create lessons" 
ON public.lessons 
FOR INSERT 
TO authenticated 
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Super admins and authors can update lessons" 
ON public.lessons 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Super admins and authors can delete lessons" 
ON public.lessons 
FOR DELETE 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

-- Drop existing permissive policies for learning_tracks
DROP POLICY IF EXISTS "Allow anonymous track management for development" ON public.learning_tracks;

-- Create new restrictive policies for learning_tracks
CREATE POLICY "Super admins and authors can create learning tracks" 
ON public.learning_tracks 
FOR INSERT 
TO authenticated 
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Super admins and authors can update learning tracks" 
ON public.learning_tracks 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Super admins and authors can delete learning tracks" 
ON public.learning_tracks 
FOR DELETE 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

-- Drop existing permissive policies for lesson_nodes
DROP POLICY IF EXISTS "Allow anonymous node management for development" ON public.lesson_nodes;

-- Create new restrictive policies for lesson_nodes
CREATE POLICY "Super admins and authors can manage lesson nodes" 
ON public.lesson_nodes 
FOR ALL 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);

-- Drop existing permissive policies for learning_track_lessons
DROP POLICY IF EXISTS "Allow anonymous track lesson management for development" ON public.learning_track_lessons;

-- Create new restrictive policies for learning_track_lessons
CREATE POLICY "Super admins and authors can manage track lessons" 
ON public.learning_track_lessons 
FOR ALL 
TO authenticated 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'author'::app_role)
);