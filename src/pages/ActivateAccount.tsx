import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabase';
import { useAuth } from "staysecure-auth";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const ActivateAccount: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activateUser, error: authError, loading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      // Parse tokens from hash fragment if present: #access_token=...&refresh_token=...&type=signup
      const hash = location.hash || window.location.hash;
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const type = params.get('type');
      const access = params.get('access_token');
      const refresh = params.get('refresh_token');

      // Handle recovery flow (from resetPasswordForEmail)
      // For recovery, we don't need to set session immediately - user will set password first
      if (type === 'recovery') {
        console.log('Recovery flow detected, user will set password');
        // Don't set session yet - let user set password first
        return;
      }

      // Handle signup/invite flows (if needed)
      if ((type === 'signup' || type === 'invite') && access && refresh) {
        setAccessToken(access);
        setRefreshToken(refresh);
        try {
          await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          });
        } catch (e) {
          console.error('setSession error', e);
        }
        return;
      }

      // Fallback: if a session already exists (Supabase may have handled invite), allow activation without tokens
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Set the email from the session user
        setEmail(session.user?.email || '');
        return; // authenticated; proceed to allow password setup
      }

      setError('Invalid or expired activation link. Please contact your administrator.');
      
      // For testing purposes, allow proceeding without valid session
      console.log('No valid session found - this is expected when testing directly');
    };

    void run();
  }, [location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await activateUser(password);
      setSuccess('Account activated successfully! Redirecting to login...');
      
      // Sign out the user after activation
      await signOut();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-learning-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Activate Your Account</CardTitle>
            <CardDescription>
              Set your password to complete your account activation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || authError) && (
                <Alert variant="destructive">
                  <AlertDescription>{error || authError}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                    placeholder="Confirm your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || authLoading}>
                {(loading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate Account
              </Button>
              
              <div className="text-center">
                <Button variant="link" onClick={() => navigate('/login')}>
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivateAccount;
