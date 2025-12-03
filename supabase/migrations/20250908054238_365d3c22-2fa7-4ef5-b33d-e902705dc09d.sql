-- Update the function to allow super_admin role access
CREATE OR REPLACE FUNCTION public.get_lessons_with_outdated_content()
RETURNS TABLE(
  lesson_id uuid,
  lesson_title text,
  last_modified timestamp with time zone,
  created_by uuid,
  outdated_languages jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin or super_admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin'::app_role, 'super_admin'::app_role)
  ) THEN
    -- Return empty result for unauthorized users
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    l.id as lesson_id,
    l.title as lesson_title,
    l.updated_at as last_modified,
    l.created_by,
    jsonb_agg(
      jsonb_build_object(
        'language_code', lt.language_code,
        'last_translated', lt.updated_at,
        'is_outdated', lt.is_outdated
      )
    ) as outdated_languages
  FROM lessons l
  INNER JOIN lesson_translations lt ON l.id = lt.lesson_id
  WHERE lt.is_outdated = TRUE
  GROUP BY l.id, l.title, l.updated_at, l.created_by
  ORDER BY l.updated_at DESC;
END;
$$;