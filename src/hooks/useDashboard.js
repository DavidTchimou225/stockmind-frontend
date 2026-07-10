import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function debutJournee() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function debutMois() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function finAujourdhui() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// Génère les 30 derniers jours pour le graphique (format dd/MM)
function genererLabelsJours(nbJours = 30) {
  return Array.from({ length: nbJours }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (nbJours - 1 - i));
    return {
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    };
  });
}

// ─── État initial ─────────────────────────────────────────────────────────────

const ETAT_INITIAL = {
  kpis: {
    ventesJour: 0,
    caMonth: 0,
    valeurStock: 0,
    alertesRupture: 0,
  },
  graphiqueMensuel: [],
  derniersMovements: [],
  chargement: true,
  erreur: null,
  derniereMaj: null,
};

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useDashboard() {
  const [state, setState] = useState(ETAT_INITIAL);

  const charger = useCallback(async () => {
    setState((prev) => ({ ...prev, chargement: true, erreur: null }));

    try {
      // Lancer toutes les requêtes en parallèle
      const [
        resVentesJour,
        resVentesMois,
        resProduits,
        resAlertes,
        resMovements,
      ] = await Promise.allSettled([
        api.get("/ventes", {
          params: { dateDebut: debutJournee(), dateFin: finAujourdhui(), limite: 100 },
        }),
        api.get("/ventes", {
          params: { dateDebut: debutMois(), dateFin: finAujourdhui(), limite: 500 },
        }),
        api.get("/produits", { params: { limite: 500 } }),
        api.get("/produits", { params: { limite: 500 } }),
        api.get("/ventes", { params: { limite: 8 } }),
      ]);

      // ── KPI 1 : Ventes du jour ───────────────────────────────────────────────
      let ventesJour = 0;
      if (resVentesJour.status === "fulfilled") {
        const commandes = resVentesJour.value?.data?.donnees ?? [];
        ventesJour = commandes.reduce(
          (acc, c) => acc + Number(c.total ?? 0),
          0
        );
      }

      // ── KPI 2 : CA du mois + données graphique ───────────────────────────────
      let caMonth = 0;
      let graphiqueMensuel = [];

      if (resVentesMois.status === "fulfilled") {
        const commandes = resVentesMois.value?.data?.donnees ?? [];
        caMonth = commandes.reduce(
          (acc, c) => acc + Number(c.total ?? 0),
          0
        );

        // Regrouper par jour pour le graphe
        const joursTemplate = genererLabelsJours(30);
        const parJour = new Map(joursTemplate.map((j) => [j.date, { ...j, ventes: 0, achats: 0 }]));

        commandes.forEach((c) => {
          const dateStr = c.dateCommande?.split("T")[0];
          if (parJour.has(dateStr)) {
            parJour.get(dateStr).ventes += Number(c.total ?? 0);
          }
        });

        graphiqueMensuel = Array.from(parJour.values());
      }

      // ── KPI 3 : Valeur totale du stock ───────────────────────────────────────
      let valeurStock = 0;
      if (resProduits.status === "fulfilled") {
        const produits = resProduits.value?.data?.donnees ?? [];
        valeurStock = produits.reduce(
          (acc, p) => acc + Number(p.stockActuel ?? 0) * Number(p.prixAchat ?? 0),
          0
        );
      }

      // ── KPI 4 : Alertes rupture actives ─────────────────────────────────────
      let alertesRupture = 0;
      if (resAlertes.status === "fulfilled") {
        const produits = resAlertes.value?.data?.donnees ?? [];
        alertesRupture = produits.filter(
          (p) =>
            Number(p.stockMinimum ?? 0) > 0 &&
            Number(p.stockActuel ?? 0) <= Number(p.stockMinimum ?? 0)
        ).length;
      }

      // ── Derniers mouvements / ventes ────────────────────────────────────────
      let derniersMovements = [];
      if (resMovements.status === "fulfilled") {
        const commandes = resMovements.value?.data?.donnees ?? [];
        derniersMovements = commandes.slice(0, 8).map((c) => ({
          id: c.id,
          type: "VENTE",
          reference: c.numero,
          montant: Number(c.total ?? 0),
          statut: c.statut,
          source: c.sourceVente ?? "WEB",
          client: c.client?.nom ?? c.client?.prenom ?? "Client anonyme",
          date: c.dateCommande,
          nbLignes: c.lignes?.length ?? 0,
        }));
      }

      setState({
        kpis: { ventesJour, caMonth, valeurStock, alertesRupture },
        graphiqueMensuel,
        derniersMovements,
        chargement: false,
        erreur: null,
        derniereMaj: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        chargement: false,
        erreur: err?.response?.data?.message ?? "Erreur lors du chargement des données.",
      }));
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  return { ...state, actualiser: charger };
}
