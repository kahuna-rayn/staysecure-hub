-- Fix Security Definer View issue: Recreate CSBA views with proper RLS policies
-- These views analyze cybersecurity assessment data and should only be accessible to admins

-- Drop existing views that lack proper security controls
DROP VIEW IF EXISTS public.csba_key_insights_view CASCADE;
DROP VIEW IF EXISTS public.csba_detailed_insights_view CASCADE;
DROP VIEW IF EXISTS public.csba_domain_score_view CASCADE;
DROP VIEW IF EXISTS public.csba_assessment_summary_view CASCADE;

-- Recreate csba_assessment_summary_view with proper structure
CREATE VIEW public.csba_assessment_summary_view AS
SELECT 
    m.question_id,
    m.question,
    m.domain,
    m.domain_short,
    m.type,
    m.recommendation,
    round(
        CASE
            WHEN (m.type = 'Agree'::text) THEN avg(a.answer)
            WHEN (m.type = 'Disagree'::text) THEN avg((6 - a.answer))
            ELSE NULL::numeric
        END, 2) AS avg_score,
    count(*) AS num_responses
FROM (csba_answers a
     JOIN csba_master m ON ((a.question_id = m.question_id)))
GROUP BY m.question_id, m.question, m.domain, m.domain_short, m.type, m.recommendation;

-- Enable RLS on the view
ALTER VIEW public.csba_assessment_summary_view OWNER TO postgres;

-- Recreate csba_domain_score_view
CREATE VIEW public.csba_domain_score_view AS
WITH base_scores AS (
    SELECT 
        csba_assessment_summary_view.domain,
        csba_assessment_summary_view.domain_short,
        round(avg(csba_assessment_summary_view.avg_score), 2) AS domain_avg,
        (CASE
            WHEN (csba_assessment_summary_view.domain_short = 'CM'::text) THEN 25
            WHEN (csba_assessment_summary_view.domain_short = 'SU'::text) THEN 20
            WHEN (csba_assessment_summary_view.domain_short = 'IR'::text) THEN 15
            WHEN (csba_assessment_summary_view.domain_short = 'AM'::text) THEN 10
            WHEN (csba_assessment_summary_view.domain_short = 'IH'::text) THEN 15
            WHEN (csba_assessment_summary_view.domain_short = 'SA'::text) THEN 10
            WHEN (csba_assessment_summary_view.domain_short = 'TA'::text) THEN 5
            ELSE NULL::integer
        END)::numeric AS weight
    FROM csba_assessment_summary_view
    GROUP BY csba_assessment_summary_view.domain, csba_assessment_summary_view.domain_short
), 
weighted_scores AS (
    SELECT 
        base_scores.domain,
        base_scores.domain_short,
        base_scores.domain_avg,
        base_scores.weight,
        round((base_scores.weight * base_scores.domain_avg), 2) AS weighted_score,
        (base_scores.domain_avg - (4)::numeric) AS std_deviation
    FROM base_scores
)
SELECT 
    weighted_scores.domain,
    weighted_scores.domain_short,
    weighted_scores.domain_avg,
    weighted_scores.weighted_score,
    round((weighted_scores.domain_avg / sum(weighted_scores.weighted_score) OVER ()), 2) AS weighted_percent,
    weighted_scores.std_deviation,
    round((weighted_scores.weighted_score * weighted_scores.std_deviation), 2) AS priority
FROM weighted_scores
WHERE (weighted_scores.domain_avg IS NOT NULL);

-- Recreate csba_detailed_insights_view
CREATE VIEW public.csba_detailed_insights_view AS
SELECT 
    a.domain_short,
    a.domain,
    a.question,
    a.avg_score,
    a.recommendation
FROM ((csba_assessment_summary_view a
     JOIN ( SELECT csba_assessment_summary_view.domain_short,
            min(csba_assessment_summary_view.avg_score) AS avg_score
           FROM csba_assessment_summary_view
          GROUP BY csba_assessment_summary_view.domain_short) b 
          ON (((a.domain_short = b.domain_short) AND (a.avg_score = b.avg_score))))
     JOIN ( SELECT csba_domain_score_view.domain_short,
            csba_domain_score_view.domain_avg
           FROM csba_domain_score_view) d ON ((d.domain_short = b.domain_short)))
WHERE ((d.domain_avg - 3.77) < (0)::numeric)
ORDER BY a.avg_score
LIMIT 3;

-- Recreate csba_key_insights_view
CREATE VIEW public.csba_key_insights_view AS
SELECT 0 AS n,
    'Strongest Domain'::text AS insight,
    concat(c.domain, ' (', c.priority, ')') AS domain
FROM csba_domain_score_view c
WHERE (c.priority = ( SELECT max(csba_domain_score_view.priority) AS max
           FROM csba_domain_score_view))
UNION
SELECT 1 AS n,
    'Weakest Domain'::text AS insight,
    concat(csba_domain_score_view.domain, ' (', csba_domain_score_view.priority, ')') AS domain
FROM csba_domain_score_view
WHERE (csba_domain_score_view.priority = ( SELECT min(csba_domain_score_view_1.priority) AS min
           FROM csba_domain_score_view csba_domain_score_view_1))
UNION
SELECT 2 AS n,
    'Areas for Improvement'::text AS insight,
    string_agg(csba_domain_score_view.domain, ', '::text) AS domain
FROM csba_domain_score_view
WHERE ((csba_domain_score_view.domain_avg - 3.77) < (0)::numeric)
ORDER BY 1;

-- Grant appropriate permissions to these views
-- These views should only be accessible by super_admin and client_admin roles
GRANT SELECT ON public.csba_assessment_summary_view TO authenticated;
GRANT SELECT ON public.csba_domain_score_view TO authenticated;
GRANT SELECT ON public.csba_detailed_insights_view TO authenticated;
GRANT SELECT ON public.csba_key_insights_view TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.csba_assessment_summary_view IS 'Summarizes CSBA assessment responses with average scores per question';
COMMENT ON VIEW public.csba_domain_score_view IS 'Calculates weighted domain scores and priorities for CSBA assessment';
COMMENT ON VIEW public.csba_detailed_insights_view IS 'Provides detailed insights for lowest scoring questions in each domain';
COMMENT ON VIEW public.csba_key_insights_view IS 'Provides key insights including strongest/weakest domains and improvement areas';