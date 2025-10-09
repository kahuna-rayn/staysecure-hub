/**
 * Example: How to integrate Lesson Reminders into your Organisation settings
 * 
 * This example shows how to add the Lesson Reminder Settings component
 * to your organisation's admin panel.
 * 
 * 📚 Complete Documentation:
 * - Current: ../LESSON_REMINDERS_QUICKSTART.md
 * - Next: ../NOTIFICATION_SYSTEM_OVERVIEW.md
 * - Index: ../NOTIFICATION_DOCUMENTATION_INDEX.md
 */

import React from 'react';
import { LessonReminderSettingsWrapper } from '@staysecure/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@staysecure/auth';

// Example 1: Basic Integration
export const OrganisationSettingsBasic = () => {
  const organisationId = 'your-org-id-here';
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Organisation Settings</h1>
      
      <LessonReminderSettingsWrapper organisationId={organisationId} />
    </div>
  );
};

// Example 2: Integrated with other settings tabs
export const OrganisationSettingsTabbed = () => {
  const organisationId = 'your-org-id-here';
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Organisation Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="reminders">Lesson Reminders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div>General organisation settings...</div>
        </TabsContent>
        
        <TabsContent value="users">
          <div>User management...</div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <div>Notification preferences...</div>
        </TabsContent>
        
        <TabsContent value="reminders">
          <LessonReminderSettingsWrapper organisationId={organisationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Example 3: With authentication and role checking
export const OrganisationSettingsProtected = () => {
  const { user, profile } = useAuth();
  const [organisationId, setOrganisationId] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    // Fetch user's organisation and check if they're an admin
    const checkAccess = async () => {
      if (!user) return;
      
      // Your logic to get organisation and check role
      const userOrg = await getUserOrganisation(user.id);
      const adminRole = await checkIfAdmin(user.id, userOrg?.id);
      
      setOrganisationId(userOrg?.id || null);
      setIsAdmin(adminRole);
    };
    
    checkAccess();
  }, [user]);
  
  if (!user) {
    return <div>Please log in to access settings.</div>;
  }
  
  if (!isAdmin) {
    return <div>You need administrator access to manage reminder settings.</div>;
  }
  
  if (!organisationId) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Lesson Reminder Settings</h1>
      
      <LessonReminderSettingsWrapper organisationId={organisationId} />
    </div>
  );
};

// Example 4: Programmatically trigger reminders
export const ManualReminderTrigger = () => {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  
  const triggerReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('trigger_lesson_reminders');
      
      if (error) throw error;
      
      setResult(data);
      alert(`Success! Sent ${data.sent} reminders`);
    } catch (error) {
      console.error('Error triggering reminders:', error);
      alert('Failed to trigger reminders');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Manual Reminder Control</h2>
      
      <button
        onClick={triggerReminders}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Reminders Now'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Example 5: View reminder history
export const ReminderHistory = () => {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_reminder_history')
        .select(`
          *,
          lessons (title),
          learning_tracks (title)
        `)
        .order('sent_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading history...</div>;
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recent Reminder History</h2>
      
      <div className="space-y-2">
        {history.map((item) => (
          <div key={item.id} className="p-3 border rounded">
            <div className="flex justify-between">
              <span className="font-medium">{item.lessons?.title}</span>
              <span className="text-sm text-gray-500">
                {new Date(item.sent_at).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Track: {item.learning_tracks?.title}
            </div>
            <div className="text-xs text-gray-500">
              Type: {item.reminder_type} • 
              Email: {item.email_sent ? '✓' : '✗'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions (implement based on your setup)
async function getUserOrganisation(userId: string) {
  // Your implementation
  return { id: 'org-id' };
}

async function checkIfAdmin(userId: string, orgId: string) {
  // Your implementation
  return true;
}

// Note: Import supabase client
import { supabase } from '@/integrations/supabase/client';
