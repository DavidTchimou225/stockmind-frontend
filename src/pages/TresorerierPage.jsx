import { useState, useEffect, useCallback } from "react";
import {
  Wallet, TrendingUp, TrendingDown, RefreshCw,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import clsx from "clsx";
import api from "../lib/api";
import KpiCard, { KpiCardSkeleton } from "../components/ui/KpiCard";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formaterXOF(n) {
  if (!n) return "0 FCFA";
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")} M FCFA`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)} k FCFA`;
  return new Intl.NumberFormat("fr-FR").format(v) + " FCFA";
}

function formaterXOFComplet(n) {
  return new Intl.NumberFormat("fr-FR").format(Number(n ?? 0)) + " FCFA";
}

function genererLabelsJours(nb = 30) {
  return Array.from({ length: nb }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (nb - 1 - i));
    return {
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    };
  });
}

function debutMois() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function finAujourdhui() {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d.toISOString();
}
function il30Jours() {
  const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d.toISOString();
}

// ─── Tooltip personnalisé ──────────────────────────────────────────────────────

function TooltipPerso({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white px-4 py-3 shadow-card-lg">
      <p className="mb-2 text-xs font-semibold text-surface-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-surface-600">{entry.name} :</span>
          <span className="font-semibold text-surface-900">{formaterXOFComplet(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Hook trésorerie ──────────────────────────────────────────────────────────

function useTresorerie() {
  const [data, setData] = useState({
    entrees: 0, sorties: 0, solde: 0,
    entreesMois: 0, sortiesMois: 0,
    graphique: [],
    modesEntrees: [],
    chargement: true, erreur: null, derniereMaj: null,
  });

  const charger = useCallback(async () => {
    setData((prev) => ({ ...prev, chargement: true, erreur: null }));
    try {
      const [resVentes, resAchats] = await Promise.allSettled([
        api.get("/ventes", { params: { dateDebut: il30Jours(), dateFin: finAujourdhui(), limite: 1000 } }),
        api.get("/achats", { params: { dateDebut: il30Jours(), dateFin: finAujourdhui(), limite: 1000 } }),
      ]);

      const ventes = resVentes.status === "fulfilled" ? (resVentes.value?.data?.donnees ?? []) : [];
      const achats = resAchats.status === "fulfilled" ? (resAchats.value?.data?.donnees ?? []) : [];

      // KPIs globaux (30 jours)
      // Entrées = montant réellement encaissé sur les ventes
      const entrees = ventes.reduce((a, v) => a + Number(v.montantPaye ?? v.total ?? 0), 0);
      // Sorties = montant total des factures d'achat (engagements fournisseurs)
      const sorties = achats.reduce((a, v) => a + Number(v.montantPaye ?? v.total ?? 0), 0);
      const solde = entrees - sorties;

      // KPIs mois courant — comparer les dates ISO (les deux sont des strings ISO 8601)
      const debutM = debutMois();
      const ventesMois = ventes.filter((v) => (v.dateCommande ?? "") >= debutM);
      // achats : utiliser dateFacture (champ de tri côté backend)
      const achatsMois = achats.filter((a) => (a.dateFacture ?? "") >= debutM);
      const entreesMois = ventesMois.reduce((a, v) => a + Number(v.montantPaye ?? v.total ?? 0), 0);
      const sortiesMois = achatsMois.reduce((a, v) => a + Number(v.montantPaye ?? v.total ?? 0), 0);

      // Graphique 30 jours
      const jours = genererLabelsJours(30);
      const parJour = new Map(jours.map((j) => [j.date, { ...j, entrees: 0, sorties: 0 }]));

      ventes.forEach((v) => {
        const d = (v.dateCommande ?? "").split("T")[0];
        if (parJour.has(d)) parJour.get(d).entrees += Number(v.montantPaye ?? v.total ?? 0);
      });
      achats.forEach((a) => {
        // dateFacture est le champ de date principal des achats
        const d = (a.dateFacture ?? "").split("T")[0];
        if (parJour.has(d)) parJour.get(d).sorties += Number(a.montantPaye ?? a.total ?? 0);
      });

      // Répartition modes de paiement (ventes encaissées)
      const modes = {};
      ventes.forEach((v) => {
        (v.paiements ?? []).forEach((p) => {
          const m = p.modePaiement ?? "AUTRE";
          modes[m] = (modes[m] ?? 0) + Number(p.montant ?? 0);
        });
      });
      const modesEntrees = Object.entries(modes)
        .map(([mode, montant]) => ({ mode: mode.replace(/_/g, " "), montant }))
        .sort((a, b) => b.montant - a.montant);

      setData({
        entrees, sorties, solde,
        entreesMois, sortiesMois,
        graphique: Array.from(parJour.values()),
        modesEntrees,
        chargement: false, erreur: null, derniereMaj: new Date(),
      });
    } catch (e) {
      setData((prev) => ({
        ...prev, chargement: false,
        erreur: e?.response?.data?.erreur ?? "Erreur lors du chargement.",
      }));
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  return { ...data, actualiser: charger };
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TresoreriePage() {
  const {
    entrees, sorties, solde,
    entreesMois, sortiesMois,
    graphique, modesEntrees,
    chargement, erreur, derniereMaj, actualiser,
  } = useTresorerie();

  const moisCourant = new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Trésorerie</h1>
          <p className="mt-0.5 text-sm text-surface-400">
            Flux financiers — 30 derniers jours
            {derniereMaj && (
              <span className="ml-2 text-surface-300">
                · Màj {derniereMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={actualiser}
          disabled={chargement}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-sm font-medium text-surface-600 shadow-card hover:bg-surface-50 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={14} className={clsx(chargement && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-5 py-4">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-warning-600" />
          <p className="text-sm text-warning-800">{erreur}</p>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {chargement ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              titre="Solde net (30j)"
              valeur={formaterXOF(Math.abs(solde))}
              icone={Wallet}
              sous={solde >= 0 ? "Excédent de trésorerie" : "Déficit de trésorerie"}
              variante={solde >= 0 ? "success" : "danger"}
            />
            <KpiCard
              titre="Encaissements (30j)"
              valeur={formaterXOF(entrees)}
              icone={ArrowUpRight}
              sous="Total ventes encaissées"
              variante="brand"
            />
            <KpiCard
              titre="Décaissements (30j)"
              valeur={formaterXOF(sorties)}
              icone={ArrowDownRight}
              sous="Total achats fournisseurs"
              variante="warning"
            />
            <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
                Ce mois · {moisCourant}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <TrendingUp size={14} className="text-success-500" />
                    Entrées
                  </div>
                  <span className="text-sm font-bold text-success-700">{formaterXOF(entreesMois)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <TrendingDown size={14} className="text-danger-500" />
                    Sorties
                  </div>
                  <span className="text-sm font-bold text-danger-700">{formaterXOF(sortiesMois)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-surface-100 pt-2">
                  <span className="text-sm font-medium text-surface-700">Solde</span>
                  <span className={clsx(
                    "text-sm font-bold",
                    entreesMois - sortiesMois >= 0 ? "text-success-700" : "text-danger-700"
                  )}>
                    {entreesMois - sortiesMois >= 0 ? "+" : ""}{formaterXOF(entreesMois - sortiesMois)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Graphique flux */}
      <section className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="border-b border-surface-100 px-6 py-4">
          <SectionHeader
            titre="Flux de trésorerie — 30 derniers jours"
            sous="Encaissements (ventes) vs Décaissements (achats)"
          />
        </div>
        <div className="px-2 pt-6 pb-4">
          {chargement ? (
            <div className="h-64 animate-pulse flex items-end gap-1 px-4 pb-4">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-surface-100" style={{ height: `${20 + Math.random() * 60}%` }} />
              ))}
            </div>
          ) : graphique.every((d) => d.entrees === 0 && d.sorties === 0) ? (
            <EmptyState icone={Activity} titre="Aucun flux enregistré" sous="Les données apparaîtront ici dès la première transaction." />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={graphique} margin={{ top: 4, right: 20, left: 10, bottom: 0 }} barGap={2}>
                <defs>
                  <linearGradient id="gradEntrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="gradSorties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tickFormatter={(v) => formaterXOF(v)} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<TooltipPerso />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#64748b" }} />
                <Bar dataKey="entrees" name="Encaissements" fill="url(#gradEntrees)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                <Bar dataKey="sorties" name="Décaissements" fill="url(#gradSorties)" radius={[3, 3, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Répartition modes de paiement */}
      {!chargement && modesEntrees.length > 0 && (
        <section className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
          <div className="border-b border-surface-100 px-6 py-4">
            <SectionHeader
              titre="Répartition des encaissements"
              sous="Par mode de paiement (30 derniers jours)"
            />
          </div>
          <div className="px-6 py-5 space-y-3">
            {modesEntrees.map(({ mode, montant }) => {
              const pct = entrees > 0 ? Math.round((montant / entrees) * 100) : 0;
              return (
                <div key={mode}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-700">{mode}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-surface-400">{pct}%</span>
                      <span className="text-sm font-bold text-surface-900">{formaterXOF(montant)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
