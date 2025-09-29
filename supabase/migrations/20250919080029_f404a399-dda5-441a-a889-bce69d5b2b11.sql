-- Add lesson_type and quiz_config to lessons table
ALTER TABLE public.lessons 
ADD COLUMN lesson_type TEXT DEFAULT 'lesson' CHECK (lesson_type IN ('lesson', 'quiz')),
ADD COLUMN quiz_config JSONB DEFAULT NULL;

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  percentage_score NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  answers_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id, attempt_number)
);

-- Enable RLS on quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own quiz attempts
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own quiz attempts
CREATE POLICY "Users can insert their own quiz attempts"
ON public.quiz_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all quiz attempts
CREATE POLICY "Admins can manage all quiz attempts"
ON public.quiz_attempts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('client_admin'::app_role, 'super_admin'::app_role)
  )
);

-- Add index for performance
CREATE INDEX idx_quiz_attempts_user_lesson ON public.quiz_attempts(user_id, lesson_id);
CREATE INDEX idx_quiz_attempts_completed_at ON public.quiz_attempts(completed_at DESC);