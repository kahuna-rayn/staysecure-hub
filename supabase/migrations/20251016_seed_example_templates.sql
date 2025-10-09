-- Example notification templates using the RAYN Secure layout system
-- These templates contain ONLY the content - the layout provides branding

-- Get the default layout ID
DO $$
DECLARE
  v_layout_id UUID;
BEGIN
  SELECT id INTO v_layout_id 
  FROM public.email_layouts 
  WHERE is_default = true 
  LIMIT 1;

  -- 1. Lesson Completed Template
  INSERT INTO public.email_templates (
    type,
    name,
    description,
    category,
    is_system,
    is_active,
    layout_id,
    subject_template,
    html_body_template,
    variables
  ) VALUES (
    'lesson_completed',
    'Lesson Completed',
    'Sent when a user completes a lesson',
    'learning_progress',
    true,  -- System template
    true,  -- Active
    v_layout_id,
    '✅ Lesson Complete: {{lesson_title}}',
    '<!-- Lesson Completion Content -->
<div style="text-align: center; margin-bottom: 30px;">
  <div style="display: inline-block; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); border-radius: 50%; padding: 20px; margin-bottom: 20px;">
    <span style="font-size: 48px;">✅</span>
  </div>
  <h2 style="margin: 0 0 10px 0; color: #333333; font-size: 28px; font-weight: 700;">Congratulations!</h2>
</div>

<p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; text-align: center;">
  Well done, <strong>{{user_name}}</strong>!
</p>

<p style="margin: 0 0 25px 0; font-size: 16px; color: #666666; text-align: center;">
  You''ve successfully completed "<strong style="color: #2D9B9B;">{{lesson_title}}</strong>" from {{learning_track_title}}.
</p>

<!-- Progress Box -->
<div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #2D9B9B;">
  <h3 style="margin: 0 0 15px 0; color: #00A09A; font-size: 18px; font-weight: 600;">📊 Your Progress</h3>
  
  <table role="presentation" width="100%" cellpadding="8" cellspacing="0" border="0">
    <tr>
      <td style="color: #666666; font-size: 15px; padding: 5px 0;">Track Progress:</td>
      <td style="color: #333333; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{track_progress_percentage}}%
      </td>
    </tr>
    <tr>
      <td style="color: #666666; font-size: 15px; padding: 5px 0;">Lessons Completed:</td>
      <td style="color: #333333; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{lessons_completed_in_track}} / {{total_lessons_in_track}}
      </td>
    </tr>
    <tr>
      <td style="color: #666666; font-size: 15px; padding: 5px 0;">Completed:</td>
      <td style="color: #333333; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{completion_date}} at {{completion_time}}
      </td>
    </tr>
  </table>
  
  <!-- Progress Bar -->
  <div style="margin-top: 15px;">
    <div style="background-color: #E5E7EB; height: 8px; border-radius: 4px; overflow: hidden;">
      <div style="background: linear-gradient(90deg, #2D9B9B 0%, #6EBF75 100%); height: 100%; width: {{track_progress_percentage}}%;"></div>
    </div>
  </div>
</div>

<!-- Next Lesson CTA (conditional) -->
{{#if next_lesson_available}}
<div style="background-color: #F9FAFB; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #E5E7EB;">
  <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px; font-weight: 600;">🚀 Ready for More?</h3>
  <p style="margin: 0 0 20px 0; font-size: 15px; color: #666666;">
    Your next lesson is waiting: <strong style="color: #2D9B9B;">{{next_lesson_title}}</strong>
  </p>
  <a href="{{next_lesson_url}}" style="display: inline-block; background: linear-gradient(135deg, #2D9B9B 0%, #00A09A 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(45, 155, 155, 0.3);">
    Start Next Lesson →
  </a>
</div>
{{/if}}

<!-- Motivational Message -->
<div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
  <p style="margin: 0; font-size: 15px; color: #92400E; font-style: italic;">
    "Every lesson completed is a step toward mastering cybersecurity. Keep up the great work!"
  </p>
</div>',
    '[
      {"name": "user_name", "type": "string", "description": "User full name", "required": true},
      {"name": "lesson_title", "type": "string", "description": "Lesson title", "required": true},
      {"name": "learning_track_title", "type": "string", "description": "Track name", "required": true},
      {"name": "completion_date", "type": "string", "description": "Date completed", "required": true},
      {"name": "completion_time", "type": "string", "description": "Time completed", "required": true},
      {"name": "lessons_completed_in_track", "type": "number", "description": "Number of lessons completed", "required": true},
      {"name": "total_lessons_in_track", "type": "number", "description": "Total lessons in track", "required": true},
      {"name": "track_progress_percentage", "type": "number", "description": "Track progress %", "required": true},
      {"name": "next_lesson_title", "type": "string", "description": "Next lesson title", "required": false},
      {"name": "next_lesson_available", "type": "boolean", "description": "Is next lesson available", "required": false},
      {"name": "next_lesson_url", "type": "string", "description": "URL to next lesson", "required": false}
    ]'::jsonb
  );

  -- 2. Track Milestone 50% Template
  INSERT INTO public.email_templates (
    type,
    name,
    description,
    category,
    is_system,
    is_active,
    layout_id,
    subject_template,
    html_body_template,
    variables
  ) VALUES (
    'track_milestone_50',
    'Track Milestone - 50% Complete',
    'Sent when user reaches halfway point in a learning track',
    'learning_progress',
    true,
    true,
    v_layout_id,
    '🎯 Halfway There! {{learning_track_title}}',
    '<!-- Milestone Achievement Content -->
<div style="text-align: center; margin-bottom: 30px;">
  <div style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 50%; padding: 20px; margin-bottom: 20px;">
    <span style="font-size: 48px;">🎯</span>
  </div>
  <h2 style="margin: 0 0 10px 0; color: #333333; font-size: 28px; font-weight: 700;">You''re Halfway There!</h2>
</div>

<p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; text-align: center;">
  Great progress, <strong>{{user_name}}</strong>!
</p>

<p style="margin: 0 0 25px 0; font-size: 16px; color: #666666; text-align: center;">
  You''ve reached <strong style="color: #F59E0B; font-size: 20px;">50%</strong> completion in <strong style="color: #2D9B9B;">{{learning_track_title}}</strong>.
</p>

<!-- Achievement Stats -->
<div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #F59E0B;">
  <h3 style="margin: 0 0 15px 0; color: #92400E; font-size: 18px; font-weight: 600;">📈 Your Achievement</h3>
  
  <table role="presentation" width="100%" cellpadding="8" cellspacing="0" border="0">
    <tr>
      <td style="color: #78350F; font-size: 15px; padding: 5px 0;">Milestone:</td>
      <td style="color: #92400E; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{milestone_percentage}}% Complete
      </td>
    </tr>
    <tr>
      <td style="color: #78350F; font-size: 15px; padding: 5px 0;">Lessons Completed:</td>
      <td style="color: #92400E; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{lessons_completed}} / {{total_lessons}}
      </td>
    </tr>
    <tr>
      <td style="color: #78350F; font-size: 15px; padding: 5px 0;">Time Invested:</td>
      <td style="color: #92400E; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{time_spent_hours}} hours
      </td>
    </tr>
  </table>
</div>

<!-- Motivational Message -->
<div style="background-color: #F0F9FF; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
  <h3 style="margin: 0 0 15px 0; color: #0C4A6E; font-size: 18px; font-weight: 600;">Keep Going!</h3>
  <p style="margin: 0 0 15px 0; font-size: 15px; color: #334155;">
    You''re making excellent progress. The second half of the journey awaits!
  </p>
  <p style="margin: 0; font-size: 14px; color: #64748B; font-style: italic;">
    "Success is the sum of small efforts repeated day in and day out."
  </p>
</div>

<!-- CTA -->
<div style="text-align: center; margin-top: 30px;">
  <a href="{{continue_learning_url}}" style="display: inline-block; background: linear-gradient(135deg, #2D9B9B 0%, #00A09A 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(45, 155, 155, 0.3);">
    Continue Learning →
  </a>
</div>',
    '[
      {"name": "user_name", "type": "string", "required": true},
      {"name": "learning_track_title", "type": "string", "required": true},
      {"name": "milestone_percentage", "type": "number", "required": true},
      {"name": "lessons_completed", "type": "number", "required": true},
      {"name": "total_lessons", "type": "number", "required": true},
      {"name": "time_spent_hours", "type": "number", "required": false},
      {"name": "continue_learning_url", "type": "string", "required": true}
    ]'::jsonb
  );

  -- 3. Quiz High Score Template
  INSERT INTO public.email_templates (
    type,
    name,
    description,
    category,
    is_system,
    is_active,
    layout_id,
    subject_template,
    html_body_template,
    variables
  ) VALUES (
    'quiz_high_score',
    'Quiz High Score Achievement',
    'Sent when user scores 90% or above on a quiz',
    'learning_progress',
    true,
    true,
    v_layout_id,
    '🌟 Excellent! {{score}}% on {{quiz_title}}',
    '<!-- Quiz High Score Content -->
<div style="text-align: center; margin-bottom: 30px;">
  <div style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); border-radius: 50%; padding: 20px; margin-bottom: 20px;">
    <span style="font-size: 48px;">🌟</span>
  </div>
  <h2 style="margin: 0 0 10px 0; color: #333333; font-size: 28px; font-weight: 700;">Outstanding Performance!</h2>
