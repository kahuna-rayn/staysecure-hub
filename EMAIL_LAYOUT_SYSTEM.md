# Email Layout System - RAYN Secure

## Overview

The email layout system separates **branding** from **content**, making it easy to:
- Update branding (colors, logo, footer) in one place
- Keep templates focused on content only
- Maintain consistent branding across all emails
- Create custom layouts for different purposes

---

## Architecture

```
┌─────────────────────────────────────────┐
│     email_layouts table                 │
│  (Header, Footer, Branding, Colors)     │
│                                         │
│  Contains: {{email_content}} placeholder│
└─────────────────┬───────────────────────┘
                  │
                  │ referenced by layout_id
                  │
┌─────────────────▼───────────────────────┐
│     email_templates table               │
│  (Just the content - no header/footer)  │
│                                         │
│  Gets injected into {{email_content}}   │
└─────────────────────────────────────────┘
```

---

## How It Works

### 1. Layout Contains the Wrapper

`email_layouts` table stores the full HTML email structure:

```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <!-- RAYN Secure Header with Logo -->
  <header style="...">
    <img src="{{company_logo_url}}" />
    <h1>{{company_name}}</h1>
  </header>
  
  <!-- CONTENT GOES HERE -->
  {{email_content}}
  <!-- END CONTENT -->
  
  <!-- RAYN Secure Footer -->
  <footer style="...">
    Links | Copyright | Unsubscribe
  </footer>
</body>
</html>
```

### 2. Templates Contain Only Content

`email_templates.html_body_template` contains **just the content**:

```html
<div style="text-align: center;">
  <h2>Congratulations, {{user_name}}!</h2>
  <p>You completed {{lesson_title}}!</p>
  <a href="{{next_lesson_url}}">Next Lesson →</a>
</div>
```

### 3. At Send Time, They're Combined

When sending an email:
1. Load the template's `html_body_template`
2. Populate template variables: `{{user_name}}`, `{{lesson_title}}`, etc.
3. Load the layout (via `layout_id`)
4. Replace `{{email_content}}` in layout with populated template
5. Populate layout variables: `{{company_logo_url}}`, `{{current_year}}`, etc.
6. Send final HTML email

---

## Database Tables

### `email_layouts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Layout name (e.g., "RAYN Secure Default") |
| `description` | TEXT | What this layout is for |
| `is_default` | BOOLEAN | Use this layout if template doesn't specify one |
| `is_system` | BOOLEAN | System layouts can't be deleted (only edited) |
| `html_layout` | TEXT | Full HTML with `{{email_content}}` placeholder |
| `brand_colors` | JSONB | JSON object with brand colors |
| `layout_variables` | JSONB | Available variables and defaults |
| `is_active` | BOOLEAN | Whether this layout can be used |

### `email_templates` (updated)

Added column:
- `layout_id` UUID - References `email_layouts(id)`

If `layout_id` is NULL, uses the default layout.

---

## Pre-Configured Layouts

### 1. RAYN Secure Default
- Full branding with gradient header
- RAYN logo and colors
- Footer with links and unsubscribe
- Best for: All notification emails

**Colors**:
- Primary: `#2D9B9B` (Teal)
- Secondary: `#6EBF75` (Green)
- Accent: `#00A09A` (Dark Teal)

### 2. RAYN Secure Plain Text
- Minimal styling
- Text-focused design
- Best for: Maximum deliverability
- Use when: Emails might be caught by spam filters

---

## Layout Variables

Layouts can use special variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{company_name}}` | Company name | "RAYN Secure" |
| `{{company_logo_url}}` | Logo URL | "https://app.raynsecure.com/logo.png" |
| `{{app_url}}` | App base URL | "https://app.raynsecure.com" |
| `{{support_email}}` | Support email | "support@raynsecure.com" |
| `{{unsubscribe_url}}` | Preferences page | "{{app_url}}/settings/notifications" |
| `{{current_year}}` | Current year | "2025" |
| `{{email_subject}}` | Email subject | Populated at send time |
| `{{email_content}}` | **Template content** | Injected here |

---

## Customization Guide

### Updating Brand Colors

Update the `brand_colors` JSON in the layout:

```sql
UPDATE email_layouts
SET brand_colors = '{
  "primary": "#YOUR_PRIMARY_COLOR",
  "secondary": "#YOUR_SECONDARY_COLOR",
  "accent": "#YOUR_ACCENT_COLOR"
}'
WHERE name = 'RAYN Secure Default';
```

### Updating the Logo

Two options:

**Option 1: Update URL in layout variables**
```sql
UPDATE email_layouts
SET layout_variables = jsonb_set(
  layout_variables,
  '{company_logo_url}',
  '"https://your-new-logo-url.com/logo.png"'
)
WHERE name = 'RAYN Secure Default';
```

**Option 2: Upload logo and update HTML**
1. Upload logo to your CDN/S3
2. Edit `html_layout` to point to new URL

### Creating a Custom Layout

```sql
INSERT INTO email_layouts (
  name,
  description,
  is_default,
  is_system,
  html_layout,
  brand_colors
) VALUES (
  'My Custom Layout',
  'Custom layout for special campaigns',
  false,  -- Not default
  false,  -- Not system (can be deleted)
  '<!DOCTYPE html>
   <html>
   ...your HTML with {{email_content}} placeholder...
   </html>',
  '{"primary": "#YOUR_COLOR"}'::jsonb
);
```

### Using a Different Layout for a Template

```sql
-- Option 1: Update existing template
UPDATE email_templates
SET layout_id = (SELECT id FROM email_layouts WHERE name = 'My Custom Layout')
WHERE type = 'lesson_completed';

