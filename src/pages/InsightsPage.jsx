import { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  Eye,
  Zap,
  Clock,
  Package,
  Filter,
  ChevronRight,
  Activity,
  Brain,
} from "lucide-react";
import clsx from "clsx";
import { useInsights } from "../hooks/useInsights";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";

// ─── Configuration des types d'insight ───────────────────────────────────────

const TYPE_CONFIG = {
  RUPTURE_ANTICIPEE: {
    label: "Rupture anticipée",
    icone: Zap,
    couleurIcone: "text-danger-600",
    fondIcone: "bg-danger-100",
    bordure: "border-danger-200",
    fond: "bg-danger-50/40",
    fondHover: "hover:bg-danger-50/70",
    accentBar: "bg-danger-500",
    labelBadge: "bg-danger-100 text-danger-700",
  },
  FAIBLE_ROTATION: {
    label: "Faible rotation",
    icone: TrendingDown,
    couleurIcone: "text-warning-600",
    fondIcone: "bg-warning-100",
    bordure: "border-warning-200",
    fond: "bg-warning-50/40",
    fondHover: "hover:bg-warning-50/70",
    accentBar: "bg-warning-500",
    labelBadge: "bg-warning-100 text-warning-700",
  },
  REAPPROVISIONNEMENT: {
    label: "Réapprovisionnement",
    icone: ShoppingCart,
    couleurIcone: "text-brand-600",
    fondIcone: "bg-brand-100",
    bordure: "border-brand-200",
    fond: "bg-brand-50/40",
    fondHover: "hover:bg-brand-50/70",
    accentBar: "bg-brand-500",
    labelBadge: "bg-brand-100 text-brand-700",
  },
  SURSTOCK: {
    label: "Surstock",
    icone: Package,
    couleurIcone: "text-surface-600",
    fondIcone: "bg-surface-100",
    bordure: "border-surface-200",
    fond: "bg-surface-50",
    fondHover: "hover:bg-surface-100/60",
    accentBar: "bg-surface-400",
    labelBadge: "bg-surface-100 text-surface-600",
  },
  TENDANCE_HAUSSE: {
    label: "Tendance hausse",
    icone: Activity,
    couleurIcone: "text-success-600",
    fondIcone: "bg-success-100",
    bordure: "border-success-200",
    fond: "bg-success-50/40",
    fondHover: "hover:bg-success-50/70",
    accentBar: "bg-success-500",
    labelBadge: "bg-success-100 text-success-700",
  },
  TENDANCE_BAISSE: {
    label: "Tendance baisse",
    icone: TrendingDown,
    couleurIcone: "text-warning-600",
    fondIcone: "bg-warning-100",
    bordure: "border-warning-200",
    fond: "bg-warning-50/40",
    fondHover: "hover:bg-warning-50/70",
    accentBar: "bg-warning-400",
    labelBadge: "bg-warning-100 text-warning-600",
  },
};

const CRITICITE_CONFIG = {
  CRITIQUE: {
    label: "Urgent",
    cls: "bg-danger-600 text-white",
    ordre: 1,
  },
  AVERTISSEMENT: {
    label: "À surveiller",
    cls: "bg-warning-500 text-white",
    ordre: 2,
  },
  INFO: {
    label: "Information",
    cls: "bg-brand-100 text-brand-700",
    ordre: 3,
  },
};

