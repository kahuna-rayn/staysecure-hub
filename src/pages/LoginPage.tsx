import React from "react";
import { useAuth } from "staysecure-auth";
import { LoginForm } from "staysecure-auth";
import Dashboard from "./Dashboard";
import { ActivationTest } from "../components/ActivationTest";

const LoginPage: React.FC = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>StaySecure Hub</h1>
          <p>Modular Architecture Testing App</p>
        </div>
        <div className="login-form-container">
          <LoginForm />
        </div>
        
        {/* Temporary test component - remove after testing */}
        <ActivationTest />
      </div>
    </div>
  );
};

export default LoginPage;