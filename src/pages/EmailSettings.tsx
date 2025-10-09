import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Settings, FileText } from 'lucide-react';
import { LessonReminderSettingsPage } from '../modules/notifications/src/components/LessonReminderSettingsPage';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '@staysecure/auth';
import { EmailNotifications } from '../modules/notifications/src/components/EmailNotifications';
import EmailTemplateManager from '../components/admin/EmailTemplateManager';
import RecentEmailNotifications from '../components/admin/RecentEmailNotifications';

export default function EmailSettings() {
  const [activeTab, setActiveTab] = useState('preferences');
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Email Settings</h1>
      </div>
      
      <p className="text-muted-foreground">
        Configure email notifications, lesson reminders, and email templates for your organization.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Reminders</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          {user ? (
            <EmailNotifications
              supabase={supabase}
              user={{ 
                id: user.id, // Real user ID from auth context
                email: user.email // Real user email from auth context
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
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Please log in to access email preferences.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <LessonReminderSettingsPage 
            supabaseClient={supabase}
            uiComponents={{
              Card,
              CardHeader,
              CardTitle,
              CardDescription,
              CardContent,
              Button,
              Switch,
              Input,
              Label,
              Alert,
              AlertDescription,
              Badge,
              Select,
              SelectContent,
              SelectItem,
              SelectTrigger,
              SelectValue,
              Separator,
              Tabs,
              TabsContent,
              TabsList,
              TabsTrigger
            }}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <EmailTemplateManager
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
            Alert={Alert}
            AlertDescription={AlertDescription}
            Dialog={Dialog}
            DialogContent={DialogContent}
            DialogHeader={DialogHeader}
            DialogTitle={DialogTitle}
            DialogTrigger={DialogTrigger}
            Popover={Popover}
            PopoverContent={PopoverContent}
            PopoverTrigger={PopoverTrigger}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <RecentEmailNotifications
            Button={Button}
            Card={Card}
            CardContent={CardContent}
            CardDescription={CardDescription}
            CardHeader={CardHeader}
            CardTitle={CardTitle}
            Input={Input}
            Label={Label}
            Badge={Badge}
            Select={Select}
            SelectContent={SelectContent}
            SelectItem={SelectItem}
            SelectTrigger={SelectTrigger}
            SelectValue={SelectValue}
            Alert={Alert}
            AlertDescription={AlertDescription}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
