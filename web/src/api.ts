import type { CreateJobPayload, JobResponse } from "./types/job";

export const STORAGE_URL_KEY = "AUTO_CLIPPER_API_URL";

/**
 * Collapse whatever the user pasted ("https://https://x.dev", "x.dev/", " 127.0.0.1:8000 ")
 * into one clean base URL. A doubled scheme makes fetch throw TypeError, which the
 * login screen used to report as "cannot reach backend".
 */
export function normalizeBaseUrl(raw: string): string {
  let s = (raw || "").trim().replace(/\/+$/, "");
  if (!s) return "";
  const m = s.match(/^(https?):\/\//i);
  const scheme = m ? m[1].toLowerCase() : null;
  if (scheme) s = s.slice(m![0].length);
  // Strip any further duplicated schemes the user pasted in front of the host.
  s = s.replace(/^(https?:\/\/)+/i, "");
  if (!s) return "";
  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(s);
  return `${scheme || (isLocal ? "http" : "https")}://${s}`;
}

// Resolved per call, not at module load: the login screen sets the backend URL
// at runtime, and a frozen constant would keep pointing at localhost.
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_URL_KEY) || localStorage.getItem("ac_api_url");
    if (saved) return normalizeBaseUrl(saved);
  }
  return normalizeBaseUrl((import.meta.env.VITE_API_URL as string) || "http://localhost:8000");
}

/** @deprecated use getApiBase() — kept only so old imports don't break */
export const API_URL = "";

export const STORAGE_AUTH_KEY = "AUTO_CLIPPER_WEB_TOKEN";
export const STORAGE_AUTH_LEGACY_KEY = "ac_web_token";

export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem(STORAGE_AUTH_KEY) ||
    localStorage.getItem(STORAGE_AUTH_LEGACY_KEY) ||
    ""
  );
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  const trimmed = token.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_AUTH_KEY, trimmed);
    localStorage.setItem(STORAGE_AUTH_LEGACY_KEY, trimmed);
    window.dispatchEvent(new CustomEvent("ac_auth_changed", { detail: { token: trimmed } }));
  } else {
    clearAuthToken();
  }
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_AUTH_KEY);
  localStorage.removeItem(STORAGE_AUTH_LEGACY_KEY);
  window.dispatchEvent(new CustomEvent("ac_auth_changed", { detail: { token: "" } }));
}

export function hasAuthToken(): boolean {
  return Boolean(getAuthToken());
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Verify a token against a backend and distinguish "wrong password" from
 * "endpoint missing" (older backend without /auth/check).
 *
 * Returns:
 *   "ok"       - token accepted
 *   "bad"      - 401/403: wrong token
 *   "legacy"   - /auth/check absent (404): backend is an older build, caller
 *                should fall back to /history
 *   "error"    - anything else; `message` explains which status
 */
export async function verifyCredentials(
  baseUrl: string,
  token: string
): Promise<{ result: "ok" | "bad" | "legacy" | "error"; status?: number; message?: string }> {
  const base = normalizeBaseUrl(baseUrl);
  const headers = {
    Authorization: `Bearer ${token}`,
    "ngrok-skip-browser-warning": "true",
  };

  let res: Response;
  try {
    res = await fetch(`${base}/auth/check`, { headers });
  } catch {
    return { result: "error", message: `tidak bisa menghubungi ${base}` };
  }

  // 404 = backend predates /auth/check, not a credential problem.
  if (res.status === 404) return { result: "legacy" };
  if (res.status === 401 || res.status === 403) return { result: "bad", status: res.status };
  if (!res.ok) return { result: "error", status: res.status, message: `HTTP ${res.status}` };

  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) {
    return { result: "error", status: res.status, message: "respons bukan JSON, cek URL backend" };
  }
  return { result: "ok", status: res.status };
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${getApiBase()}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // ngrok free serves an HTML interstitial to browser requests; this opts out.
  headers.set("ngrok-skip-browser-warning", "true");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("ac_unauthorized"));
    throw new ApiError("Unauthorized: Token invalid or expired", 401);
  }

  let data: any = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === "object" && (data.message || data.detail || data.error)) ||
      `Request failed with status ${response.status}`;
    // Surface the server's message in the console too; the thrown error alone
    // shows up as a bare 400 in the Network log.
    console.error(`[api] ${options.method || "GET"} ${url} -> ${response.status}: ${errorMsg}`, data);
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export async function apiCheckHealth(): Promise<boolean> {
  try {
    const res = await apiFetch<{ status: string }>("/health");
    return res?.status === "ok";
  } catch {
    return false;
  }
}