-- Option 2: Create new template with custom layout
INSERT INTO email_templates (
  type, name, layout_id, ...
) VALUES (
  'special_announcement',
  'Special Announcement',
  (SELECT id FROM email_layouts WHERE name = 'My Custom Layout'),
  ...
);
```

---

## Benefits of This Approach

### ✅ Separation of Concerns
- **Designers** edit layouts (branding)
- **Content writers** edit templates (messaging)
- **Admins** can do both without touching code

### ✅ Easy Branding Updates
- Update logo once → applies to all emails
- Update colors once → applies to all emails
- Update footer links once → applies to all emails

### ✅ Multiple Layouts
- Default layout for notifications
- Plain text layout for important system emails
- Campaign layout for marketing
- Client-specific layouts for white-label

### ✅ Template Simplicity
- Templates are just content HTML
- No need to copy/paste header and footer
- Easier to write and maintain

### ✅ Version Control
- Easier to track changes (layout vs content)
- Easier to A/B test layouts
- Easier to rollback changes

---

## Admin UI Considerations

When building the template editor UI, you'll want:

### Layout Selector
```tsx
<Select value={template.layout_id} onChange={...}>
  <option value={defaultLayoutId}>RAYN Secure Default</option>
  <option value={plainTextLayoutId}>Plain Text</option>
  <option value={customLayoutId}>My Custom Layout</option>
</Select>
```

### Layout Preview
- Show preview of layout with sample content
- Show preview of template within layout
- Side-by-side comparison

### Layout Editor (Admin Only)
- Rich text editor for layout HTML
- Color picker for brand_colors
- Variable reference guide
- Test send functionality

---

## Edge Function Integration

When sending emails from Edge Functions:

```typescript
// supabase/functions/_shared/email-sender.ts

export async function sendTemplatedEmail(
  supabase: any,
  templateType: string,
  userId: string,
  variables: Record<string, any>
) {
  // 1. Get template and layout
  const { data: template } = await supabase
    .from('email_templates')
    .select(`
      *,
      email_layout:layout_id (*)
    `)
    .eq('type', templateType)
    .single();
  
  // Use default layout if none specified
  const layout = template.email_layout || await getDefaultLayout(supabase);
  
  // 2. Populate template content
  let content = template.html_body_template;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(
      new RegExp(`{{${key}}}`, 'g'),
      String(value)
    );
  }
  
  // 3. Inject content into layout
  let finalHtml = layout.html_layout;
  finalHtml = finalHtml.replace('{{email_content}}', content);
  
  // 4. Populate layout variables
  const layoutVars = {
    company_name: 'RAYN Secure',
    company_logo_url: 'https://44485296.fs1.hubspotusercontent-na2.net/hubfs/44485296/RAYN%20logos/RAYN%20Logo%203D%20Transparent.png',
    app_url: Deno.env.get('APP_URL'),
    support_email: 'support@raynsecure.com',
    current_year: new Date().getFullYear().toString(),
    email_subject: template.subject_template,
    unsubscribe_url: `${Deno.env.get('APP_URL')}/settings/notifications`,
    ...variables  // Allow overrides
  };
  
  for (const [key, value] of Object.entries(layoutVars)) {
    finalHtml = finalHtml.replace(
      new RegExp(`{{${key}}}`, 'g'),
      String(value)
    );
  }
  
  // 5. Send email
  await supabase.functions.invoke('send-email', {
    body: {
      to: variables.user_email,
      subject: populateTemplate(template.subject_template, variables),
      html: finalHtml
    }
  });
}
```

---

## Migration Path

If you have existing templates with full HTML:

```sql
-- 1. Extract content from existing templates (remove header/footer)
-- This is a manual process - review each template

-- 2. Assign default layout to all templates
UPDATE email_templates
SET layout_id = (SELECT id FROM email_layouts WHERE is_default = true)
WHERE layout_id IS NULL;

-- 3. Test each template to ensure it looks correct
```

---

## Best Practices

### For Layouts
1. Keep layouts minimal and flexible
2. Use web-safe fonts (Arial, Helvetica, sans-serif)
3. Use inline styles (not `<style>` tags)
4. Test in multiple email clients
5. Provide fallbacks for older clients
6. Keep file size under 100KB
7. Use `role="presentation"` on layout tables

### For Templates
1. Focus on content only
2. Use semantic HTML when possible
3. Keep nesting shallow (max 3-4 levels)
4. Use tables for layout (email clients need this)
5. Test variable substitution
6. Provide meaningful alt text for images
7. Include both text and button CTAs

### For Variables
1. Always provide defaults
2. Document required vs optional
3. Use clear, descriptive names
4. Handle missing variables gracefully
5. Sanitize user-provided content

---

## Next Steps

1. ✅ **Run migrations** (done - tables created)
2. 🔄 **Seed layouts and templates** (next step)
3. **Build admin UI** for editing layouts
4. **Build template editor** that uses layouts
5. **Update Edge Functions** to use layout system
6. **Test across email clients**
7. **Train admins** on customization

---

**Created**: October 9, 2025  
**Status**: ✅ READY - Database setup complete  
**Next**: Run seed migrations to populate layouts and templates

