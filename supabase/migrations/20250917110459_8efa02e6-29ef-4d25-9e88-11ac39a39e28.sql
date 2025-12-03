-- Create table for storing translated lesson answers
CREATE TABLE IF NOT EXISTS public.lesson_answer_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id TEXT NOT NULL REFERENCES public.lesson_answers(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL,
  text_translated TEXT NOT NULL,
  explanation_translated TEXT,
  engine_used VARCHAR(50) NOT NULL DEFAULT 'google',
  status VARCHAR(20) DEFAULT 'completed',
  character_count INTEGER,
  translation_cost DECIMAL(8,4) DEFAULT 0,
  quality_score DECIMAL(3,2),
  is_outdated BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  content_hash TEXT,
  source_content_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(answer_id, language_code)
);

-- Enable RLS on the new table
ALTER TABLE public.lesson_answer_translations ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson answer translations
CREATE POLICY "Admins can manage lesson answer translations" ON public.lesson_answer_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Users can view lesson answer translations" ON public.lesson_answer_translations
  FOR SELECT USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lesson_answer_translations_answer_language 
ON public.lesson_answer_translations(answer_id, language_code);