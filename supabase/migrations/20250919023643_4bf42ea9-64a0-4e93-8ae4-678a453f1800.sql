-- Fix RLS security issue: Enable RLS on tables that have policies but RLS disabled
-- This ensures that the existing policies are actually enforced

-- Enable RLS on csba_answers
ALTER TABLE public.csba_answers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on csba_master
ALTER TABLE public.csba_master ENABLE ROW LEVEL SECURITY;

-- Enable RLS on key_dates
ALTER TABLE public.key_dates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on languages
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on periodic_reviews
ALTER TABLE public.periodic_reviews ENABLE ROW LEVEL SECURITY;

-- Enable RLS on translation_change_log
ALTER TABLE public.translation_change_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on translation_jobs
ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;