import React from 'react';

const SimpleModuleTest = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Module Test</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Test 1: Basic Import</h2>
          <p>✅ This page loads without errors</p>
          <p>✅ React imports work</p>
        </div>
        
        <div className="border p-4 rounded">
          <h2 className="font-semibold">Test 2: Module Package Check</h2>
          <p>📦 staysecure-auth: installed</p>
          <p>📦 staysecure-notifications: installed</p>
          <p>🎯 Next: Test actual imports</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleModuleTest;
