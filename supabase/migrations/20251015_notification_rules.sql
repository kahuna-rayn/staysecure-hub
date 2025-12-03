-- Create notification_rules table
-- Controls when and to whom notifications are sent
-- References existing email_templates table

CREATE TABLE IF NOT EXISTS public.notification_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Reference existing email_templates table
  email_template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  
  -- Identification
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  
  -- Trigger Configuration
  trigger_event TEXT NOT NULL,
  /* Phase 1 Events:
     - 'lesson_completed'
     - 'quiz_completed'
     - 'track_milestone_reached'
     - 'track_completed'
     - 'assignment_due_check' (daily cron)
     - 'user_inactivity_check' (daily cron)
  */
  
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  /* Example:
  {
    "score": {"operator": ">=", "value": 90},
    "attempt_number": {"operator": "=", "value": 1}
  }
  */
  
  -- Scheduling
  send_immediately BOOLEAN DEFAULT true,
  schedule_delay_minutes INTEGER DEFAULT 0,
  send_at_time TIME,
  respect_quiet_hours BOOLEAN DEFAULT true,
  
  -- Throttling (spam prevention)
  max_sends_per_user_per_day INTEGER,
  cooldown_hours INTEGER,
  
  -- Priority Override (optional)
  override_priority TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rules_trigger_event ON public.notification_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON public.notification_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_rules_email_template ON public.notification_rules(email_template_id);
CREATE INDEX IF NOT EXISTS idx_rules_last_triggered ON public.notification_rules(last_triggered_at);

-- Enable RLS
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage rules
CREATE POLICY "Admins can view rules"
  ON public.notification_rules FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Admins can manage rules"
  ON public.notification_rules FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'client_admin'::app_role)
  );

CREATE POLICY "Service role can manage rules"
  ON public.notification_rules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_rule_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_rule_updated_at();

-- Comments
COMMENT ON TABLE public.notification_rules IS 
  'Configuration rules for when notifications are triggered and sent. References email_templates table.';
COMMENT ON COLUMN public.notification_rules.trigger_conditions IS 
  'JSON object defining conditions that must be met for notification to send';
COMMENT ON COLUMN public.notification_rules.email_template_id IS 
  'References existing email_templates table - the template to use for this notification';
