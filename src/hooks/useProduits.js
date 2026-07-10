import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";

const ETAT_INITIAL = {
  donnees: [],
  pagination: { total: 0, page: 1, limite: 20, totalPages: 0 },
  chargement: true,
  erreur: null,
};

export function useProduits(filtresInitiaux = {}) {
  const [state, setState] = useState(ETAT_INITIAL);
  const [filtres, setFiltres] = useState({
    page: 1,
    limite: 20,
    recherche: "",
    categorieId: "",
    actif: true,
    ...filtresInitiaux,
  });

  const charger = useCallback(async (f = filtres) => {
    setState((prev) => ({ ...prev, chargement: true, erreur: null }));
    try {
      const params = {
        page: f.page,
        limite: f.limite,
        ...(f.recherche && { recherche: f.recherche }),
        ...(f.categorieId && { categorieId: f.categorieId }),
        ...(f.actif !== undefined && { actif: f.actif }),
      };
      const { data } = await api.get("/produits", { params });
      setState({
        donnees: data.donnees ?? [],
        pagination: data.pagination ?? ETAT_INITIAL.pagination,
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        chargement: false,
        erreur: err?.response?.data?.message ?? "Impossible de charger les produits.",
      }));
    }
  }, [filtres]);

  useEffect(() => {
    charger(filtres);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres]);

  function changerPage(page) {
    setFiltres((prev) => ({ ...prev, page }));
  }

  function changerRecherche(recherche) {
    setFiltres((prev) => ({ ...prev, recherche, page: 1 }));
  }

  function changerCategorie(categorieId) {
    setFiltres((prev) => ({ ...prev, categorieId, page: 1 }));
  }

  async function creerProduit(payload) {
    const { data } = await api.post("/produits", payload);
    await charger(filtres);
    return data.donnees;
  }

  async function modifierProduit(id, payload) {
    const { data } = await api.put(`/produits/${id}`, payload);
    await charger(filtres);
    return data.donnees;
  }

  return {
    ...state,
    filtres,
    changerPage,
    changerRecherche,
    changerCategorie,
    actualiser: () => charger(filtres),
    creerProduit,
    modifierProduit,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get("/categories")
      .then(({ data }) => setCategories(data.donnees ?? []))
      .catch(() => setCategories([]))
      .finally(() => setChargement(false));
  }, []);

  return { categories, chargement };
}