export async function apiCreateJob(
  payload: CreateJobPayload
): Promise<{ status: string; job_id: string; message?: string }> {
  try {
    return await apiFetch<{ status: string; job_id: string; message?: string }>("/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    // If 404, fallback to /api/jobs
    if (err.status === 404) {
      return await apiFetch<{ status: string; job_id: string; message?: string }>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function apiGetJob(jobId: string): Promise<JobResponse> {
  try {
    return await apiFetch<JobResponse>(`/jobs/${jobId}`);
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<JobResponse>(`/api/jobs/${jobId}`);
    }
    throw err;
  }
}

export async function apiResumeJob(
  jobId: string,
  payload?: {
    api_key?: string;
    provider?: string;
    custom_base_url?: string;
    custom_model_name?: string;
    whisper_model?: string;
    model?: string;
  }
): Promise<{ status: string; job_id: string; message?: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ status: string; job_id: string; message?: string }>(
      `/jobs/${safeId}/resume`,
      {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }
    );
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string; job_id: string; message?: string }>(
        `/api/jobs/${safeId}/resume`,
        {
          method: "POST",
          body: JSON.stringify(payload || {}),
        }
      );
    }
    throw err;
  }
}

export async function apiResumeManualJob(
  jobId: string,
  jsonPayload: string
): Promise<{ status: string; job_id: string; message?: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ status: string; job_id: string; message?: string }>(
      `/jobs/${safeId}/resume-manual`,
      {
        method: "POST",
        body: JSON.stringify({ json_payload: jsonPayload }),
      }
    );
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string; job_id: string; message?: string }>(
        `/api/jobs/${safeId}/resume-manual`,
        {
          method: "POST",
          body: JSON.stringify({ json_payload: jsonPayload }),
        }
      );
    }
    throw err;
  }
}

export async function apiCancelJob(jobId: string): Promise<{ status: string }> {
  try {
    return await apiFetch<{ status: string }>(`/jobs/${jobId}/cancel`, {
      method: "POST",
    });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string }>(`/api/jobs/${jobId}/cancel`, {
        method: "POST",
      });
    }
    throw err;
  }
}

/**
 * Upload a video from the user's PC. The backend stores it under the workspace
 * and returns `local:<abs path>`, which /jobs accepts as a source URL.
 */
export async function apiUploadVideo(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch<{ url: string }>("/upload", { method: "POST", body: fd });
  if (!res?.url) throw new Error("Upload gagal: backend tidak mengembalikan path.");
  return res.url;
}

/**
 * Upload a canvas background/poster image and return its absolute path on the
 * backend. Canvas mode hands this path straight to ffmpeg, so the browser's
 * `blob:` URL is useless there — it must be a real server-side file.
 */
export async function apiUploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch<{ path: string }>("/upload/image", { method: "POST", body: fd });
  if (!res?.path) throw new Error("Upload gambar gagal: backend tidak mengembalikan path.");
  return res.path;
}

export function getVideoStreamUrl(pathOrUrl: string, version?: number): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const vParam = version !== undefined && version !== 0 ? `&v=${version}` : "";
  // ngrok-skip-browser-warning: <video>/<a download> can't send custom headers,
  // so the query param form is the only way to bypass ngrok's HTML interstitial.
  return `${getApiBase()}/video?path=${encodeURIComponent(pathOrUrl)}${vParam}&ngrok-skip-browser-warning=1`;
}

