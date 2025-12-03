import React from 'react';
import { AuthProvider } from 'staysecure-auth';
import { EmailNotificationsWrapper } from 'staysecure-notifications';

const ModuleTest = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Module Test Page</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-2">Auth Module Test</h2>
          <div className="border p-4 rounded">
            <p>Auth module imported successfully! ✅</p>
            <p className="text-sm text-gray-600">Component: AuthProvider</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Notifications Module Test</h2>
          <div className="border p-4 rounded">
            <p>Notifications module imported successfully! ✅</p>
            <p className="text-sm text-gray-600">Component: EmailNotificationsWrapper</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModuleTest;

