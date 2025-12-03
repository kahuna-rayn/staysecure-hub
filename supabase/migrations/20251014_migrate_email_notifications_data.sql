-- 20251014_migrate_email_notifications_data.sql

-- Import all existing data from email_notifications to notification_history
-- This preserves historical email notification data in the new schema

INSERT INTO public.notification_history (
  user_id,
  trigger_event,
  template_variables,
  status,
  sent_at,
  error_message,
  created_at,
  channel,
  priority
)
SELECT 
  en.user_id,
  en.type as trigger_event,
  jsonb_build_object(
    'original_id', en.id,  -- Preserve original email_notification ID in JSON
    'original_title', en.title,
    'original_message', en.message,
    'recipient_email', en.email,
    'retry_count', en.retry_count,
    'scheduled_for', en.scheduled_for
  ) as template_variables,
  en.status,
  en.sent_at,
  en.error_message,
  en.created_at,
  'email' as channel,
  CASE 
    WHEN en.type IN ('urgent', 'alert', 'system_alert') THEN 'high'
    WHEN en.type IN ('reminder', 'lesson_reminder') THEN 'normal'
    ELSE 'low'
  END as priority
FROM public.email_notifications en
WHERE NOT EXISTS (
  -- Avoid duplicates if migration has been run before
  SELECT 1 FROM public.notification_history nh 
  WHERE nh.template_variables->>'original_id' = en.id::text
);

-- Add a comment to track the migration
COMMENT ON TABLE public.email_notifications IS 'Legacy table - data migrated to notification_history on 2025-01-14';
