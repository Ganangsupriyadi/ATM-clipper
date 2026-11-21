import React from "react";
import { Scissors, Clock, RefreshCw, X, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { apiCheckHealth, clearAuthToken } from "../api";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const [status, setStatus] = React.useState<"connected" | "disconnected" | "reconnecting">("connected");
  const currentYear = new Date().getFullYear();

  const checkHealth = React.useCallback(async () => {
    try {
      const isOk = await apiCheckHealth();
      setStatus(isOk ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  React.useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Drawer must never stay open by accident: close on Escape and as soon as the
  // window becomes wide enough to show the permanent sidebar.
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (mq.matches && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, [isOpen, onClose]);

  const reconnect = async () => {
    setStatus("reconnecting");
    await checkHealth();
  };

  const handleLogout = () => {
    clearAuthToken();
    window.location.reload();
  };

  const isConnected = status === "connected";
  const isReconnecting = status === "reconnecting";

  const statusLabel = {
    connected: "Connected to Colab",
    disconnected: "Colab Offline",
    reconnecting: "Reconnecting...",
  }[status];

  const renderNavContent = (isMobile: boolean) => (
    <>
      <div className="ac-sidebar-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="ac-brand">ATM_Clipper</h1>
          <span className="ac-brand-badge">Cloud</span>
        </div>
        {isMobile && onClose && (
          <button className="ac-foot-btn" style={{ width: "auto", marginTop: 0 }} onClick={onClose} aria-label="Close menu">
            <X />
          </button>
        )}
      </div>

      <nav className="ac-nav">
        <div className="ac-nav-label">Menu</div>

        <NavLink
          to="/"
          onClick={() => onClose && onClose()}
          className={({ isActive }) => `ac-nav-item${isActive ? " is-active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <Scissors />
              <span>Workspace</span>
              {isActive && <span className="ac-nav-dot" />}
            </>
          )}
        </NavLink>

        <NavLink
          to="/history"
          onClick={() => onClose && onClose()}
          className={({ isActive }) => `ac-nav-item${isActive ? " is-active" : ""}`}
        >
          {({ isActive }) => (
            <>
              <Clock />
              <span>History</span>
              {isActive && <span className="ac-nav-dot" />}
            </>
          )}
        </NavLink>
      </nav>

      <div className="ac-sidebar-foot">
        <div className="ac-status">
          <span
            className={`ac-status-dot ${
              isConnected ? "on" : isReconnecting ? "warn" : "off"
            }`}
          />
          <span>{statusLabel}</span>
        </div>

        {(status === "disconnected" || isReconnecting) && (
          <button type="button" className="ac-foot-btn primary" onClick={reconnect} disabled={isReconnecting}>
            <RefreshCw className={isReconnecting ? "animate-spin" : ""} />
            {isReconnecting ? "Reconnecting..." : "Reconnect"}
          </button>
        )}

        <button type="button" className="ac-foot-btn danger" onClick={handleLogout}>
          <LogOut />
          Logout
        </button>

        <div className="ac-foot-meta">
          <div>&copy; {currentYear} ATM_Clipper</div>
          <a href="https://auto-clipper.dhims.web.id" target="_blank" rel="noreferrer">
            Official Website
          </a>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Permanent sidebar (≥768px), plain CSS so the classes can't be purged */}
      <aside className="ac-sidebar">{renderNavContent(false)}</aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div className="ac-drawer-backdrop" onClick={onClose} aria-hidden="true" />
          <aside className="ac-drawer">{renderNavContent(true)}</aside>
        </>
      )}
    </>
  );
};

export default Sidebar;

