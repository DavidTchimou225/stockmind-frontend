import clsx from "clsx";

// ─── Squelette de chargement ──────────────────────────────────────────────────
export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-3.5 w-24 bg-surface-100 rounded-full" />
        <div className="h-9 w-9 bg-surface-100 rounded-lg" />
      </div>
      <div className="h-8 w-32 bg-surface-100 rounded-lg mb-2" />
      <div className="h-3 w-20 bg-surface-100 rounded-full" />
    </div>
  );
}

// ─── Variantes de couleur ─────────────────────────────────────────────────────
const VARIANTES = {
  brand: {
    icon:   "bg-brand-50 text-brand-600",
    trend:  "text-brand-600",
    accent: "bg-brand-600",
  },
  success: {
    icon:   "bg-success-50 text-success-600",
    trend:  "text-success-600",
    accent: "bg-success-500",
  },
  warning: {
    icon:   "bg-warning-50 text-warning-600",
    trend:  "text-warning-600",
    accent: "bg-warning-500",
  },
  danger: {
    icon:   "bg-danger-50 text-danger-600",
    trend:  "text-danger-600",
    accent: "bg-danger-500",
  },
};

/**
 * KpiCard — Carte de statistique clé
 *
 * @param {string}      titre        Label affiché au-dessus de la valeur
 * @param {string}      valeur       Valeur principale (ex: "1 250 000 FCFA")
 * @param {ReactNode}   icone        Composant Lucide
 * @param {string}      [tendance]   Texte de tendance (ex: "+12% vs hier")
 * @param {boolean}     [tendanceHausse]  true = vert, false = rouge
 * @param {string}      [sous]       Sous-texte discret
 * @param {'brand'|'success'|'warning'|'danger'} [variante]
 */
export default function KpiCard({
  titre,
  valeur,
  icone: Icone,
  tendance,
  tendanceHausse,
  sous,
  variante = "brand",
}) {
  const v = VARIANTES[variante] ?? VARIANTES.brand;

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-card p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-card-md hover:border-surface-300">
      {/* En-tête : label + icône */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">
          {titre}
        </p>
        {Icone && (
          <span className={clsx("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0", v.icon)}>
            <Icone size={18} strokeWidth={1.8} />
          </span>
        )}
      </div>

      {/* Valeur principale */}
      <div>
        <p className="text-2xl font-bold text-surface-900 tracking-tight leading-none">
          {valeur}
        </p>

        {/* Tendance */}
        {tendance && (
          <p
            className={clsx(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              tendanceHausse === true  && "text-success-600",
              tendanceHausse === false && "text-danger-600",
              tendanceHausse === undefined && "text-surface-400"
            )}
          >
            {tendanceHausse === true  && <span>↑</span>}
            {tendanceHausse === false && <span>↓</span>}
            {tendance}
          </p>
        )}

        {/* Sous-texte */}
        {sous && !tendance && (
          <p className="mt-1.5 text-xs text-surface-400">{sous}</p>
        )}
      </div>

      {/* Barre d'accent colorée */}
      <div className={clsx("h-0.5 w-8 rounded-full opacity-60", v.accent)} />
    </div>
  );
}
