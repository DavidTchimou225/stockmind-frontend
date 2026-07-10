import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";

export function useInsights(filtresInitiaux = {}) {
  const [state, setState] = useState({
    insights: [],
    parType: {},
    parCriticite: { CRITIQUE: 0, AVERTISSEMENT: 0, INFO: 0 },
    total: 0,
    meta: null,
    chargement: true,
    erreur: null,
  });

  const [filtres, setFiltres] = useState({
    type: "",
    criticite: "",
    statut: "",
    ...filtresInitiaux,
  });

  const charger = useCallback(async (f = filtres) => {
    setState((prev) => ({ ...prev, chargement: true, erreur: null }));
    try {
      const params = {
        ...(f.type && { type: f.type }),
        ...(f.criticite && { criticite: f.criticite }),
        ...(f.statut && { statut: f.statut }),
      };
      const { data } = await api.get("/insights", { params });
      setState({
        insights: data.insights ?? [],
        parType: data.parType ?? {},
        parCriticite: data.parCriticite ?? { CRITIQUE: 0, AVERTISSEMENT: 0, INFO: 0 },
        total: data.total ?? 0,
        meta: data.meta ?? null,
        chargement: false,
        erreur: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        chargement: false,
        erreur: err?.response?.data?.message ?? "Impossible de charger les insights.",
      }));
    }
  }, [filtres]);

  useEffect(() => {
    charger(filtres);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres]);

  async function marquerLu(id) {
    await api.patch(`/insights/${id}/lu`);
    setState((prev) => ({
      ...prev,
      insights: prev.insights.map((i) =>
        i.id === id ? { ...i, statut: "LU" } : i
      ),
    }));
  }

  async function marquerTraite(id) {
    await api.patch(`/insights/${id}/traite`);
    setState((prev) => ({
      ...prev,
      insights: prev.insights.map((i) =>
        i.id === id ? { ...i, statut: "TRAITE" } : i
      ),
    }));
  }

  function changerFiltre(champ, valeur) {
    setFiltres((prev) => ({ ...prev, [champ]: valeur }));
  }

  return {
    ...state,
    filtres,
    changerFiltre,
    actualiser: () => charger(filtres),
    marquerLu,
    marquerTraite,
  };
}
