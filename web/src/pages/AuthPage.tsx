import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { getApiBase, normalizeBaseUrl, setAuthToken, clearAuthToken, verifyCredentials, STORAGE_URL_KEY } from '../api';

interface AuthPageProps { onLoginSuccess: () => void; }

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [backendUrl, setBackendUrl] = useState(() => getApiBase());
  const [showServer, setShowServer] = useState(false);
  const [username, setUsername] = useState('admin');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Normalizes "https://https://x.dev/" and keeps http:// for localhost.
    const url = normalizeBaseUrl(backendUrl);
    const cleanUser = username.trim();
    const cleanToken = token.trim();

    if (!url || !cleanUser || !cleanToken) {
      setError('Username dan password wajib diisi.');
      return;
    }
    if (cleanUser !== 'admin') {
      setError('Username harus "admin".');
      return;
    }

    setLoading(true);
    try {
      let check = await verifyCredentials(url, cleanToken);

      // Backend without /auth/check (older build): /history also proves the token
      // and is present in every version.
      if (check.result === 'legacy') {
        try {
          const res = await fetch(`${url}/history`, {
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              'ngrok-skip-browser-warning': 'true',
            },
          });
          check =
            res.status === 401 || res.status === 403
              ? { result: 'bad', status: res.status }
              : res.ok
                ? { result: 'ok', status: res.status }
                : { result: 'error', status: res.status, message: `HTTP ${res.status}` };
        } catch {
          check = { result: 'error', message: `tidak bisa menghubungi ${url}` };
        }
      }

      if (check.result === 'bad') {
        throw Object.assign(new Error('Unauthorized'), { status: 401 });
      }
      if (check.result === 'error') {
        throw new Error(check.message || 'gagal verifikasi');
      }

      const previousUrl = (localStorage.getItem(STORAGE_URL_KEY) || '').trim();
      if (previousUrl && previousUrl !== url) {
        // Job ids live in the backend's own DB: switching servers makes the
        // stored id invalid, and polling it spams 404s in the console.
        localStorage.removeItem('ac_active_job_id');
      }

      localStorage.setItem(STORAGE_URL_KEY, url);
      setAuthToken(cleanToken);
      onLoginSuccess();
    } catch (err: any) {
      clearAuthToken();
      const status = err?.status;
      const httpMatch = /^(?:HTTP )?(\d{3})$/.exec(String(err?.message || ''));
      const httpStatus = httpMatch ? Number(httpMatch[1]) : status;
      if (err instanceof TypeError) {
        setError(
          `Tidak bisa menghubungi ${url}. Cek: (1) URL lengkap termasuk .dev, (2) Cell 4B di Colab masih jalan.`,
        );
      } else if (httpStatus === 401) {
        setError('Password salah. Pakai token backend (API_SECRET_TOKEN).');
      } else if (httpStatus === 403) {
        setError(
          `Backend menolak (403) di ${url}. Biasanya tunnel ngrok sudah mati / sesi Kaggle-Colab berakhir — restart cell backend lalu pakai URL baru.`,
        );
      } else if (httpStatus && httpStatus >= 500) {
        setError(
          `Backend error ${httpStatus} di ${url}. Tunnel tersambung, tapi server gagal memproses. Cek log cell backend.`,
        );
      } else {
        const msg = err?.message || String(err);
        setError(
          /tidak bisa menghubungi/i.test(msg)
            ? `${msg}. Pastikan URL tunnel aktif dan Settings -> Internet = ON.`
            : `Gagal terhubung ke backend (${msg}).`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const pastelColors = {
    bgPrimary: '#e0f2f1',
    bgSecondary: '#ffffff',
    accent: '#10b981',
    textPrimary: '#1f2937',
    textSecondary: '#4b5563',
    border: '#b2dfdb',
  };

  return (
    <div style={{ backgroundColor: pastelColors.bgPrimary, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: pastelColors.bgSecondary, padding: '40px', borderRadius: '24px', width: '360px', textAlign: 'center', border: '1px solid ' + pastelColors.border, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ backgroundColor: pastelColors.accent, width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="32" height="32" fill="white"><polygon points="8,5 19,12 8,19" /></svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: pastelColors.textPrimary, marginBottom: '20px' }}>ATM_Clipper</h1>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" autoComplete="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '2px solid ' + pastelColors.border, fontSize: '13px' }} />
          <input type="password" autoComplete="current-password" placeholder="Password" value={token} onChange={(e) => setToken(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '2px solid ' + pastelColors.border, fontSize: '13px' }} />

          {/* Backend URL stays out of the way until it actually needs changing. */}
          <button
            type="button"
            onClick={() => setShowServer((v) => !v)}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '11px', color: pastelColors.textSecondary, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}
          >
            Server: {getApiBase()} {showServer ? '▲' : '▼'}
          </button>
          {showServer && (
            <input
              type="text"
              autoComplete="url"
              placeholder="https://xxxx.ngrok-free.app"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              style={{ padding: '10px', borderRadius: '12px', border: '2px solid ' + pastelColors.border, fontSize: '12px', fontFamily: 'monospace' }}
            />
          )}

          {error && <div style={{ color: '#ef4444', fontSize: '12px', textAlign: 'left' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ backgroundColor: pastelColors.accent, color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            <LogIn size={18} style={{ display: 'inline', marginRight: '8px' }} /> {loading ? 'Connecting...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
