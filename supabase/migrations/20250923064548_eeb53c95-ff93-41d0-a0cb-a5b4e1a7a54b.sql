-- Fix security vulnerability: Restrict access to breach management team data
-- Currently these tables are publicly readable, exposing organizational security structure

-- Drop the overly permissive SELECT policies that allow anyone to view sensitive data
DROP POLICY IF EXISTS "Users can view breach management data" ON public.breach_management_team;
DROP POLICY IF EXISTS "Users can view breach team members" ON public.breach_team_members;

-- Create restrictive policies that only allow authorized security personnel to view data
CREATE POLICY "Only admins can view breach management data" 
ON public.breach_management_team 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));

CREATE POLICY "Only admins can view breach team members" 
ON public.breach_team_members 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'client_admin'::app_role));