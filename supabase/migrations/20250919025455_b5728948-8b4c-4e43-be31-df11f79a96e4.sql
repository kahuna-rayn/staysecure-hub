-- Fix Security Definer View issue by identifying and converting SECURITY DEFINER views
-- These views enforce permissions of the view creator instead of the querying user

-- First, let's identify any views with SECURITY DEFINER property
-- and recreate them without SECURITY DEFINER to use proper RLS instead

-- Check for CSBA assessment views that might have SECURITY DEFINER
-- These views should use RLS policies instead of SECURITY DEFINER

-- Drop and recreate csba_assessment_summary_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.csba_assessment_summary_view;

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

-- Drop and recreate csba_detailed_insights_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.csba_detailed_insights_view;

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

-- Drop and recreate csba_domain_score_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.csba_domain_score_view;

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

-- Drop and recreate csba_key_insights_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.csba_key_insights_view;

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