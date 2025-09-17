import React from 'react';
import LoginForm from './LoginForm';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-learning-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default AuthPage; 