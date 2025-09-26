import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

export const ActivationTest: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testActivation = async () => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      console.log('Testing activation for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'TempPassword123!',
        options: {
          emailRedirectTo: `${window.location.origin}/activate-account`,
        }
      });

      console.log('Supabase response:', { data, error });
      setResult({ data, error });

      if (error) {
        setError(error.message);
      } else {
        setResult(prev => ({ ...prev, success: 'Check your email for activation link!' }));
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Activation Email Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="email"
          placeholder="Enter email to test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <Button onClick={testActivation} disabled={loading || !email}>
          {loading ? 'Testing...' : 'Test Activation Email'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
