import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  authError?: string;
}

const AuthPage: React.FC<AuthPageProps> = ({ authError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showActivateAccount, setShowActivateAccount] = useState(false);
  
  const { signIn, signOut, user, loading, error, sendActivationEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showActivateAccount) {
      await sendActivationEmail(email);
    } else {
      await signIn(email, password);
    }
  };

  const handleActivateAccount = () => {
    setShowActivateAccount(true);
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    console.log('Forgot password clicked');
  };

  if (user) {
    return (
      <div className="min-h-screen bg-learning-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>You are logged in as {user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-learning-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {showActivateAccount ? 'Activate Account' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {showActivateAccount 
              ? 'Enter your email to receive an activation link'
              : 'Enter your credentials to access your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {!showActivateAccount && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {(error || authError) && (
              <Alert variant="destructive">
                <AlertDescription>{authError || error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showActivateAccount ? 'Send Activation Email' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            <Button
              variant="link"
              className="p-0 h-auto text-teal-600"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-teal-600"
              onClick={handleActivateAccount}
            >
              Activate Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