</div>

<p style="margin: 0 0 20px 0; font-size: 16px; color: #333333; text-align: center;">
  Excellent work, <strong>{{user_name}}</strong>!
</p>

<p style="margin: 0 0 25px 0; font-size: 16px; color: #666666; text-align: center;">
  You scored <strong style="color: #8B5CF6; font-size: 24px;">{{score}}%</strong> on "<strong style="color: #2D9B9B;">{{quiz_title}}</strong>"!
</p>

<!-- Score Breakdown -->
<div style="background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #8B5CF6;">
  <h3 style="margin: 0 0 15px 0; color: #5B21B6; font-size: 18px; font-weight: 600;">📊 Quiz Results</h3>
  
  <table role="presentation" width="100%" cellpadding="8" cellspacing="0" border="0">
    <tr>
      <td style="color: #6B21A8; font-size: 15px; padding: 5px 0;">Score:</td>
      <td style="color: #5B21B6; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{score}}%
      </td>
    </tr>
    <tr>
      <td style="color: #6B21A8; font-size: 15px; padding: 5px 0;">Correct Answers:</td>
      <td style="color: #5B21B6; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{correct_answers}} / {{total_questions}}
      </td>
    </tr>
    <tr>
      <td style="color: #6B21A8; font-size: 15px; padding: 5px 0;">Completed:</td>
      <td style="color: #5B21B6; font-size: 15px; font-weight: 600; text-align: right; padding: 5px 0;">
        {{completion_date}}
      </td>
    </tr>
  </table>
