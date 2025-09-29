-- Add missing INSERT policy for translation_change_log table
-- This allows the trigger functions to insert change log entries

CREATE POLICY "System can insert translation change log entries" 
ON public.translation_change_log FOR INSERT
WITH CHECK (true);

-- Also add UPDATE and DELETE policies for completeness if needed by admin functions
CREATE POLICY "Admins can manage translation change log" 
ON public.translation_change_log FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete translation change log" 
ON public.translation_change_log FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));