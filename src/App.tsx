import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./modules/auth/src/components/AuthProvider";
import { supabase } from "./config/supabase";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const hash = location.hash || '';
    const searchParams = new URLSearchParams(location.search);
    
    // Check if this is a password reset link
    if (hash.includes('type=recovery') || searchParams.get('type') === 'recovery') {
      // Redirect to reset password page with the hash/search params
      navigate('/reset-password' + location.search + location.hash, { replace: true });
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;