</div>

<!-- Encouragement -->
<div style="background-color: #ECFDF5; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #6EBF75;">
  <p style="margin: 0; font-size: 15px; color: #065F46; font-weight: 500;">
    Your strong understanding of the material shows! Keep up this excellent work as you continue your learning journey.
  </p>
</div>

<!-- CTA -->
<div style="text-align: center; margin-top: 30px;">
  <a href="{{view_results_url}}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3); margin-right: 10px;">
    View Detailed Results
  </a>
  <a href="{{continue_learning_url}}" style="display: inline-block; background: linear-gradient(135deg, #2D9B9B 0%, #00A09A 100%); color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(45, 155, 155, 0.3);">
    Continue Learning →
  </a>
</div>',
    '[
      {"name": "user_name", "type": "string", "required": true},
      {"name": "quiz_title", "type": "string", "required": true},
      {"name": "score", "type": "number", "required": true},
      {"name": "correct_answers", "type": "number", "required": true},
      {"name": "total_questions", "type": "number", "required": true},
      {"name": "completion_date", "type": "string", "required": true},
      {"name": "view_results_url", "type": "string", "required": true},
      {"name": "continue_learning_url", "type": "string", "required": true}
    ]'::jsonb
  );

END $$;

COMMENT ON COLUMN public.email_templates.html_body_template IS 
  'Template content only (no header/footer). Gets injected into {{email_content}} in the layout.';

