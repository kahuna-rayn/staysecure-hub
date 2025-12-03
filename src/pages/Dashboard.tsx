import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "staysecure-auth";
import { createUseUserRole } from "../modules/database/src/hooks/useUserRole";
import { supabase } from "../config/supabase";
import LoginPage from "./LoginPage";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  
  // Create the useUserRole hook with dependencies - ALWAYS create it, don't conditionally
  const useUserRole = createUseUserRole({
    supabaseClient: supabase,
    useAuth: () => ({ user })
  });
  
  // ALWAYS call the hook - don't conditionally call it
  const { 
    role, 
    isAdmin, 
    hasAdminAccess, 
    loading: roleLoading,
    getRoleDisplayName 
  } = useUserRole();
  
  // If not logged in, show login page
  if (!user && !authLoading) {
    return <LoginPage />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-learning-primary">StaySecure Hub</h1>
            <p className="text-muted-foreground mt-1">Modular Architecture Testing App</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user?.full_name || user?.email}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium">{getRoleDisplayName()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admin Access</p>
              <p className="font-medium">{hasAdminAccess ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-medium text-xs">{user?.id}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Module Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800">Auth Module</h4>
              <p className="text-green-600">✅ Working</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800">Database Module</h4>
              <p className="text-green-600">✅ Working</p>
              <p className="text-sm text-gray-600">{role || "No role assigned"}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800">Organisation Module</h4>
              <p className="text-green-600">✅ Available</p>
              <p className="text-sm text-gray-600">User and role management</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800">Notifications Module</h4>
              <p className="text-green-600">✅ Working</p>
              <p className="text-sm text-gray-600">Email notifications available</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/organisation')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Organisation Management
            </button>
            <button 
              onClick={() => navigate('/email-settings')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Email Settings
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;