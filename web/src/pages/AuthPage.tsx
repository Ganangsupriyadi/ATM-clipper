import { LogIn, UserPlus } from "lucide-react";

import React, { useState } from "react";

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
    { username: "user2", password: "pass2" },
    { username: "admin", password: "admin123" },
    { username: "admin2", password: "admin123" },
  ];

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const userExists = testUsers.some(
      (u) => u.username === username && u.password === password
    );
    const usernameTaken = testUsers.some((u) => u.username === username);

    if (isLoginMode) {
      // Login logic
      if (userExists) {
        onLoginSuccess();
      } else {
        setError("Invalid username or password.");
      }
    } else {
      // Sign up logic (for test users, we just check if username is available)
      if (usernameTaken) {
        setError("Username already taken.");
      } else if (username && password) {
        // In a real app, you'd add the user to a database. Here, we mock.
        // For simplicity, we just allow signup if username not taken,
        // but it won't actually add to testUsers array dynamically.
        // User will still need to use user1/pass1 or user2/pass2.
        setError("Mock signup successful! Please use 'user1/pass1' or 'user2/pass2' to login for now.");
        setIsLoginMode(true); // Switch to login mode after mock signup
      } else {
        setError("Please enter both username and password.");
      }
    }
  };

  const pastelColors = {
    bgPrimary: "#e0f2f1", // Light teal/mint
    bgSecondary: "#ffffff",
    accent: "#4db6ac", // Medium teal
    textPrimary: "#263238",
    textSecondary: "#546e7a",
    border: "#b2dfdb",
  };

  return (
    <div
      style={{
        backgroundColor: pastelColors.bgPrimary,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: pastelColors.bgSecondary,
          padding: "40px",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          border: `1px solid ${pastelColors.border}`,
        }}
      >
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
          <div style={{ 
            backgroundColor: pastelColors.accent, 
            padding: "16px", 
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: `0 8px 20px ${pastelColors.accent}40`
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="2"/>
              <path d="M3 9h18" stroke="white"/>
              <path d="M9 21V9" stroke="white"/>
            </svg>
          </div>
        </div>
        
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            marginBottom: "8px",
            color: pastelColors.textPrimary,
            letterSpacing: "-0.5px"
          }}
        >
          ATM Clipper
        </h1>
        <p style={{ color: pastelColors.textSecondary, marginBottom: "32px", fontSize: "14px" }}>
          {isLoginMode ? "Welcome back! Please sign in." : "Create your account to start clipping."}
        </p>

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: pastelColors.textSecondary, marginLeft: "4px", marginBottom: "4px", display: "block" }}>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: `2px solid ${pastelColors.border}`,
                fontSize: "15px",
                color: pastelColors.textPrimary,
                backgroundColor: "#fff",
                outline: "none",
                transition: "border-color 0.2s"
              }}
            />
          </div>
          
          <div style={{ textAlign: "left" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: pastelColors.textSecondary, marginLeft: "4px", marginBottom: "4px", display: "block" }}>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "12px",
                border: `2px solid ${pastelColors.border}`,
                fontSize: "15px",
                color: pastelColors.textPrimary,
                backgroundColor: "#fff",
                outline: "none",
                transition: "border-color 0.2s"
              }}
            />
          </div>

          {error && (
            <div style={{ 
              backgroundColor: "#ffebee", 
              color: "#c62828", 
              padding: "10px", 
              borderRadius: "8px", 
              fontSize: "13px",
              marginTop: "4px"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: pastelColors.accent,
              color: "white",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px"
            }}
          >
            {isLoginMode ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Sign Up</>}
          </button>
        </form>

        <p style={{ marginTop: "25px", fontSize: "14px", color: pastelColors.textSecondary }}>
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError(null);
            }}
            style={{
              color: pastelColors.accent,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            {isLoginMode ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};