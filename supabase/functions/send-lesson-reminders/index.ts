// Supabase Edge Function to send automatic lesson reminders
// This function should be called periodically (e.g., daily via cron job)
// Uses existing email_notifications table and respects email_preferences

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LessonReminderData {
  user_id: string;
  user_email: string;
  lesson_id: string;
  lesson_title: string;
  lesson_description: string | null;
  learning_track_id: string;
  learning_track_title: string;
  available_date: string;
  reminder_type: 'available_now' | 'available_soon' | 'overdue';
}

interface ReminderResult {
  success: boolean;
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract base URL from request headers
    const origin = req.headers.get('origin') || 
                   req.headers.get('referer')?.replace(/\/.*$/, '') || 
                   'http://localhost:5173';
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for test mode
    let testMode = false;
    let testEmail = '';
    try {
      const requestBody = await req.json();
      testMode = requestBody.test_mode === true;
      testEmail = requestBody.test_email || 'naresh@raynsecure.com';
    } catch {
      // No request body or invalid JSON, continue with normal mode
    }

    console.log(`Starting lesson reminder job... (test_mode: ${testMode})`);

    // Get users who need reminders
    const { data: remindersData, error: reminderError } = await supabase
      .rpc('get_users_needing_lesson_reminders') as { data: LessonReminderData[] | null, error: any };
    
    let reminders = remindersData;

    if (reminderError) {
      console.error('Error fetching lesson reminders:', reminderError);
      throw reminderError;
    }

