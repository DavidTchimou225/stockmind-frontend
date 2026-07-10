import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../lib/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // ─── State ──────────────────────────────────────────────────────────────
      utilisateur: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      erreur: null,

      // ─── Getters calculés ────────────────────────────────────────────────────
      get estConnecte() {
        return Boolean(get().accessToken && get().utilisateur);
      },

      get role() {
        return get().utilisateur?.role ?? null;
      },

      // ─── Actions ─────────────────────────────────────────────────────────────

      /**
       * Connexion : appelle POST /api/auth/connexion et persiste les tokens.
       * @param {string} email
       * @param {string} motDePasse
       */
      connexion: async (email, motDePasse) => {
        set({ isLoading: true, erreur: null });

        try {
          const { data } = await api.post("/auth/connexion", {
            email,
            motDePasse,
          });

          const { utilisateur, tokens } = data.donnees;

          set({
            utilisateur,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isLoading: false,
            erreur: null,
          });

          return { succes: true };
        } catch (err) {
          const message =
            err.response?.data?.erreur ||
            err.response?.data?.message ||
            "Erreur de connexion. Vérifiez vos identifiants.";

          set({ isLoading: false, erreur: message });
          return { succes: false, erreur: message };
        }
      },

      /**
       * Déconnexion : révoque le refresh token côté serveur puis vide le state.
       */
      deconnexion: async () => {
        const { refreshToken } = get();

        try {
          if (refreshToken) {
            await api.post("/auth/deconnexion");
          }
        } catch {
          // Déconnexion locale même en cas d'échec serveur
        } finally {
          set({
            utilisateur: null,
            accessToken: null,
            refreshToken: null,
            erreur: null,
          });
        }
      },

      /**
       * Rechargement du profil utilisateur courant.
       */
      chargerProfil: async () => {
        try {
          const { data } = await api.get("/auth/moi");
          set({ utilisateur: data.donnees ?? data.utilisateur });
        } catch {
          get().deconnexion();
        }
      },

      /**
       * Mise à jour des tokens après un refresh silencieux.
       * @param {string} accessToken
       * @param {string} [newRefreshToken]
       */
      majTokens: (accessToken, newRefreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken: newRefreshToken ?? state.refreshToken,
        }));
      },

      /**
       * Réinitialise l'erreur d'authentification.
       */
      effacerErreur: () => set({ erreur: null }),

      /**
       * Vérifie si l'utilisateur possède au moins le rôle donné.
       * Hiérarchie : SUPER_ADMIN > ADMIN > MANAGER > MAGASINIER > VENDEUR
       */
      aLeRole: (roleRequis) => {
        const hierarchie = {
          SUPER_ADMIN: 5,
          ADMIN: 4,
          MANAGER: 3,
          MAGASINIER: 2,
          VENDEUR: 1,
        };
        const roleActuel = get().utilisateur?.role;
        return (hierarchie[roleActuel] ?? 0) >= (hierarchie[roleRequis] ?? 99);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        utilisateur: state.utilisateur,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
