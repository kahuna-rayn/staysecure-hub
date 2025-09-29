-- Create a temporary public version for testing
CREATE OR REPLACE FUNCTION public.get_lessons_with_outdated_content_public()
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
  -- Temporary function without auth check for testing
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