-- Add quiz configuration support to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS quiz_config jsonb DEFAULT NULL;

-- Update lessons table comment
COMMENT ON COLUMN public.lessons.quiz_config IS 'JSON configuration for quiz-type lessons including passing percentage, retry policies, certificate settings, etc.';

-- Create indexes for quiz config queries
CREATE INDEX IF NOT EXISTS idx_lessons_quiz_config ON public.lessons USING gin(quiz_config) WHERE lesson_type = 'quiz';
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_type ON public.lessons(lesson_type) WHERE lesson_type IS NOT NULL;