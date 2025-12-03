-- Fix RLS policies for lessons - only super_admin and author can create/edit
-- Everyone can view published lessons and update their own progress

-- Ensure RLS is enabled
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_node_translations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Super admins and authors can create lessons" ON public.lessons;
DROP POLICY IF EXISTS "Super admins and authors can delete lessons" ON public.lessons;
DROP POLICY IF EXISTS "Super admins and authors can update lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can view published lessons" ON public.lessons;

DROP POLICY IF EXISTS "Super admins and authors can manage lesson nodes" ON public.lesson_nodes;
DROP POLICY IF EXISTS "Users can view nodes of published lessons" ON public.lesson_nodes;

-- Lesson policies: only super_admin and author can manage
CREATE POLICY "Super admins and authors can create lessons"
ON public.lessons
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Super admins and authors can update lessons"
ON public.lessons
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Super admins and authors can delete lessons"
ON public.lessons
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
);

-- Everyone can view published lessons
CREATE POLICY "Everyone can view published lessons"
ON public.lessons
FOR SELECT
USING (status = 'published' OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'author'::app_role));

-- Lesson nodes policies: only super_admin and author can manage
CREATE POLICY "Super admins and authors can manage lesson nodes"
ON public.lesson_nodes
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
);

-- Everyone can view nodes of published lessons
CREATE POLICY "Everyone can view nodes of published lessons"
ON public.lesson_nodes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lessons 
    WHERE lessons.id = lesson_nodes.lesson_id 
    AND (lessons.status = 'published' OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'author'::app_role))
  )
);

-- Lesson translations: only super_admin and author can manage, everyone can view
DROP POLICY IF EXISTS "Admins can manage lesson translations" ON public.lesson_translations;
DROP POLICY IF EXISTS "Users can view lesson translations" ON public.lesson_translations;

CREATE POLICY "Super admins and authors can manage lesson translations"
ON public.lesson_translations
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Everyone can view lesson translations"
ON public.lesson_translations
FOR SELECT
USING (true);

-- Lesson node translations: only super_admin and author can manage, everyone can view
DROP POLICY IF EXISTS "Admins can manage lesson node translations" ON public.lesson_node_translations;
DROP POLICY IF EXISTS "Users can view lesson node translations" ON public.lesson_node_translations;

CREATE POLICY "Super admins and authors can manage lesson node translations"
ON public.lesson_node_translations
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'author'::app_role)
);

CREATE POLICY "Everyone can view lesson node translations"
ON public.lesson_node_translations
FOR SELECT
USING (true);