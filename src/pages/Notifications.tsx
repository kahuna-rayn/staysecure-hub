import React, { useEffect } from 'react';
import { EmailNotifications } from '../modules/notifications/src/components/EmailNotifications';
import { supabase } from '../config/supabase';
import { useAuth } from '@staysecure/auth';

// Import UI components from hub app
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

export const EmailNotificationsWrapper: React.FC = () => {
  const { user } = useAuth();

  // Get the current user profile for RLS policies
  const [userProfile, setUserProfile] = React.useState<any>(null);
  
  useEffect(() => {
    const getProfile = async () => {
      if (user?.id) {
        // Get Supabase auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
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
        fromEmail: 'team@raynsecure.com', // New unified system uses team@raynsecure.com
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
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-learning-primary">Email Notifications</h1>
          <p className="text-muted-foreground mt-1">Manage your email notification preferences</p>
        </div>
        <EmailNotificationsWrapper />
      </div>
    </div>
  );
};

export default Notifications;
