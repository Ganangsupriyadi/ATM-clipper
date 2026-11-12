import React, { useState, useEffect } from "react";
import { AuthPage } from "../pages/AuthPage";

export interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('is_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
};

export default AuthGate;
