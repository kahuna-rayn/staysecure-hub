-- Fix Security Definer View issue by dropping and recreating all CSBA views
-- without SECURITY DEFINER property to use proper RLS instead

-- Drop all CSBA views with CASCADE to handle dependencies
DROP VIEW IF EXISTS public.csba_key_insights_view CASCADE;
DROP VIEW IF EXISTS public.csba_detailed_insights_view CASCADE;
DROP VIEW IF EXISTS public.csba_domain_score_view CASCADE;
DROP VIEW IF EXISTS public.csba_assessment_summary_view CASCADE;

-- Recreate all views without SECURITY DEFINER (using default SECURITY INVOKER)
-- This ensures views use the permissions of the querying user, not the creator

-- 1. Base assessment summary view
CREATE VIEW public.csba_assessment_summary_view AS
SELECT 
    cm.question_id,
    AVG(ca.answer::numeric) as avg_score,
    COUNT(ca.answer) as num_responses,
    cm.question,
    cm.type,
    cm.domain_short,
    cm.recommendation,
    cm.domain
FROM public.csba_master cm
LEFT JOIN public.csba_answers ca ON cm.question_id = ca.question_id
GROUP BY cm.question_id, cm.question, cm.type, cm.domain_short, cm.recommendation, cm.domain;

-- 2. Domain score view
CREATE VIEW public.csba_domain_score_view AS
SELECT 
    cm.domain,
    cm.domain_short,
    AVG(ca.answer::numeric) as domain_avg,
    SUM(ca.answer::numeric) as weighted_score,
    ROUND((AVG(ca.answer::numeric) / 5.0) * 100, 1) as weighted_percent,
    STDDEV(ca.answer::numeric) as std_deviation,
    CASE 
        WHEN AVG(ca.answer::numeric) < 2.0 THEN 1
        WHEN AVG(ca.answer::numeric) < 3.0 THEN 2
        WHEN AVG(ca.answer::numeric) < 4.0 THEN 3
        ELSE 4
    END as priority
FROM public.csba_master cm
LEFT JOIN public.csba_answers ca ON cm.question_id = ca.question_id
GROUP BY cm.domain, cm.domain_short
ORDER BY domain_avg ASC;

-- 3. Detailed insights view
CREATE VIEW public.csba_detailed_insights_view AS
SELECT 
    cm.recommendation,
    cm.domain,
    AVG(ca.answer::numeric) as avg_score,
    cm.question,
    cm.domain_short
FROM public.csba_master cm
LEFT JOIN public.csba_answers ca ON cm.question_id = ca.question_id
GROUP BY cm.recommendation, cm.domain, cm.question, cm.domain_short
HAVING AVG(ca.answer::numeric) < 3.0
ORDER BY avg_score ASC;

-- 4. Key insights view
CREATE VIEW public.csba_key_insights_view AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY avg_score ASC) as n,
    domain,
    CASE 
        WHEN avg_score < 2.0 THEN 'Critical security gaps identified in ' || domain || ' domain'
        WHEN avg_score < 3.0 THEN 'Significant improvements needed in ' || domain || ' domain'
        WHEN avg_score < 4.0 THEN 'Moderate risk areas found in ' || domain || ' domain'
        ELSE 'Well-managed ' || domain || ' domain with minor improvements possible'
    END as insight
FROM (
    SELECT 
        cm.domain,
        AVG(ca.answer::numeric) as avg_score
    FROM public.csba_master cm
    LEFT JOIN public.csba_answers ca ON cm.question_id = ca.question_id
    GROUP BY cm.domain
    HAVING COUNT(ca.answer) > 0
) domain_scores
ORDER BY avg_score ASC
LIMIT 5;