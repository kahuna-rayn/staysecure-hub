-- CRITICAL SECURITY FIX: Enable RLS on tables that have policies but RLS disabled
-- This is a serious vulnerability where policies exist but are not enforced

-- Enable RLS on lesson_answers table
ALTER TABLE public.lesson_answers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lessons table  
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_learning_track_progress table
ALTER TABLE public.user_learning_track_progress ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_lesson_progress table
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Verify RLS is now enabled by checking the pg_tables view
-- (This is just for verification - the actual check will be done by the security scanner)