-- Enhance existing email_templates table for advanced notification system
-- This migration ENHANCES the existing table, doesn't replace it

-- Step 1: Add new columns to existing email_templates table
ALTER TABLE public.email_templates 
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'learning_progress',
  ADD COLUMN IF NOT EXISTS default_priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Mark ALL existing templates as system templates (cannot be deleted by admins)
UPDATE public.email_templates 
SET is_system = true
WHERE is_system IS NULL OR is_system = false;

-- Step 3: Update RLS policies for admin-only management
-- Enable RLS if not already enabled
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive existing policies
DROP POLICY IF EXISTS "Public can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Anyone can manage email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can manage templates" ON public.email_templates;

-- Create admin-only policies
CREATE POLICY "Admins can view email templates"
  ON public.email_templates FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Admins can update email templates"
  ON public.email_templates FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Admins can create custom email templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'super_admin'::app_role) OR 
     has_role(auth.uid(), 'client_admin'::app_role))
    AND COALESCE(is_system, false) = false  -- Only custom templates
  );

CREATE POLICY "Admins can delete custom email templates only"
  ON public.email_templates FOR DELETE
  USING (
    (has_role(auth.uid(), 'super_admin'::app_role) OR 
     has_role(auth.uid(), 'client_admin'::app_role))
    AND COALESCE(is_system, false) = false  -- Cannot delete system templates
  );

-- Service role has full access (for automated tasks)
CREATE POLICY "Service role can manage email templates"
  ON public.email_templates FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 4: Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_system ON public.email_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);

-- Step 5: Add helpful comments
COMMENT ON TABLE public.email_templates IS 
  'Email notification templates. System templates (is_system=true) cannot be deleted by admins, only edited.';
COMMENT ON COLUMN public.email_templates.is_system IS 
  'System templates cannot be deleted, only content can be edited. Custom templates can be fully managed.';
COMMENT ON COLUMN public.email_templates.category IS 
  'Groups templates for UI organization: learning_progress, gamification, system, custom';
COMMENT ON COLUMN public.email_templates.variables IS 
  'JSON array documenting available variables for this template, used by template editor UI';
