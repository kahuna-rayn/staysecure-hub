import React from 'react';
import { LessonReminderSettings } from './LessonReminderSettings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { supabase } from '../../../../integrations/supabase/client';

export const LessonReminderSettingsWrapper: React.FC = () => {
  return (
    <LessonReminderSettings
      supabase={supabase}
      Card={Card}
      CardHeader={CardHeader}
      CardTitle={CardTitle}
      CardDescription={CardDescription}
      CardContent={CardContent}
      Button={Button}
      Switch={Switch}
      Input={Input}
      Label={Label}
      Alert={Alert}
      AlertDescription={AlertDescription}
    />
  );
};

export default LessonReminderSettingsWrapper;
