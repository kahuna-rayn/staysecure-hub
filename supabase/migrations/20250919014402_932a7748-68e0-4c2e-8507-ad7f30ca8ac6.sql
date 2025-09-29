-- Fix admin access policies for csba_answers, periodic_reviews, and key_dates
-- Ensure super_admin and client_admin have comprehensive access

-- Drop existing restrictive policies and create comprehensive admin policies

-- CSBA Answers - Complete admin access
DROP POLICY IF EXISTS "Admins can view all CSBA answers" ON public.csba_answers;

CREATE POLICY "Super and Client Admins can manage all CSBA answers" 
ON public.csba_answers 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Periodic Reviews - Complete admin access  
DROP POLICY IF EXISTS "Admins can manage all periodic reviews" ON public.periodic_reviews;

CREATE POLICY "Super and Client Admins can manage all periodic reviews" 
ON public.periodic_reviews 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

-- Key Dates - Complete admin access
DROP POLICY IF EXISTS "Admins can manage key dates" ON public.key_dates;

CREATE POLICY "Super and Client Admins can manage all key dates" 
ON public.key_dates 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));