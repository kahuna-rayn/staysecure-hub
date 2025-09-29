-- First, let's check what RLS policies exist on translation_change_log
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'translation_change_log';

-- Drop existing policies that reference 'admin' role
DROP POLICY IF EXISTS "Admins can manage translation change log" ON public.translation_change_log;
DROP POLICY IF EXISTS "Admin can manage translation change log" ON public.translation_change_log;
DROP POLICY IF EXISTS "Admins can insert translation change log" ON public.translation_change_log;

-- Create new policies for super_admin and author roles
CREATE POLICY "Super admins and authors can manage translation change log"
ON public.translation_change_log
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

-- Also update the log_translation_change function to use SECURITY DEFINER
-- so it can bypass RLS when called from triggers
CREATE OR REPLACE FUNCTION public.log_translation_change(
  p_table_name text,
  p_record_id text,
  p_lesson_id uuid,
  p_field_name text,
  p_old_value text,
  p_new_value text,
  p_old_hash text,
  p_new_hash text,
  p_change_type text,
  p_change_magnitude text,
  p_character_difference integer,
  p_updated_by uuid,
  p_affected_translations integer,
  p_estimated_cost numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.translation_change_log (
    table_name, record_id, lesson_id, field_name,
    old_value, new_value, old_hash, new_hash,
    change_type, change_magnitude, character_difference,
    updated_by, affected_translations, estimated_retranslation_cost
  ) VALUES (
    p_table_name, p_record_id, p_lesson_id, p_field_name,
    p_old_value, p_new_value, p_old_hash, p_new_hash,
    p_change_type, p_change_magnitude, p_character_difference,
    p_updated_by, p_affected_translations, p_estimated_cost
  );
END;
$$;