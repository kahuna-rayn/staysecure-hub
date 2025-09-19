import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

// Super simple test - just go directly to activation page
export const SimpleActivationTest: React.FC = () => {
  const [message, setMessage] = useState('');

  const goToActivationPage = () => {
    // Just navigate directly - no invite needed for testing
    window.location.href = '/activate-account';
  };

  const createTestUser = async () => {
    try {
      // Create a test user via signup (this usually works better than invites)
      const { data, error } = await supabase.auth.signUp({
        email: 'testuser@example.com',
        password: 'tempPassword123',
        options: {
          emailRedirectTo: `${window.location.origin}/activate-account`
        }
      });

      if (error) {
        setMessage(`❌ Error: ${error.message}`);
      } else {
        setMessage('✅ Test user created! Check your email for confirmation link.');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Simple Activation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Skip the invite complexity - just test the activation page directly!
        </p>
        
        <Button 
          onClick={goToActivationPage}
          className="w-full"
        >
          🚀 Test Activation Page UI
        </Button>
        
        <div className="text-center text-gray-500">OR</div>
        
        <Button 
          onClick={createTestUser}
          variant="outline"
          className="w-full"
        >
          Create Test User (Signup)
        </Button>
        
        {message && (
          <Alert className="mt-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-gray-500 mt-4">
          <strong>Note:</strong> The activation page will work even without a real invite link. 
          It will just show an error message, which is perfect for testing the UI!
        </div>
      </CardContent>
    </Card>
  );
};