    if (!reminders || reminders.length === 0) {
      if (testMode) {
        console.log('Test mode: Creating a test reminder to demonstrate the email template');
        
        // Create a test reminder for demonstration
        const testReminder: LessonReminderData = {
          user_id: 'test-user-id',
          user_email: testEmail,
          lesson_id: 'test-lesson-id',
          lesson_title: 'Personal Data and You. Can you handle it?',
          lesson_description: "We all deal with people's personal data these days: clients, colleagues, customers, voters, you name it. We have to be careful. Why did one company get fined over 850 million dollars? Or a mayor gets fined 2 grand? It can be tricky: what can we do, what can't we do, what do we have to do? Let's take a look.",
          learning_track_id: 'test-track-id',
          learning_track_title: 'CSA Essentials for IT',
          available_date: new Date().toISOString().split('T')[0],
          reminder_type: 'available_now'
        };
        
        reminders = [testReminder];
        console.log('Test reminder created:', testReminder);
      } else {
        console.log('No lesson reminders to send');
        return new Response(
          JSON.stringify({
            success: true,
            processed: 0,
            sent: 0,
            failed: 0,
            message: 'No reminders needed',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    console.log(`Found ${reminders.length} reminders to send`);

    const result: ReminderResult = {
      success: true,
      processed: reminders.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const actualEmail = testMode ? testEmail : reminder.user_email;
        console.log(`Processing reminder for user ${actualEmail}${testMode ? ' (TEST MODE)' : ''}, lesson ${reminder.lesson_title}`);

        // Create notification title and message based on reminder type
        let title: string;
        let message: string;
        let priority: 'low' | 'normal' | 'high' = 'normal';

        switch (reminder.reminder_type) {
          case 'available_now':
            title = `New Lesson Available: ${reminder.lesson_title}`;
            message = `Your lesson "${reminder.lesson_title}" from ${reminder.learning_track_title} is now available!`;
            priority = 'high';
            break;
          case 'available_soon':
            const daysUntil = Math.ceil(
              (new Date(reminder.available_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            title = `Upcoming Lesson: ${reminder.lesson_title}`;
            message = `Your lesson "${reminder.lesson_title}" will be available in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
            priority = 'normal';
            break;
          case 'overdue':
            title = `Reminder: Complete ${reminder.lesson_title}`;
            message = `Don't forget to complete your lesson "${reminder.lesson_title}" from ${reminder.learning_track_title}`;
            priority = 'high';
            break;
          default:
            title = `Lesson Reminder: ${reminder.lesson_title}`;
            message = `Reminder about your lesson "${reminder.lesson_title}"`;
        }

        // Send email notification directly to email_notifications table
        let emailNotificationId: string | null = null;
        try {
          // Format the available date nicely
          const formattedDate = new Date(reminder.available_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          const emailResult = await supabase.functions.invoke('send-email', {
            body: {
              to: testMode ? testEmail : reminder.user_email,
              subject: testMode ? `[TEST] ${title}` : title,
              html: generateEmailContent(
                reminder.lesson_title,
                reminder.lesson_description || '',
                reminder.learning_track_title,
                formattedDate,
                reminder.reminder_type,
                origin
              ),
            },
          });

          if (emailResult.error) {
            console.error('Error sending email:', emailResult.error);
            result.errors.push(`Email error for ${reminder.user_email}: ${emailResult.error.message}`);
          } else {
            console.log(`Email sent successfully to ${actualEmail}${testMode ? ' (TEST MODE)' : ''}`);
            
            // Create email notification record
            const { data: emailNotif } = await supabase
              .from('email_notifications')
              .insert({
                user_id: reminder.user_id,
                type: 'lesson_reminder',
                title: title,
                message: message,
                email: actualEmail,
                status: 'sent',
              })
              .select()
              .single();
            
            if (emailNotif) {
              emailNotificationId = emailNotif.id;
            }
          }
        } catch (emailError: any) {
          console.error('Error with email:', emailError);
          result.errors.push(`Email error for ${reminder.user_email}: ${emailError.message}`);
        }

        // Record reminder history
        const { error: historyError } = await supabase
          .from('lesson_reminder_history')
          .insert({
            user_id: reminder.user_id,
            lesson_id: reminder.lesson_id,
            learning_track_id: reminder.learning_track_id,
            reminder_type: reminder.reminder_type,
            available_date: reminder.available_date,
            email_notification_id: emailNotificationId,
          });

        if (historyError) {
          console.error('Error recording reminder history:', historyError);
          // Don't fail the whole process for history errors
        }

        // Update or create reminder count record
        // First, get current count
        const { data: currentCount } = await supabase
          .from('lesson_reminder_counts')
          .select('reminder_count')
          .eq('user_id', reminder.user_id)
          .eq('lesson_id', reminder.lesson_id)
          .single();

        const newCount = (currentCount?.reminder_count || 0) + 1;

        const { error: countError } = await supabase
          .from('lesson_reminder_counts')
          .upsert({
            user_id: reminder.user_id,
            lesson_id: reminder.lesson_id,
            learning_track_id: reminder.learning_track_id,
            reminder_count: newCount,
            last_reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,lesson_id'
          });

        if (countError) {
          console.error('Error updating reminder count:', countError);
          // Don't fail the whole process for count errors
        }

        result.sent++;
        console.log(`Successfully processed reminder for ${reminder.user_email}`);
      } catch (error: any) {
        console.error(`Error processing reminder for ${reminder.user_email}:`, error);
        result.errors.push(`${reminder.user_email}: ${error.message}`);
        result.failed++;
      }
    }

    console.log('Lesson reminder job completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Fatal error in lesson reminder function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Generate email content for lesson reminders (no wrapper HTML)
// The send-email function will add the branded wrapper
function generateEmailContent(
  lessonTitle: string,
  lessonDescription: string,
  trackTitle: string,
  availableDate: string,
  reminderType: string,
  origin: string
): string {
  const isAvailableNow = reminderType === 'available_now';
  const isAvailableSoon = reminderType === 'available_soon';
  
  // Return just the content - send-email will add the wrapper
  return `
    <h2>${isAvailableNow ? 'New Lesson Available!' : 'Lesson Reminder'}</h2>
    
    <p>Hello,</p>
    
    <p>${isAvailableNow ? 'A new lesson is now available in your learning track!' : 'This is a reminder about an upcoming lesson in your learning track.'}</p>
    
    <h3>${lessonTitle}</h3>
    
    <p>${lessonDescription || 'Continue your cybersecurity learning journey with this essential lesson. Build your skills and stay ahead of evolving threats.'}</p>
    
    <div style="background-color: #f0f9f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #359D8A;">
      <p><strong>Learning Track:</strong> ${trackTitle}</p>
      <p><strong>Available Date:</strong> ${availableDate}</p>
    </div>
    
    ${isAvailableNow ? `
      <div style="background-color: #ecfdf5; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #67C171;">
        <p style="margin: 0; color: #065F46; font-size: 16px; font-weight: 600;">
          ✅ This lesson is available now! Start learning today.
        </p>
      </div>
    ` : isAvailableSoon ? `
      <div style="background-color: #FEF3C7; padding: 15px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
        <p style="margin: 0; color: #92400E; font-size: 16px; font-weight: 600;">
          ⏰ This lesson will be available soon. Get ready!
        </p>
      </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${origin}" 
         style="display: inline-block; background: #359D8A; color: white !important; text-decoration: none !important; padding: 15px 30px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; text-align: center; min-width: 200px;">
        ${isAvailableNow ? 'Start Lesson →' : 'View Learning Track →'}
      </a>
    </div>
    
    <p style="text-align: center; color: #868686; font-size: 14px;">
      Stay on track with your cybersecurity training and keep building your skills!
    </p>
  `;
}
