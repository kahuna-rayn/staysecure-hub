import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Temporary component for testing activation flow
export const TestActivation: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendTestInvite = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // This requires admin privileges - you might need to do this from Supabase dashboard instead
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${window.location.origin}/activate-account`,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('✅ Invite sent! Check your email and click the activation link.');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  const goToActivationPage = () => {
    window.location.href = '/activate-account';
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test User Activation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Email:</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>
        
        <Button 
          onClick={sendTestInvite} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Test Invite'}
        </Button>
        
        <div className="text-center text-gray-500">OR</div>
        
        <Button 
          onClick={goToActivationPage}
          variant="outline"
          className="w-full"
        >
          Go Directly to Activation Page
        </Button>
        
        {message && (
          <div className={`p-3 rounded text-sm ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-4">
          <strong>Note:</strong> The invite function requires admin privileges. 
          For easier testing, use the Supabase dashboard to invite users.
        </div>
      </CardContent>
    </Card>
  );
};
