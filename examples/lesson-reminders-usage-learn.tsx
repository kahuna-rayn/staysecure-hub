// Example: How to use Lesson Reminder Settings in LEARN app
import React from 'react';
import { LessonReminderSettingsPage } from '@staysecure/notifications';
import { supabase } from '@/integrations/supabase/client';

// Option 1: Simple usage (auto-detects everything)
export const SimpleLessonReminders = () => {
  return <LessonReminderSettingsPage />;
};

// Option 2: Explicit configuration (recommended for production)
export const ConfiguredLessonReminders = () => {
  return (
    <LessonReminderSettingsPage 
      supabaseClient={supabase}
      // Optionally pass custom UI components if needed
      uiComponents={{
        // Your custom UI components here if needed
      }}
    />
  );
};

// Option 3: In a tabbed interface (like Email Settings)
export const EmailSettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1>Email Settings</h1>
      
      <div className="tabs">
        <div className="tab-list">
          <button>Email Preferences</button>
          <button>Lesson Reminders</button>
          <button>Email Templates</button>
        </div>
        
        <div className="tab-content">
          <LessonReminderSettingsPage />
        </div>
      </div>
    </div>
  );
};
