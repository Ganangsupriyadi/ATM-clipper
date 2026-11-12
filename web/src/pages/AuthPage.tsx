import React, { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testUsers = [
    { username: "user1", password: "pass1" },
    { username: "admin", password: "admin123" },
    { username: "admin2", password: "admin123" },
  ];

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const userExists = testUsers.some((u) => u.username === username && u.password === password);
    if (isLoginMode) {
      if (userExists) onLoginSuccess();
      else setError("Invalid username or password.");
    } else {
      setError("Sign up is disabled for this test.");
    }
  };

  const pastelColors = {
    bgPrimary: "#e0f2f1",
    bgSecondary: "#ffffff",
    accent: "#10b981",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    border: "#b2dfdb",
  };

  return (
    <div style={{ backgroundColor: pastelColors.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: pastelColors.bgSecondary, padding: "40px", borderRadius: "24px", width: "400px", textAlign: "center", border: `1px solid ${pastelColors.border}` }}>
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
          <div style={{ backgroundColor: pastelColors.accent, padding: "16px", borderRadius: "20px", color: "white" }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
          </div>
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: pastelColors.textPrimary }}>ATM_Clipper</h1>
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: "12px", borderRadius: "12px", border: `2px solid ${pastelColors.border}` }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "12px", borderRadius: "12px", border: `2px solid ${pastelColors.border}` }} />
          {error && <div style={{ color: "red", fontSize: "12px" }}>{error}</div>}
          <button type="submit" style={{ backgroundColor: pastelColors.accent, color: "white", padding: "12px", borderRadius: "12px", border: "none" }}>
            {isLoginMode ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Sign Up</>}
          </button>
        </form>
      </div>
    </div>
  );
};
