-- Create notification_history table
-- Audit trail of all notification attempts
-- Links to existing email_templates and email_notifications tables

CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References to existing tables
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES public.notification_rules(id) ON DELETE SET NULL,
  email_notification_id UUID REFERENCES public.email_notifications(id) ON DELETE SET NULL,
  
  -- Event Information
  trigger_event TEXT NOT NULL,
  template_variables JSONB,
  /* Snapshot of variables used:
  {
    "user_name": "John Doe",
    "lesson_title": "Intro to Security",
    "score": 95
  }
  */
  
  -- Delivery Status
  status TEXT DEFAULT 'pending',
  /* Status values:
     - 'pending' - Queued
     - 'sent' - Successfully sent
     - 'failed' - Failed to send
     - 'skipped' - Skipped due to user preference, quiet hours, etc.
  */
  
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  skip_reason TEXT,
  /* Skip reasons:
     - 'user_preference_disabled'
     - 'quiet_hours_active'
     - 'cooldown_period'
     - 'rate_limit_exceeded'
     - 'template_inactive'
     - 'rule_disabled'
  */
  
  -- Metadata
  priority TEXT,
  channel TEXT DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_history_user ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_email_template ON public.notification_history(email_template_id);
CREATE INDEX IF NOT EXISTS idx_history_rule ON public.notification_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON public.notification_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_status ON public.notification_history(status);
CREATE INDEX IF NOT EXISTS idx_history_trigger_event ON public.notification_history(trigger_event);
CREATE INDEX IF NOT EXISTS idx_history_sent_at ON public.notification_history(sent_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_history_user_event ON public.notification_history(user_id, trigger_event);
CREATE INDEX IF NOT EXISTS idx_history_status_created ON public.notification_history(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view their own notification history"
  ON public.notification_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all history
CREATE POLICY "Admins can view all notification history"
  ON public.notification_history FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

-- Service role can manage all history
CREATE POLICY "Service role can manage notification history"
  ON public.notification_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Helper Functions

-- Function to check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_rule_id UUID
)
RETURNS TABLE (
  should_send BOOLEAN,
  skip_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email_enabled BOOLEAN;
  v_type_enabled BOOLEAN;
  v_quiet_hours_enabled BOOLEAN;
  v_quiet_start TIME;
  v_quiet_end TIME;
  v_current_time TIME;
  v_cooldown_hours INTEGER;
  v_last_notification TIMESTAMP;
  v_max_per_day INTEGER;
  v_today_count INTEGER;
BEGIN
  -- Check email_preferences
  SELECT 
    COALESCE(email_enabled, true),
    CASE 
      WHEN p_notification_type IN ('lesson_reminder', 'lesson_completed') 
        THEN COALESCE(lesson_reminders, true)
      WHEN p_notification_type IN ('assignment_due', 'assignment_overdue') 
        THEN COALESCE(task_due_dates, true)
      WHEN p_notification_type LIKE 'track_milestone%' 
        THEN COALESCE(course_completions, true)
      WHEN p_notification_type LIKE 'quiz_%' 
        THEN COALESCE(lesson_reminders, true)
      ELSE true
    END,
    COALESCE(quiet_hours_enabled, false),
    quiet_hours_start,
    quiet_hours_end
  INTO
    v_email_enabled,
    v_type_enabled,
    v_quiet_hours_enabled,
    v_quiet_start,
    v_quiet_end
  FROM public.email_preferences
  WHERE user_id = p_user_id;
  
  -- Default to enabled if no preferences found
  v_email_enabled := COALESCE(v_email_enabled, true);
  v_type_enabled := COALESCE(v_type_enabled, true);
  
  -- Check global email disabled
  IF NOT v_email_enabled THEN
    RETURN QUERY SELECT false, 'email_disabled';
    RETURN;
  END IF;
  
  -- Check type-specific preference
  IF NOT v_type_enabled THEN
    RETURN QUERY SELECT false, 'notification_type_disabled';
    RETURN;
  END IF;
  
  -- Check quiet hours
  IF v_quiet_hours_enabled AND v_quiet_start IS NOT NULL AND v_quiet_end IS NOT NULL THEN
    v_current_time := LOCALTIME;
    
    IF v_quiet_start < v_quiet_end THEN
      -- Normal case: e.g., 22:00 to 07:00
      IF v_current_time >= v_quiet_start AND v_current_time < v_quiet_end THEN
        RETURN QUERY SELECT false, 'quiet_hours_active';
        RETURN;
      END IF;
    ELSE
      -- Spans midnight: e.g., 22:00 to 07:00
      IF v_current_time >= v_quiet_start OR v_current_time < v_quiet_end THEN
        RETURN QUERY SELECT false, 'quiet_hours_active';
        RETURN;
      END IF;
    END IF;
  END IF;
  
  -- Check rule cooldown
  SELECT cooldown_hours, max_sends_per_user_per_day
  INTO v_cooldown_hours, v_max_per_day
  FROM public.notification_rules
  WHERE id = p_rule_id;
  
  IF v_cooldown_hours IS NOT NULL THEN
    SELECT MAX(created_at)
    INTO v_last_notification
    FROM public.notification_history
    WHERE user_id = p_user_id
      AND rule_id = p_rule_id
      AND status = 'sent';
    
    IF v_last_notification IS NOT NULL 
       AND v_last_notification > NOW() - (v_cooldown_hours || ' hours')::INTERVAL THEN
      RETURN QUERY SELECT false, 'cooldown_period';
      RETURN;
    END IF;
  END IF;
  
  -- Check rate limit
  IF v_max_per_day IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_today_count
    FROM public.notification_history
    WHERE user_id = p_user_id
      AND rule_id = p_rule_id
      AND status = 'sent'
      AND created_at >= CURRENT_DATE;
    
    IF v_today_count >= v_max_per_day THEN
      RETURN QUERY SELECT false, 'rate_limit_exceeded';
      RETURN;
    END IF;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, NULL::TEXT;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT, UUID) TO authenticated;

-- Function to get active rules for an event
CREATE OR REPLACE FUNCTION get_active_rules_for_event(
  p_event_type TEXT
)
RETURNS TABLE (
  rule_id UUID,
  rule_name TEXT,
  email_template_id UUID,
  template_type TEXT,
  subject_template TEXT,
  html_body_template TEXT,
  template_variables JSONB,
  trigger_conditions JSONB,
  send_immediately BOOLEAN,
  send_at_time TIME,
  default_priority TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    nr.id as rule_id,
    nr.name as rule_name,
    et.id as email_template_id,
    et.type as template_type,
    et.subject_template,
    et.html_body_template,
    et.variables as template_variables,
    nr.trigger_conditions,
    nr.send_immediately,
    nr.send_at_time,
    COALESCE(nr.override_priority, et.default_priority, 'normal') as default_priority
  FROM public.notification_rules nr
  INNER JOIN public.email_templates et ON nr.email_template_id = et.id
  WHERE nr.is_enabled = true
    AND COALESCE(et.is_active, true) = true
    AND nr.trigger_event = p_event_type
  ORDER BY nr.created_at;
$$;

GRANT EXECUTE ON FUNCTION get_active_rules_for_event(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_active_rules_for_event(TEXT) TO authenticated;

-- Analytics Views

-- Daily notification summary
CREATE OR REPLACE VIEW public.daily_notification_summary AS
SELECT 
  DATE(created_at) as notification_date,
  trigger_event,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.notification_history
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), trigger_event, status
ORDER BY notification_date DESC, trigger_event;

GRANT SELECT ON public.daily_notification_summary TO authenticated;

-- Template performance view
CREATE OR REPLACE VIEW public.template_performance AS
SELECT 
  et.id,
  et.name,
  et.type,
  COALESCE(et.use_count, 0) as use_count,
  et.last_used_at,
  COUNT(nh.id) as total_sends,
  COUNT(CASE WHEN nh.status = 'sent' THEN 1 END) as successful_sends,
  COUNT(CASE WHEN nh.status = 'failed' THEN 1 END) as failed_sends,
  COUNT(CASE WHEN nh.status = 'skipped' THEN 1 END) as skipped_sends,
  ROUND(
    100.0 * COUNT(CASE WHEN nh.status = 'sent' THEN 1 END) / NULLIF(COUNT(nh.id), 0),
    2
  ) as success_rate
FROM public.email_templates et
LEFT JOIN public.notification_history nh ON nh.email_template_id = et.id
GROUP BY et.id, et.name, et.type, et.use_count, et.last_used_at
ORDER BY total_sends DESC;

GRANT SELECT ON public.template_performance TO authenticated;

-- Comments
COMMENT ON TABLE public.notification_history IS 
  'Complete audit trail of all notification attempts. Links to email_templates and email_notifications.';
COMMENT ON COLUMN public.notification_history.template_variables IS 
  'JSON snapshot of variables used to populate this notification';
COMMENT ON COLUMN public.notification_history.email_template_id IS 
  'References email_templates - which template was used';
COMMENT ON COLUMN public.notification_history.email_notification_id IS 
  'References email_notifications - the actual email record if sent';
