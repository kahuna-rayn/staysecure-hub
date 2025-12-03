import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "staysecure-auth";
import { supabase } from "./config/supabase";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import { ResetPassword } from "staysecure-auth";
import { ActivateAccount } from "staysecure-auth";
import Notifications from "./pages/Notifications";
import EmailSettings from "./pages/EmailSettings";
import Organisation from "./pages/Organisation";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const hash = location.hash || '';
    const searchParams = new URLSearchParams(location.search);
    
// Check if this is a password reset or activation link
if (hash.includes('type=recovery') || searchParams.get('type') === 'recovery') {
  // If we're already on activate-account page, stay there
  if (location.pathname === '/activate-account') {
    return;
  }
  
  // Otherwise, redirect to reset password page
  navigate('/reset-password' + location.search + location.hash, { replace: true });
  return;
}

// Check if this is an account activation link
if (hash.includes('type=invite') || searchParams.get('type') === 'invite') {
  navigate('/activate-account' + location.search + location.hash, { replace: true });
}
    
    // Check if this is an account activation link
    if (hash.includes('type=invite') || searchParams.get('type') === 'invite') {
      // Redirect to activation page with the hash/search params
      navigate('/activate-account' + location.search + location.hash, { replace: true });
    }
  }, [location.pathname, location.hash, location.search, navigate]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider config={{ supabaseClient: supabase }}>
      <BrowserRouter>
        <RecoveryRedirect />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activate-account" element={<ActivateAccount />} />
          <Route path="/email-notifications" element={<Notifications />} />
          <Route path="/email-settings" element={<EmailSettings />} />
          <Route path="/organisation" element={<Organisation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;