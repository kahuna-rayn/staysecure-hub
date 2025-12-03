-- Add RLS policies for user_learning_track_progress table
-- This allows users to automatically create progress records when starting learning tracks

-- Allow users to create their own progress records
CREATE POLICY "Users can insert their own learning track progress"
ON public.user_learning_track_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own progress
CREATE POLICY "Users can view their own learning track progress"
ON public.user_learning_track_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own progress
CREATE POLICY "Users can update their own learning track progress"
ON public.user_learning_track_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow managers to view progress for their department users
CREATE POLICY "Managers can view progress for their department users"
ON public.user_learning_track_progress
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  is_user_in_managed_department(auth.uid(), user_id)
);