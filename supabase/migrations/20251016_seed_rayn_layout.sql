-- Seed default RAYN Secure branded email layout
-- This provides the branded wrapper for all email notifications

INSERT INTO public.email_layouts (
  name,
  description,
  is_default,
  is_system,
  is_active,
  brand_colors,
  layout_variables,
  html_layout
)
VALUES (
  'RAYN Secure Default',
  'Default branded email layout for RAYN Secure with teal/green branding and logo',
  true,  -- This is the default layout
  true,  -- System layout (cannot be deleted)
  true,  -- Active
  '{
    "primary": "#2D9B9B",
    "primary_dark": "#00A09A",
    "secondary": "#6EBF75",
    "accent": "#00A09A",
    "text": "#333333",
    "text_light": "#666666",
    "background": "#F5F5F5",
    "surface": "#FFFFFF",
    "border": "#E5E7EB",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "error": "#EF4444"
  }'::jsonb,
  '[
    {"name": "company_name", "type": "string", "default": "RAYN Secure"},
    {"name": "company_logo_url", "type": "string", "default": "https://44485296.fs1.hubspotusercontent-na2.net/hubfs/44485296/RAYN%20logos/RAYN%20Logo%203D%20Transparent.png"},
    {"name": "support_email", "type": "string", "default": "support@raynsecure.com"},
    {"name": "app_url", "type": "string", "default": "https://app.raynsecure.com"},
    {"name": "unsubscribe_url", "type": "string", "default": "{{app_url}}/settings/notifications"}
  ]'::jsonb,
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{email_subject}}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #F5F5F5; line-height: 1.6;">
  
  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F5F5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Email Container (600px) -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; max-width: 100%;">
          
          <!-- Header with Logo & Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #2D9B9B 0%, #00A09A 100%); padding: 30px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <img src="{{company_logo_url}}" alt="{{company_name}}" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">
                      {{company_name}}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content Area -->
          <tr>
            <td style="padding: 40px 40px;">
              
              <!-- TEMPLATE CONTENT GOES HERE -->
              {{email_content}}
              <!-- END TEMPLATE CONTENT -->
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px 40px; border-top: 1px solid #E5E7EB;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Quick Links -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="{{app_url}}/dashboard" style="color: #2D9B9B; text-decoration: none; font-size: 14px; font-weight: 500;">Dashboard</a>
                        </td>
                        <td style="padding: 0 10px; color: #CBD5E1;">|</td>
                        <td style="padding: 0 10px;">
                          <a href="{{app_url}}/learning" style="color: #2D9B9B; text-decoration: none; font-size: 14px; font-weight: 500;">Learning</a>
                        </td>
                        <td style="padding: 0 10px; color: #CBD5E1;">|</td>
                        <td style="padding: 0 10px;">
                          <a href="{{app_url}}/settings" style="color: #2D9B9B; text-decoration: none; font-size: 14px; font-weight: 500;">Settings</a>
                        </td>
                        <td style="padding: 0 10px; color: #CBD5E1;">|</td>
                        <td style="padding: 0 10px;">
                          <a href="mailto:{{support_email}}" style="color: #2D9B9B; text-decoration: none; font-size: 14px; font-weight: 500;">Support</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Company Info -->
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <p style="margin: 0; color: #64748B; font-size: 13px; line-height: 1.5;">
                      {{company_name}} - Empowering Secure Learning
                    </p>
                  </td>
                </tr>
                
                <!-- Unsubscribe -->
                <tr>
                  <td align="center" style="padding-bottom: 10px;">
                    <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                      <a href="{{unsubscribe_url}}" style="color: #94A3B8; text-decoration: underline;">Manage notification preferences</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Copyright -->
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #94A3B8; font-size: 11px;">
                      © {{current_year}} {{company_name}}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        <!-- End Main Email Container -->
        
        <!-- Spacer for email clients -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 100%;">
          <tr>
            <td style="padding-top: 20px; text-align: center;">
              <p style="margin: 0; color: #94A3B8; font-size: 11px;">
                If you''re having trouble viewing this email, <a href="{{email_web_version_url}}" style="color: #2D9B9B; text-decoration: underline;">view it in your browser</a>.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  <!-- End Wrapper Table -->
  
</body>
</html>'
);

-- Create a simple plain text layout for text-only emails
INSERT INTO public.email_layouts (
  name,
  description,
  is_default,
  is_system,
  is_active,
  brand_colors,
  layout_variables,
  html_layout
)
VALUES (
  'RAYN Secure Plain Text',
  'Plain text email layout without heavy styling, for maximum deliverability',
  false,  -- Not default
  true,   -- System layout
  true,   -- Active
  '{
    "primary": "#2D9B9B",
    "text": "#333333"
  }'::jsonb,
  '[
    {"name": "company_name", "type": "string", "default": "RAYN Secure"},
    {"name": "app_url", "type": "string", "default": "https://app.raynsecure.com"}
  ]'::jsonb,
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{email_subject}}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #FFFFFF; color: #333333;">
  
  <div style="max-width: 600px; margin: 0 auto;">
    
    <!-- Header -->
    <div style="border-bottom: 2px solid #2D9B9B; padding-bottom: 15px; margin-bottom: 30px;">
      <h1 style="margin: 0; color: #2D9B9B; font-size: 20px;">{{company_name}}</h1>
    </div>
    
    <!-- Content -->
    <div style="margin-bottom: 30px;">
      {{email_content}}
    </div>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666666;">
      <p>Dashboard: {{app_url}}/dashboard | Settings: {{app_url}}/settings</p>
      <p>© {{current_year}} {{company_name}}. All rights reserved.</p>
    </div>
    
  </div>
  
</body>
</html>'
);

-- Update all existing email_templates to use the default layout
UPDATE public.email_templates
SET layout_id = (
  SELECT id FROM public.email_layouts WHERE is_default = true LIMIT 1
)
WHERE layout_id IS NULL;

COMMENT ON TABLE public.email_layouts IS 
  'Reusable email layouts that provide consistent branding across all notifications';

