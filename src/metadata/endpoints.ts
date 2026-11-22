/**
 * API Endpoints & Backend Integration Layer
 * 
 * Configure your backend URL here or in .env (e.g. VITE_API_URL="https://api.yourbackend.com").
 * Each function attempts to fetch real data from your backend. If the backend is not
 * reachable or not implemented yet, it gracefully falls back to the rich metadata.
 */

export const API_CONFIG = {
  // Set your backend base URL here or in VITE_API_URL env variable
  baseUrl: (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "",
  timeoutMs: 3500,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export const API_ENDPOINTS = {
  // 1. Dashboard & Telemetry
  dashboard: {
    overview: "/api/dashboard/overview",
    activeCountries: "/api/dashboard/active-countries",
    visitorsTrend: "/api/dashboard/visitors",
    trafficSources: "/api/dashboard/traffic-sources",
    onlineNow: "/api/dashboard/online-now",
  },

  // 2. Events Stream
  events: {
    list: "/api/events",
    liveStream: "/api/events/live",
    stats: "/api/events/stats",
  },

  // 3. Conversion Funnels
  funnels: {
    list: "/api/funnels",
    getById: (id: string) => `/api/funnels/${id}`,
  },

  // 4. Retention & Heatmaps
  retention: {
    cohorts: "/api/retention/cohorts",
    benchmark: "/api/retention/benchmark",
  },

  // 5. User Flows
  flows: {
    paths: "/api/flows/paths",
    dropoffs: "/api/flows/dropoffs",
  },

  // 6. Audiences & Profiles
  audiences: {
    segments: "/api/audiences/segments",
    cohorts: "/api/audiences/cohorts",
    profiles: "/api/audiences/profiles",
    profileById: (id: string) => `/api/audiences/profiles/${id}`,
  },

  // 7. Notifications & Activity Feed
  notifications: {
    list: "/api/notifications",
    markRead: "/api/notifications/read",
  },

  // 7. Integrations & Configuration
  integrations: {
    list: "/api/integrations",
    toggle: (id: string) => `/api/integrations/${id}/toggle`,
  },

  // 8. Settings & API Keys
  settings: {
    get: "/api/settings",
    update: "/api/settings",
    regenerateKey: "/api/settings/keys/regenerate",
  },

  // 9. Kanban Board & Tasks
  kanban: {
    board: "/api/kanban/board",
    move: "/api/kanban/move",
    createIssue: "/api/kanban/issues",
  },
};

/**
 * Universal backend fetch wrapper.
 * Attempts to load from the backend endpoint; falls back to the local metadata smoothly.
 */
export async function fetchApiData<T>(
  endpoint: string,
  fallbackData: T,
  options?: RequestInit
): Promise<{ data: T; isLive: boolean; error?: string }> {
  if (!API_CONFIG.baseUrl) {
    // No backend URL provided yet - using rich metadata
    return { data: fallbackData, isLive: false };
  }

  const url = `${API_CONFIG.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options?.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    return { data: json as T, isLive: true };
  } catch (err: any) {
    console.warn(`[API] Endpoint "${endpoint}" unreachable (${err?.message || err}). Falling back to local metadata.`);
    return { data: fallbackData, isLive: false, error: err?.message };
  }
}
