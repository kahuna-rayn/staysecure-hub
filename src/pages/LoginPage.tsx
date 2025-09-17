import React from "react";
import { useAuth } from "../modules/auth/src/components/AuthProvider";
import LoginForm from "../modules/auth/src/components/LoginForm";
import Dashboard from "./Dashboard";

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
          <LoginForm onSwitchToSignUp={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;