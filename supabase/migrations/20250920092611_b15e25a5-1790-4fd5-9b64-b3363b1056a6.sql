-- Add RLS policies for lesson_answers table
-- Allow system and authenticated users to manage lesson answers

CREATE POLICY "Allow lesson answer management" 
ON public.lesson_answers FOR ALL
USING (true)
WITH CHECK (true);