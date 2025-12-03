-- Remove email_notification_id column from notification_history
-- This column references the old email_notifications table which we're no longer using
-- The new system uses notification_history as the primary table

-- Drop the foreign key constraint first
ALTER TABLE public.notification_history 
DROP CONSTRAINT IF EXISTS notification_history_email_notification_id_fkey;

-- Drop the column
ALTER TABLE public.notification_history 
DROP COLUMN IF EXISTS email_notification_id;

-- Update the table comment to reflect the change
COMMENT ON TABLE public.notification_history IS 
'Complete audit trail of all notification attempts. Links to email_templates and notification_rules. Primary table for notification tracking.';
