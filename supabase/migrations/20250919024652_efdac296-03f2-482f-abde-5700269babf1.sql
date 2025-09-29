-- Update RLS policies for user_phishing_scores to restrict access
-- Only super_admins and client_admins can view, only super_admins can update

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own phishing scores" ON public.user_phishing_scores;
DROP POLICY IF EXISTS "Admins can manage all phishing scores" ON public.user_phishing_scores;

-- Create new restrictive policies
-- Only super_admin and client_admin can view phishing scores
CREATE POLICY "Only admins can view phishing scores" 
ON public.user_phishing_scores 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Only super_admin can insert phishing scores
CREATE POLICY "Only super_admin can insert phishing scores" 
ON public.user_phishing_scores 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Only super_admin can update phishing scores
CREATE POLICY "Only super_admin can update phishing scores" 
ON public.user_phishing_scores 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Only super_admin can delete phishing scores
CREATE POLICY "Only super_admin can delete phishing scores" 
ON public.user_phishing_scores 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'::app_role));