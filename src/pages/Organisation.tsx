import React from 'react';
import { useAuth } from 'staysecure-auth';
import { OrganisationProvider, OrganisationPanel } from 'staysecure-organisation';
import { supabase } from '../config/supabase';

const OrganisationPage: React.FC = () => {
  const { user } = useAuth();

  const organisationConfig = {
    supabaseClient: supabase,
    // Add other config as needed
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to access the Organisation Management module.</p>
        </div>
      </div>
    );
  }

  return (
    <OrganisationProvider config={organisationConfig}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <OrganisationPanel />
        </div>
      </div>
    </OrganisationProvider>
  );
};

export default OrganisationPage;
