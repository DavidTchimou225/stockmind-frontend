import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";

export function useAchats(filtresInitiaux = {}) {
  const [achats, setAchats] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [filtres, setFiltres] = useState({ page: 1, limite: 20, ...filtresInitiaux });

  const charger = useCallback(async (params = filtres) => {
    setChargement(true);
    setErreur(null);
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v != null)
      );
      const { data } = await api.get("/achats", { params: clean });
      setAchats(data.donnees ?? []);
      setPagination(data.pagination ?? { total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setErreur(e?.response?.data?.erreur ?? "Erreur lors du chargement des achats.");
    } finally {
      setChargement(false);
    }
  }, [filtres]);

  useEffect(() => { charger(filtres); }, [filtres]);

  const changerFiltres = useCallback((nouveaux) => {
    setFiltres((prev) => ({ ...prev, ...nouveaux, page: 1 }));
  }, []);

  const changerPage = useCallback((page) => {
    setFiltres((prev) => ({ ...prev, page }));
  }, []);

  const receptionner = useCallback(async (id, lignes, dateReception, notes) => {
    await api.post(`/achats/${id}/reception`, { lignes, dateReception, notes });
    charger(filtres);
  }, [charger, filtres]);

  return { achats, pagination, chargement, erreur, filtres, changerFiltres, changerPage, receptionner, actualiser: () => charger(filtres) };
}
