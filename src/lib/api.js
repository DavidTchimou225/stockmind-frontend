import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Intercepteur requête : injecter le token JWT ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Stockage corrompu — ignoré
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Intercepteur réponse : gestion globale 401 ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas intercepter si on est sur la page de connexion ou si c'est une erreur réseau
    const surPageConnexion = window.location.pathname === "/connexion";
    const erreurReseau = !error.response;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/connexion") &&
      !surPageConnexion
    ) {
      originalRequest._retry = true;

      try {
        const raw = localStorage.getItem("auth-storage");
        const parsed = raw ? JSON.parse(raw) : null;
        const refreshToken = parsed?.state?.refreshToken;

        if (!refreshToken) {
          throw new Error("Pas de refresh token");
        }

        const { data } = await axios.post("/api/auth/refresh", { refreshToken });

        const accessToken = data?.donnees?.tokens?.accessToken ?? data?.tokens?.accessToken;
        const newRefreshToken = data?.donnees?.tokens?.refreshToken ?? data?.tokens?.refreshToken;

        if (accessToken) {
          const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
          stored.state = {
            ...stored.state,
            accessToken,
            ...(newRefreshToken && { refreshToken: newRefreshToken }),
          };
          localStorage.setItem("auth-storage", JSON.stringify(stored));

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("auth-storage");
        if (!surPageConnexion) {
          window.location.href = "/connexion";
        }
      }
    }

    if (erreurReseau) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
