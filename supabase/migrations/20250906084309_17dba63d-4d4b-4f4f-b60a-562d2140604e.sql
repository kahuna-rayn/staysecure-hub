CREATE OR REPLACE FUNCTION public.get_outdated_lessons()
RETURNS TABLE(id uuid, title text, last_modified timestamp with time zone, created_by uuid, translation_count bigint, outdated_count bigint, node_count bigint, outdated_node_count bigint)
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
    lts.id,
    lts.title,
    lts.last_modified,
    lts.created_by,
    lts.translation_count,
    lts.outdated_count,
    lts.node_count,
    lts.outdated_node_count
  FROM lesson_translation_status lts
  WHERE lts.outdated_count > 0 OR lts.outdated_node_count > 0
  ORDER BY lts.last_modified DESC;
END;
$function$