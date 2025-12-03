-- Create email_layouts table for reusable branding templates
-- This separates branding (header, footer, colors) from content

CREATE TABLE IF NOT EXISTS public.email_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  
  -- Layout HTML
  -- Use {{email_content}} as placeholder for where template content goes
  html_layout TEXT NOT NULL,
  
  -- Layout Variables (optional branding variables)
  layout_variables JSONB DEFAULT '[]'::jsonb,
  /* Example:
  [
    {"name": "company_name", "type": "string", "default": "RAYN Secure"},
    {"name": "company_logo_url", "type": "string", "default": "https://..."},
    {"name": "support_email", "type": "string", "default": "support@raynsecure.com"}
  ]
  */
  
  -- CSS Styles (inline styles as JSON for easy customization)
  brand_colors JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "primary": "#2D9B9B",
    "secondary": "#6EBF75", 
    "accent": "#00A09A",
    "text": "#333333",
    "background": "#F5F5F5"
  }
  */
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Add layout_id to email_templates
ALTER TABLE public.email_templates 
  ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES public.email_layouts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_layouts_default ON public.email_layouts(is_default);
CREATE INDEX IF NOT EXISTS idx_email_layouts_active ON public.email_layouts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_layout ON public.email_templates(layout_id);

-- Enable RLS
ALTER TABLE public.email_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage layouts
CREATE POLICY "Admins can view email layouts"
  ON public.email_layouts FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Admins can update email layouts"
  ON public.email_layouts FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Admins can create custom layouts"
  ON public.email_layouts FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'super_admin'::app_role) OR 
     has_role(auth.uid(), 'client_admin'::app_role))
    AND COALESCE(is_system, false) = false  -- Only custom layouts
  );

CREATE POLICY "Admins can delete custom layouts only"
  ON public.email_layouts FOR DELETE
  USING (
    (has_role(auth.uid(), 'super_admin'::app_role) OR 
     has_role(auth.uid(), 'client_admin'::app_role))
    AND COALESCE(is_system, false) = false  -- Cannot delete system layouts
  );

-- Service role has full access
CREATE POLICY "Service role can manage email layouts"
  ON public.email_layouts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_layout_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_layout_updated_at
  BEFORE UPDATE ON public.email_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_layout_updated_at();

-- Comments
COMMENT ON TABLE public.email_layouts IS 
  'Reusable email branding layouts. Templates inject their content into {{email_content}} placeholder.';
COMMENT ON COLUMN public.email_layouts.html_layout IS 
  'Full HTML email wrapper with {{email_content}} placeholder for template content';
COMMENT ON COLUMN public.email_layouts.brand_colors IS 
  'JSON object with brand colors for easy customization without editing HTML';
COMMENT ON COLUMN public.email_layouts.is_system IS 
  'System layouts cannot be deleted, only edited. Custom layouts can be fully managed.';

