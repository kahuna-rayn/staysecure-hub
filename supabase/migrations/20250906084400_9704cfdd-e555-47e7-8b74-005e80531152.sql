CREATE OR REPLACE FUNCTION public.get_translation_dashboard_stats()
RETURNS TABLE(total_lessons bigint, translated_lessons bigint, lessons_needing_updates bigint)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH lesson_translation_status AS (
    SELECT 
      l.id,
      l.title,
      l.updated_at as last_modified,
      l.created_by,
      COUNT(DISTINCT lt.language_code) as translation_count,
      COUNT(DISTINCT CASE WHEN lt.is_outdated = true THEN lt.language_code END) as outdated_count,
      COUNT(DISTINCT ln.id) as node_count,
      COUNT(DISTINCT CASE WHEN lnt.is_outdated = true THEN lnt.node_id END) as outdated_node_count
    FROM lessons l
    LEFT JOIN lesson_translations lt ON l.id = lt.lesson_id
    LEFT JOIN lesson_nodes ln ON l.id = ln.lesson_id
    LEFT JOIN lesson_node_translations lnt ON ln.id = lnt.node_id
    GROUP BY l.id, l.title, l.updated_at, l.created_by
  )
  SELECT 
    COUNT(*) as total_lessons,
    COUNT(CASE WHEN translation_count > 0 THEN 1 END) as translated_lessons,
    COUNT(CASE WHEN outdated_count > 0 OR outdated_node_count > 0 THEN 1 END) as lessons_needing_updates
  FROM lesson_translation_status;
END;
$function$