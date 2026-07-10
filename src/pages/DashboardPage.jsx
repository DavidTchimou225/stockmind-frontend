import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ShoppingCart,
  TrendingUp,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Smartphone,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import KpiCard, { KpiCardSkeleton } from "../components/ui/KpiCard";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import { useDashboard } from "../hooks/useDashboard";

// ─── Helpers de formatage ─────────────────────────────────────────────────────

function formaterXOF(montant) {
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(1).replace(".0", "")} M FCFA`;
  }
  if (montant >= 1_000) {
    return `${(montant / 1_000).toFixed(0)} k FCFA`;
  }
  return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";
}

function formaterXOFComplet(montant) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant) + " FCFA";
}

function formaterDate(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formaterHeure(dateObj) {
  if (!dateObj) return "";
  return dateObj.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Tooltip Recharts personnalisé ────────────────────────────────────────────

function TooltipPersonnalise({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-surface-200 bg-white px-4 py-3 shadow-card-lg">
      <p className="mb-2 text-xs font-semibold text-surface-500">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-surface-600">{entry.name} :</span>
          <span className="font-semibold text-surface-900">
            {formaterXOFComplet(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Badge source vente ───────────────────────────────────────────────────────

function SourceBadge({ source }) {
  const isWeb = source === "WEB";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        isWeb
          ? "bg-brand-50 text-brand-700"
          : "bg-success-50 text-success-700"
      )}
    >
      {isWeb ? (
        <Monitor size={10} className="flex-shrink-0" />
      ) : (
        <Smartphone size={10} className="flex-shrink-0" />
      )}
      {isWeb ? "WEB" : "POS"}
    </span>
  );
}

// ─── Badge statut commande ────────────────────────────────────────────────────

const STATUT_CONFIG = {
  CONFIRMEE:  { label: "Confirmée",  cls: "bg-brand-50 text-brand-700" },
  LIVREE:     { label: "Livrée",     cls: "bg-success-50 text-success-700" },
  EN_ATTENTE: { label: "En attente", cls: "bg-warning-50 text-warning-700" },
  ANNULEE:    { label: "Annulée",    cls: "bg-danger-50 text-danger-700" },
  RETOURNEE:  { label: "Retournée",  cls: "bg-surface-100 text-surface-500" },
};

function StatutBadge({ statut }) {
  const config = STATUT_CONFIG[statut] ?? { label: statut, cls: "bg-surface-100 text-surface-500" };
  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", config.cls)}>
      {config.label}
    </span>
  );
}

// ─── Ligne du tableau des mouvements ─────────────────────────────────────────

function LigneMouvement({ mouvement, index }) {
  return (
    <tr
      className={clsx(
        "group transition-colors hover:bg-surface-50",
        index % 2 === 0 ? "bg-white" : "bg-surface-50/50"
      )}
    >
      {/* Référence + source */}
      <td className="whitespace-nowrap py-3.5 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <ShoppingCart size={14} className="text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">{mouvement.reference}</p>
            <p className="text-xs text-surface-400">{mouvement.client}</p>
          </div>
        </div>
      </td>

      {/* Source */}
      <td className="whitespace-nowrap px-4 py-3.5">
        <SourceBadge source={mouvement.source} />
      </td>

      {/* Statut */}
      <td className="whitespace-nowrap px-4 py-3.5">
        <StatutBadge statut={mouvement.statut} />
      </td>

      {/* Montant */}
      <td className="whitespace-nowrap px-4 py-3.5 text-right">
        <p className="text-sm font-semibold text-surface-900">
          {formaterXOFComplet(mouvement.montant)}
        </p>
        <p className="text-xs text-surface-400">
          {mouvement.nbLignes} ligne{mouvement.nbLignes > 1 ? "s" : ""}
        </p>
      </td>

      {/* Date */}
      <td className="whitespace-nowrap pl-4 pr-6 py-3.5 text-right">
        <p className="text-xs text-surface-500">{formaterDate(mouvement.date)}</p>
      </td>
    </tr>
  );
}

// ─── Squelette tableau ────────────────────────────────────────────────────────

function TableauSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-3.5 animate-pulse border-b border-surface-100 last:border-0"
        >
          <div className="h-8 w-8 rounded-lg bg-surface-100 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded-full bg-surface-100" />
            <div className="h-2.5 w-20 rounded-full bg-surface-100" />
          </div>
          <div className="h-5 w-14 rounded-md bg-surface-100" />
          <div className="h-3 w-24 rounded-full bg-surface-100" />
        </div>
      ))}
    </div>
  );
}

// ─── Squelette graphique ──────────────────────────────────────────────────────

function GraphiqueSkeleton() {
  return (
    <div className="h-72 animate-pulse flex items-end gap-1 px-4 pb-4">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-surface-100"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    kpis,
    graphiqueMensuel,
    derniersMovements,
    chargement,
    erreur,
    derniereMaj,
    actualiser,
  } = useDashboard();

  const moisCourant = new Date().toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  // Ne garder que les jours avec données non nulles pour la lisibilité de l'axe X
  const donneesGraphique = graphiqueMensuel.map((j) => ({
    ...j,
    name: j.label,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── En-tête page ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">
            Tableau de bord
          </h1>
          <p className="mt-0.5 text-sm text-surface-400">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {derniereMaj && (
              <span className="ml-2 text-surface-300">
                · Màj {formaterHeure(derniereMaj)}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={actualiser}
          disabled={chargement}
          className={clsx(
            "inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-sm font-medium text-surface-600 shadow-card transition-all hover:border-surface-300 hover:bg-surface-50 hover:text-surface-900 disabled:opacity-50",
            chargement && "cursor-not-allowed"
          )}
        >
          <RefreshCw size={14} className={clsx(chargement && "animate-spin")} />
          Actualiser
        </button>
      </div>

      {/* ── Erreur globale ───────────────────────────────────────────────────── */}
      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-5 py-4">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-warning-600" />
          <div>
            <p className="text-sm font-medium text-warning-800">Données partielles</p>
            <p className="text-xs text-warning-600 mt-0.5">{erreur}</p>
          </div>
        </div>
      )}

      {/* ── Section KPI Cards ────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {chargement ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                titre="Ventes du jour"
                valeur={formaterXOF(kpis.ventesJour)}
                icone={ShoppingCart}
                sous="Transactions confirmées aujourd'hui"
                variante="brand"
              />
              <KpiCard
                titre="Chiffre d'affaires"
                valeur={formaterXOF(kpis.caMonth)}
                icone={TrendingUp}
                sous={`Cumul ${moisCourant}`}
                variante="success"
              />
              <KpiCard
                titre="Valeur stock"
                valeur={formaterXOF(kpis.valeurStock)}
                icone={Boxes}
                sous="Valorisation au prix d'achat"
                variante="warning"
              />
              <KpiCard
                titre="Alertes rupture"
                valeur={kpis.alertesRupture.toString()}
                icone={AlertTriangle}
                sous={
                  kpis.alertesRupture === 0
                    ? "Aucune alerte active"
                    : `${kpis.alertesRupture} produit(s) sous seuil`
                }
                variante={kpis.alertesRupture > 0 ? "danger" : "success"}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Section Graphique des ventes ─────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="border-b border-surface-100 px-6 py-4">
          <SectionHeader
            titre="Évolution des ventes — 30 derniers jours"
            sous={`Montants en FCFA — ${moisCourant}`}
            action={
              <Link
                to="/ventes"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Voir toutes les ventes
                <ArrowRight size={12} />
              </Link>
            }
          />
        </div>

        <div className="px-2 pt-6 pb-4">
          {chargement ? (
            <GraphiqueSkeleton />
          ) : donneesGraphique.every((d) => d.ventes === 0) ? (
            <EmptyState
              icone={Activity}
              titre="Aucune vente ce mois-ci"
              sous="Les données apparaîtront ici dès la première transaction enregistrée."
            />
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart
                data={donneesGraphique}
                margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter, sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />

                <YAxis
                  tickFormatter={(v) => formaterXOF(v)}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "Inter, sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />

                <Tooltip content={<TooltipPersonnalise />} />

                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", paddingTop: "16px", color: "#64748b" }}
                />

                <Area
                  type="monotone"
                  dataKey="ventes"
                  name="Ventes"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradVentes)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Section Derniers mouvements ──────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="border-b border-surface-100 px-6 py-4">
          <SectionHeader
            titre="Dernières transactions"
            sous="8 transactions les plus récentes"
            action={
              <Link
                to="/ventes"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Voir tout
                <ArrowRight size={12} />
              </Link>
            }
          />
        </div>

        {chargement ? (
          <TableauSkeleton />
        ) : derniersMovements.length === 0 ? (
          <EmptyState
            icone={ShoppingCart}
            titre="Aucune transaction enregistrée"
            sous="Vos transactions apparaîtront ici dès la première vente."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/70">
                  <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Transaction
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Montant
                  </th>
                  <th className="pl-4 pr-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {derniersMovements.map((mouvement, index) => (
                  <LigneMouvement
                    key={mouvement.id}
                    mouvement={mouvement}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
