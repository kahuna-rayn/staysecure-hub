-- Create table to track reminder counts per user/lesson
CREATE TABLE IF NOT EXISTS public.lesson_reminder_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  learning_track_id UUID NOT NULL REFERENCES public.learning_tracks(id) ON DELETE CASCADE,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user/lesson combination
  UNIQUE(user_id, lesson_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_reminder_counts_user_lesson 
ON public.lesson_reminder_counts(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_reminder_counts_track 
ON public.lesson_reminder_counts(learning_track_id);

CREATE INDEX IF NOT EXISTS idx_lesson_reminder_counts_last_sent 
ON public.lesson_reminder_counts(last_reminder_sent_at);

-- Enable RLS
ALTER TABLE public.lesson_reminder_counts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reminder counts" ON public.lesson_reminder_counts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all reminder counts" ON public.lesson_reminder_counts
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE public.lesson_reminder_counts IS 'Tracks how many reminders have been sent for each user/lesson combination';
COMMENT ON COLUMN public.lesson_reminder_counts.reminder_count IS 'Number of reminders sent (max 3 by default)';
COMMENT ON COLUMN public.lesson_reminder_counts.last_reminder_sent_at IS 'When the last reminder was sent (used for 7-day cooldown)';