export function getDownloadUrl(pathOrUrl: string, version?: number, customName?: string): string {
  const base = getVideoStreamUrl(pathOrUrl, version);
  if (!base) return "";
  
  try {
    // "http://localhost" is a dummy base required for URL() to parse relative paths
    const urlObj = new URL(base, "http://localhost");
    urlObj.searchParams.set("dl", "1");
    if (customName) {
      urlObj.searchParams.set("title", customName);
    }
    
    // Return relative if it was relative, otherwise absolute
    if (base.startsWith("/")) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }
    return urlObj.toString();
  } catch (e) {
    return base;
  }
}

export async function apiGetHistory(): Promise<JobResponse[]> {
  try {
    return await apiFetch<JobResponse[]>("/history");
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<JobResponse[]>("/api/history");
    }
    throw err;
  }
}

export async function apiDeleteHistory(jobId: string): Promise<{ status: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ status: string }>(`/history/${safeId}`, { method: "DELETE" });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string }>(`/api/history/${safeId}`, { method: "DELETE" });
    }
    throw err;
  }
}

export async function apiCreateRerenderJob(
  jobId: string,
  payload: any
): Promise<{ status: string; job_id: string; message?: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ status: string; job_id: string; message?: string }>(`/jobs/${safeId}/rerender`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string; job_id: string; message?: string }>(`/api/jobs/${safeId}/rerender`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function apiCreateRerunAiJob(
  jobId: string,
  payload: any
): Promise<{ status: string; job_id: string; message?: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ status: string; job_id: string; message?: string }>(`/jobs/${safeId}/rerun-ai`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string; job_id: string; message?: string }>(`/api/jobs/${safeId}/rerun-ai`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function apiGetClipWords(jobId: string, clipIndex: number): Promise<{ words: any[]; reason?: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ words: any[]; reason?: string }>(`/jobs/${safeId}/clips/${clipIndex}/words`, { method: "GET" });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ words: any[]; reason?: string }>(`/api/jobs/${safeId}/clips/${clipIndex}/words`, { method: "GET" });
    }
    throw err;
  }
}

export async function apiCorrectSubtitle(payload: any): Promise<{ status: string; words: any[]; message?: string }> {
  try {
    return await apiFetch<{ status: string; words: any[]; message?: string }>(`/ai/correct-subtitle`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string; words: any[]; message?: string }>(`/api/ai/correct-subtitle`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export async function apiCreateClipRerenderJob(
  jobId: string,
  clipIndex: number,
  payload: any
): Promise<{ status: string; job_id: string; message?: string }> {
  const safeId = encodeURIComponent(jobId);
  try {
    return await apiFetch<{ status: string; job_id: string; message?: string }>(`/jobs/${safeId}/clips/${clipIndex}/rerender`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    if (err.status === 404) {
      return await apiFetch<{ status: string; job_id: string; message?: string }>(`/api/jobs/${safeId}/clips/${clipIndex}/rerender`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw err;
  }
}

export interface GDriveItem {
  name: string;
  is_dir: boolean;
  path: string;
}

export async function apiBrowseGDrive(dirPath?: string): Promise<{ items: GDriveItem[], current_dir: string, parent_dir: string | null }> {
  try {
    const url = dirPath ? `/gdrive-browser?dir_path=${encodeURIComponent(dirPath)}` : `/gdrive-browser`;
    const response = await apiFetch<{ items: GDriveItem[], current_dir: string, parent_dir: string | null }>(url);
    return {
      items: response.items || [],
      current_dir: response.current_dir || "",
      parent_dir: response.parent_dir || null
    };
  } catch (err: any) {
    if (err.status === 404) {
      const fallbackUrl = dirPath ? `/api/gdrive-browser?dir_path=${encodeURIComponent(dirPath)}` : `/api/gdrive-browser`;
      try {
        const fallbackResponse = await apiFetch<{ items: GDriveItem[], current_dir: string, parent_dir: string | null }>(fallbackUrl);
        return {
          items: fallbackResponse.items || [],
          current_dir: fallbackResponse.current_dir || "",
          parent_dir: fallbackResponse.parent_dir || null
        };
      } catch {
        return { items: [], current_dir: "", parent_dir: null };
      }
    }
    return { items: [], current_dir: "", parent_dir: null };
  }
}
