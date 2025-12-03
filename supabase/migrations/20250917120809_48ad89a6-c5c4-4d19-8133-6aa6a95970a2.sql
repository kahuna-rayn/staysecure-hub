-- Add policies to allow super_admins to manage translation tables so triggers can update flags

-- Lesson translations: allow admin and super_admin to manage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'lesson_translations' AND policyname = 'Privileged can manage lesson translations'
  ) THEN
    CREATE POLICY "Privileged can manage lesson translations"
    ON public.lesson_translations
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin'::app_role, 'super_admin'::app_role)
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin'::app_role, 'super_admin'::app_role)
      )
    );
  END IF;
END $$;

-- Lesson node translations: allow admin and super_admin to manage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'lesson_node_translations' AND policyname = 'Privileged can manage lesson node translations'
  ) THEN
    CREATE POLICY "Privileged can manage lesson node translations"
    ON public.lesson_node_translations
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin'::app_role, 'super_admin'::app_role)
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin'::app_role, 'super_admin'::app_role)
      )
    );
  END IF;
END $$;