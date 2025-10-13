import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailNotifications } from 'staysecure-notifications';
// Old component removed - functionality consolidated into EmailNotifications
import { supabase } from '../config/supabase';
import { useAuth } from 'staysecure-auth';

// Import UI components from hub app
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import EmailTemplateEditor from '../components/admin/EmailTemplateEditor';

const TestEmailSender: React.FC = () => {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState(user?.email || '');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const sendTestEmail = async () => {
    setSending(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: '✅ Test Email from RAYN Secure Hub',
          html: `
            <h2>Test Email Successful!</h2>
            <p>If you're reading this, the email notification system is working correctly.</p>
            <p><strong>Sent from:</strong> RAYN Secure Hub Test App</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>User:</strong> ${user?.email}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;" />
            <p style="color: #868686; font-size: 14px;">This email was sent to test the notification system. You can safely ignore it.</p>
          `
        }
      });

      if (error) {
        setResult({ error: error.message });
      } else {
        setResult({ success: true });
      }
    } catch (err: any) {
      setResult({ error: err.message || 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Test Email Sending</CardTitle>
        <CardDescription>
          Send a test email to verify the notification system is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="test-email">Email Address</Label>
          <Input
            id="test-email"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        
        <Button 
          onClick={sendTestEmail} 
          disabled={sending || !testEmail}
          className="w-full"
        >
          {sending ? 'Sending...' : 'Send Test Email'}
        </Button>
        
        {result?.success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✅ Test email sent successfully! Check your inbox.
            </AlertDescription>
          </Alert>
        )}
        
        {result?.error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              ❌ Error: {result.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export const EmailNotificationsWrapper: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = React.useState<any>(null);
  
  useEffect(() => {
    const getProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setUserProfile(data);
        }
      }
    };
    getProfile();
  }, [user]);

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Please log in to access email notifications.</p>
      </div>
    );
  }

  return (
    <EmailNotifications
      supabase={supabase}
      user={{ 
        id: userProfile?.id || user?.id,
        email: user?.email || userProfile?.email
      }}
      awsConfig={{
        lambdaUrl: '', // Not needed for new unified system
        fromEmail: 'team@raynsecure.com',
      }}
      Button={Button}
      Card={Card}
      CardContent={CardContent}
      CardDescription={CardDescription}
      CardHeader={CardHeader}
      CardTitle={CardTitle}
      Input={Input}
      Label={Label}
      Switch={Switch}
      Select={Select}
      SelectContent={SelectContent}
      SelectItem={SelectItem}
      SelectTrigger={SelectTrigger}
      SelectValue={SelectValue}
      Textarea={Textarea}
    />
  );
};

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-learning-primary">Notification System Test</h1>
            <p className="text-muted-foreground mt-1">Test and manage all notification features</p>
          </div>
          <Button onClick={() => navigate('/')} variant="outline">
            ← Back to Dashboard
          </Button>
        </div>
        
        {/* Status Banner */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>🔔 Notification System:</strong> All Edge Functions deployed and ready to test
          </AlertDescription>
        </Alert>
        
        {/* Tabs for different notification features */}
        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="test">🧪 Test Email</TabsTrigger>
            <TabsTrigger value="preferences">⚙️ Email Preferences</TabsTrigger>
            <TabsTrigger value="templates">📝 Template Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test" className="space-y-4">
            <TestEmailSender />
            
            <Card>
              <CardHeader>
                <CardTitle>📋 What Gets Tested</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>send-email</strong> Edge Function invocation</li>
                  <li>Lambda + AWS SES email delivery</li>
                  <li>RAYN Secure email branding (teal gradient, logo)</li>
                  <li>Email wrapper HTML rendering</li>
                  <li>End-to-end delivery to inbox</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-4">
            <EmailNotificationsWrapper />
          </TabsContent>
          
          
          <TabsContent value="templates" className="space-y-4">
            <EmailTemplateEditor
              Button={Button}
              Card={Card}
              CardContent={CardContent}
              CardDescription={CardDescription}
              CardHeader={CardHeader}
              CardTitle={CardTitle}
              Input={Input}
              Label={Label}
              Textarea={Textarea}
              Badge={Badge}
              Select={Select}
              SelectContent={SelectContent}
              SelectItem={SelectItem}
              SelectTrigger={SelectTrigger}
              SelectValue={SelectValue}
              Popover={Popover}
              PopoverContent={PopoverContent}
              PopoverTrigger={PopoverTrigger}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>ℹ️ About Email Templates</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Template System:</strong> Create reusable email templates with variable placeholders 
                  like {`{{user_name}}`} and {`{{lesson_title}}`} for dynamic content.
                </p>
                <p>
                  <strong>System Templates:</strong> Some templates are marked as "System" and cannot be deleted, 
                  but can be edited to customize the content while preserving the structure.
                </p>
                <p>
                  <strong>Variables:</strong> Use double curly braces to insert dynamic content: {`{{variable_name}}`}. 
                  Variables are automatically detected from your template content.
                </p>
                <p>
                  <strong>Integration:</strong> Templates work with the notification system to send personalized 
                  emails based on user actions and preferences.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