const STATUT_CONFIG = {
  NOUVEAU: { label: "Nouveau",  cls: "bg-danger-100 text-danger-700" },
  LU:      { label: "Lu",       cls: "bg-surface-100 text-surface-500" },
  TRAITE:  { label: "Traité",   cls: "bg-success-100 text-success-700" },
  IGNORE:  { label: "Ignoré",   cls: "bg-surface-100 text-surface-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formaterDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const maintenant = new Date();
  const diffMs = maintenant - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffJ = Math.floor(diffMs / 86400000);

  if (diffMin < 2) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffJ === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formaterScore(score) {
  return `${Math.round(score)}%`;
}

// ─── Carte d'insight ──────────────────────────────────────────────────────────

function CarteInsight({ insight, onMarquerLu, onMarquerTraite, enTraitement }) {
  const typeConf = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.REAPPROVISIONNEMENT;
  const criticiteConf = CRITICITE_CONFIG[insight.criticite] ?? CRITICITE_CONFIG.INFO;
  const statutConf = STATUT_CONFIG[insight.statut] ?? STATUT_CONFIG.NOUVEAU;
  const Icone = typeConf.icone;
  const estTraite = insight.statut === "TRAITE" || insight.statut === "IGNORE";

  return (
    <div
      className={clsx(
        "group relative flex flex-col rounded-xl border transition-all duration-200",
        typeConf.bordure,
        typeConf.fond,
        typeConf.fondHover,
        estTraite && "opacity-60"
      )}
    >
      {/* Barre d'accent verticale */}
      <div className={clsx("absolute left-0 top-4 bottom-4 w-1 rounded-r-full", typeConf.accentBar)} />

      <div className="pl-5 pr-5 pt-4 pb-4">
        {/* En-tête de carte */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Icône type */}
            <div className={clsx(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl mt-0.5",
              typeConf.fondIcone
            )}>
              <Icone size={19} className={typeConf.couleurIcone} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {/* Badge criticité */}
                <span className={clsx(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  criticiteConf.cls
                )}>
                  {criticiteConf.label}
                </span>
                {/* Badge type */}
                <span className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  typeConf.labelBadge
                )}>
                  {typeConf.label}
                </span>
                {/* Badge statut */}
                <span className={clsx(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  statutConf.cls
                )}>
                  {statutConf.label}
                </span>
              </div>

              {/* Titre */}
              <h3 className="text-sm font-semibold text-surface-900 leading-snug">
                {insight.titre}
              </h3>
            </div>
          </div>

          {/* Score de confiance + heure */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <Brain size={11} className="text-surface-300" />
              <span className="text-xs font-semibold text-surface-500">
                {formaterScore(insight.scoreConfiance)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <Clock size={10} className="text-surface-300" />
              <span className="text-[11px] text-surface-400">
                {formaterDate(insight.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Message explicatif */}
        <div className="rounded-lg bg-white/70 border border-white/60 px-4 py-3 mb-3">
          <p className="text-sm text-surface-700 leading-relaxed">
            {insight.message}
          </p>
        </div>

        {/* Recommandation */}
        {insight.recommandation && (
          <div className="flex gap-2.5 rounded-lg border border-current/10 bg-white/50 px-4 py-3 mb-3">
            <ChevronRight size={15} className={clsx("flex-shrink-0 mt-0.5", typeConf.couleurIcone)} />
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-0.5">
                Action recommandée
              </p>
              <p className="text-sm font-medium text-surface-800 leading-snug">
                {insight.recommandation}
              </p>
            </div>
          </div>
        )}

        {/* Données contextuelles */}
        {insight.donneesContexte && Object.keys(insight.donneesContexte).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {insight.donneesContexte.joursAutonomie !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-surface-200 px-2.5 py-1 text-xs text-surface-600">
                <Clock size={11} className="text-surface-400" />
                <span className="font-semibold text-danger-700">{insight.donneesContexte.joursAutonomie}j</span> d'autonomie
              </span>
            )}
            {insight.donneesContexte.stockActuel !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-surface-200 px-2.5 py-1 text-xs text-surface-600">
                <Package size={11} className="text-surface-400" />
                Stock : <span className="font-semibold text-surface-800 ml-1">{insight.donneesContexte.stockActuel}</span>
              </span>
            )}
            {insight.donneesContexte.tauxRotationPourcentage !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-surface-200 px-2.5 py-1 text-xs text-surface-600">
                <TrendingDown size={11} className="text-surface-400" />
                Rotation : <span className="font-semibold text-warning-700 ml-1">{insight.donneesContexte.tauxRotationPourcentage}%</span>
              </span>
            )}
            {insight.donneesContexte.valeurStockBloqueXOF !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-surface-200 px-2.5 py-1 text-xs text-surface-600">
                Capital immobilisé :
                <span className="font-semibold text-surface-800 ml-1">
                  {Number(insight.donneesContexte.valeurStockBloqueXOF).toLocaleString("fr-FR")} FCFA
                </span>
              </span>
            )}
            {insight.donneesContexte.fournisseurNom && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/80 border border-surface-200 px-2.5 py-1 text-xs text-surface-600">
                <ShoppingCart size={11} className="text-surface-400" />
                Fournisseur : <span className="font-semibold text-surface-800 ml-1">{insight.donneesContexte.fournisseurNom}</span>
              </span>
            )}
          </div>
        )}

        {/* Produit lié */}
        {insight.produit && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 rounded-md bg-white/70 border border-surface-200 px-3 py-1.5">
              <Package size={12} className="text-surface-400 flex-shrink-0" />
              <span className="text-xs text-surface-600">
                <span className="font-semibold text-surface-800">{insight.produit.nom}</span>
                <span className="text-surface-400 ml-1.5">réf. {insight.produit.reference}</span>
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!estTraite && (
          <div className="flex items-center gap-2 pt-1">
            {insight.statut === "NOUVEAU" && (
              <button
                onClick={() => onMarquerLu(insight.id)}
                disabled={enTraitement === insight.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-xs font-medium text-surface-600 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-50"
              >
                <Eye size={12} />
                Marquer comme lu
              </button>
            )}
            <button
              onClick={() => onMarquerTraite(insight.id)}
              disabled={enTraitement === insight.id}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all disabled:opacity-50",
                insight.criticite === "CRITIQUE"
                  ? "bg-danger-600 text-white hover:bg-danger-700 shadow-sm"
                  : "bg-surface-900 text-white hover:bg-surface-800 shadow-sm"
              )}
            >
              <CheckCircle2 size={12} />
              Marquer comme traité
            </button>
          </div>
        )}

        {estTraite && (
          <div className="flex items-center gap-1.5 pt-1">
            <CheckCircle2 size={13} className="text-success-500" />
            <span className="text-xs text-surface-400">Action prise en compte</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Squelette de carte ───────────────────────────────────────────────────────

function CarteInsightSkeleton() {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-surface-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-full bg-surface-200" />
            <div className="h-5 w-24 rounded-full bg-surface-200" />
          </div>
          <div className="h-4 w-48 rounded-full bg-surface-200" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded-full bg-surface-200" />
        <div className="h-3 w-4/5 rounded-full bg-surface-200" />
        <div className="h-3 w-3/5 rounded-full bg-surface-200" />
      </div>
      <div className="h-3 w-2/3 rounded-full bg-surface-200 mb-4" />
      <div className="flex gap-2">
        <div className="h-7 w-32 rounded-lg bg-surface-200" />
        <div className="h-7 w-36 rounded-lg bg-surface-200" />
      </div>
    </div>
  );
}

// ─── Compteur KPI insights ────────────────────────────────────────────────────

function KpiInsight({ label, valeur, cls, icone: Icone }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-5 py-4 shadow-card">
      <div className={clsx("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0", cls)}>
        <Icone size={17} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900 leading-none">{valeur}</p>
        <p className="mt-0.5 text-xs text-surface-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const FILTRES_TYPE = [
  { val: "",                    label: "Tous les types" },
  { val: "RUPTURE_ANTICIPEE",   label: "Ruptures anticipées" },
  { val: "FAIBLE_ROTATION",     label: "Faible rotation" },
  { val: "REAPPROVISIONNEMENT", label: "Réapprovisionnement" },
];

const FILTRES_CRITICITE = [
  { val: "",             label: "Toutes les criticités" },
  { val: "CRITIQUE",     label: "Urgent" },
  { val: "AVERTISSEMENT",label: "À surveiller" },
  { val: "INFO",         label: "Information" },
];

const FILTRES_STATUT = [
  { val: "",       label: "Tous les statuts" },
  { val: "NOUVEAU",label: "Nouveaux" },
  { val: "LU",     label: "Lus" },
  { val: "TRAITE", label: "Traités" },
];

export default function InsightsPage() {
  const {
    insights,
    parCriticite,
    meta,
    total,
    chargement,
    erreur,
    filtres,
    changerFiltre,
    actualiser,
    marquerLu,
    marquerTraite,
  } = useInsights({ statut: "NOUVEAU" });

  const [enTraitement, setEnTraitement] = useState(null);

  async function handleMarquerLu(id) {
    setEnTraitement(id);
    try { await marquerLu(id); } finally { setEnTraitement(null); }
  }

  async function handleMarquerTraite(id) {
    setEnTraitement(id);
    try { await marquerTraite(id); } finally { setEnTraitement(null); }
  }

  // Trier : CRITIQUE > AVERTISSEMENT > INFO, puis par date
  const insightsTries = [...insights].sort((a, b) => {
    const ordreA = CRITICITE_CONFIG[a.criticite]?.ordre ?? 99;
    const ordreB = CRITICITE_CONFIG[b.criticite]?.ordre ?? 99;
    if (ordreA !== ordreB) return ordreA - ordreB;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Sparkles size={15} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-surface-900 tracking-tight">Insights IA</h1>
          </div>
          <p className="text-sm text-surface-400 max-w-lg">
            Analyses prédictives générées automatiquement à partir de vos données de stock et de ventes.
            {meta && (
              <span className="ml-1 text-surface-300">
                Analyse effectuée en {meta.dureeAnalyseMs}ms.
              </span>
            )}
          </p>
        </div>
        <button
          onClick={actualiser}
          disabled={chargement}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 hover:border-surface-300 shadow-card transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={clsx(chargement && "animate-spin")} />
          Relancer l'analyse
        </button>
      </div>

      {/* ── KPIs insights ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiInsight
          label="Urgents"
          valeur={parCriticite.CRITIQUE}
          icone={Zap}
          cls="bg-danger-100 text-danger-600"
        />
        <KpiInsight
          label="À surveiller"
          valeur={parCriticite.AVERTISSEMENT}
          icone={AlertTriangle}
          cls="bg-warning-100 text-warning-600"
        />
        <KpiInsight
          label="Informatifs"
          valeur={parCriticite.INFO}
          icone={Sparkles}
          cls="bg-brand-100 text-brand-600"
        />
        <KpiInsight
          label="Total"
          valeur={total}
          icone={Activity}
          cls="bg-surface-100 text-surface-600"
        />
      </div>

      {/* ── Filtres ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-surface-400 flex-shrink-0" />

        {/* Filtre type */}
        <div className="flex flex-wrap gap-1.5">
          {FILTRES_TYPE.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => changerFiltre("type", val)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                filtres.type === val
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-surface-200 mx-1 hidden sm:block" />

        {/* Filtre criticité */}
        <div className="flex flex-wrap gap-1.5">
          {FILTRES_CRITICITE.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => changerFiltre("criticite", val)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                filtres.criticite === val
                  ? "bg-surface-900 text-white shadow-sm"
                  : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-surface-200 mx-1 hidden sm:block" />

        {/* Filtre statut */}
        <div className="flex flex-wrap gap-1.5">
          {FILTRES_STATUT.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => changerFiltre("statut", val)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                filtres.statut === val
                  ? "bg-surface-700 text-white shadow-sm"
                  : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Erreur ───────────────────────────────────────────────────────────── */}
      {erreur && (
        <div className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-5 py-4">
          <AlertTriangle size={16} className="flex-shrink-0 text-danger-600" />
          <p className="text-sm text-danger-700">{erreur}</p>
        </div>
      )}

      {/* ── Liste des insights ───────────────────────────────────────────────── */}
      {chargement ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <CarteInsightSkeleton key={i} />)}
        </div>
      ) : insightsTries.length === 0 ? (
        <div className="rounded-xl border border-surface-200 bg-white shadow-card">
          <EmptyState
            icone={Sparkles}
            titre="Aucun insight disponible"
            sous={
              filtres.type || filtres.criticite || filtres.statut
                ? "Aucun insight ne correspond aux filtres sélectionnés. Essayez d'élargir vos critères."
                : "Votre activité semble saine. Les insights apparaîtront automatiquement dès qu'une situation mérite votre attention."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Groupe CRITIQUE */}
          {insightsTries.some((i) => i.criticite === "CRITIQUE") && (
            <div>
              <SectionHeader
                titre={
                  <span className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-danger-500 animate-pulse-soft" />
                    Actions urgentes
                  </span>
                }
                sous={`${insightsTries.filter((i) => i.criticite === "CRITIQUE").length} insight(s) nécessitant une intervention immédiate`}
              />
              <div className="mt-3 space-y-3">
                {insightsTries
                  .filter((i) => i.criticite === "CRITIQUE")
                  .map((insight) => (
                    <CarteInsight
                      key={insight.id}
                      insight={insight}
                      onMarquerLu={handleMarquerLu}
                      onMarquerTraite={handleMarquerTraite}
                      enTraitement={enTraitement}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Groupe AVERTISSEMENT */}
          {insightsTries.some((i) => i.criticite === "AVERTISSEMENT") && (
            <div>
              <SectionHeader
                titre="À surveiller"
                sous={`${insightsTries.filter((i) => i.criticite === "AVERTISSEMENT").length} situation(s) à anticiper`}
              />
              <div className="mt-3 space-y-3">
                {insightsTries
                  .filter((i) => i.criticite === "AVERTISSEMENT")
                  .map((insight) => (
                    <CarteInsight
                      key={insight.id}
                      insight={insight}
                      onMarquerLu={handleMarquerLu}
                      onMarquerTraite={handleMarquerTraite}
                      enTraitement={enTraitement}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Groupe INFO */}
          {insightsTries.some((i) => i.criticite === "INFO") && (
            <div>
              <SectionHeader
                titre="Recommandations"
                sous={`${insightsTries.filter((i) => i.criticite === "INFO").length} recommandation(s) pour optimiser votre gestion`}
              />
              <div className="mt-3 space-y-3">
                {insightsTries
                  .filter((i) => i.criticite === "INFO")
                  .map((insight) => (
                    <CarteInsight
                      key={insight.id}
                      insight={insight}
                      onMarquerLu={handleMarquerLu}
                      onMarquerTraite={handleMarquerTraite}
                      enTraitement={enTraitement}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
