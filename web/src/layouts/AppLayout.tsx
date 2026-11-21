import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Menu } from "lucide-react";

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // Plain CSS shell (ac-*): the Tailwind md:* variants kept getting dropped,
    // which stacked the mobile header on top of the sidebar.
    <div className="ac-shell">
      <header className="ac-topbar">
        <button
          className="ac-topbar-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu />
        </button>
        <span className="ac-topbar-brand">ATM Clipper</span>
        <span className="ac-topbar-badge">Cloud</span>
      </header>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="ac-main">
        <Outlet />
      </main>
    </div>
  );
};
