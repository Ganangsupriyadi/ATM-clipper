import React, { useEffect, useState } from "react";
import { AuthPage } from "../pages/AuthPage";
import { getAuthToken, apiFetch } from "../api";

export interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(Boolean(getAuthToken()));

  // Re-validate a stored token on reload so a page refresh doesn't force a
  // second login (the login flow reloads after the backend URL changes).
  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    // /history is present in every backend build, /auth/check only in newer ones.
    apiFetch("/auth/check")
      .catch((err: any) => (err?.status === 404 ? apiFetch("/history") : Promise.reject(err)))
      .then(() => { if (!cancelled) setIsAuthenticated(true); })
      .catch(() => { if (!cancelled) setIsAuthenticated(false); })
      .finally(() => { if (!cancelled) setIsChecking(false); });
    return () => { cancelled = true; };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2f1', color: '#4b5563', fontFamily: 'sans-serif', fontSize: '14px' }}>
        Menghubungkan ke backend...
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <AuthPage onLoginSuccess={handleLoginSuccess} />;
};

export default AuthGate;
