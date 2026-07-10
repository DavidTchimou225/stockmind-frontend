import { useState } from "react";
import {
  ShoppingCart, Search, RefreshCw, Monitor, Smartphone,
  ChevronLeft, ChevronRight, AlertTriangle, Eye, X,
  CheckCircle2, XCircle, Package, User,
} from "lucide-react";
import clsx from "clsx";
import { useVentes } from "../hooks/useVentes";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formaterXOF(n) {
  return new Intl.NumberFormat("fr-FR").format(Number(n ?? 0)) + " FCFA";
}

function formaterDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const STATUT_CFG = {
  CONFIRMEE:       { label: "Confirmée",      cls: "bg-brand-50 text-brand-700" },
  LIVREE:          { label: "Livrée",          cls: "bg-success-50 text-success-700" },
  EN_PREPARATION:  { label: "En préparation",  cls: "bg-warning-50 text-warning-700" },
  EXPEDIEE:        { label: "Expédiée",        cls: "bg-blue-50 text-blue-700" },
  ANNULEE:         { label: "Annulée",         cls: "bg-danger-50 text-danger-700" },
  RETOURNEE:       { label: "Retournée",       cls: "bg-surface-100 text-surface-500" },
  BROUILLON:       { label: "Brouillon",       cls: "bg-surface-100 text-surface-500" },
};

const PAIEMENT_CFG = {
  PAYE:              { label: "Payé",         cls: "bg-success-50 text-success-700" },
  PARTIELLEMENT_PAYE:{ label: "Partiel",      cls: "bg-warning-50 text-warning-700" },
  NON_PAYE:          { label: "Non payé",     cls: "bg-danger-50 text-danger-700" },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CFG[statut] ?? { label: statut, cls: "bg-surface-100 text-surface-500" };
  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function PaiementBadge({ statut }) {
  const cfg = PAIEMENT_CFG[statut] ?? { label: statut, cls: "bg-surface-100 text-surface-500" };
  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const isWeb = source === "WEB";
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
      isWeb ? "bg-brand-50 text-brand-700" : "bg-success-50 text-success-700"
    )}>
      {isWeb ? <Monitor size={10} /> : <Smartphone size={10} />}
      {isWeb ? "WEB" : "POS"}
    </span>
  );
}

// ─── Modale détail vente ──────────────────────────────────────────────────────

function ModaleVente({ vente, onClose, onModifierStatut }) {
  const [nouveauStatut, setNouveauStatut] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);

  if (!vente) return null;

  const statutsDisponibles = Object.keys(STATUT_CFG).filter(
    (s) => s !== vente.statut && s !== "ANNULEE" && s !== "RETOURNEE"
  );

  async function handleStatut() {
    if (!nouveauStatut) return;
    setEnregistrement(true);
    try {
      await onModifierStatut(vente.id, nouveauStatut);
      onClose();
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-card-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-surface-900">{vente.numero}</h2>
            <p className="text-xs text-surface-400 mt-0.5">{formaterDate(vente.dateCommande)}</p>
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge source={vente.sourceVente} />
            <StatutBadge statut={vente.statut} />
            <button onClick={onClose} className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Client */}
          <div className="px-6 py-4 border-b border-surface-100">
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <User size={14} />
              <span className="font-medium text-surface-700">
                {vente.client?.nom ?? "Client anonyme"}
              </span>
              {vente.client?.telephone && (
                <span className="text-surface-400">· {vente.client.telephone}</span>
              )}
            </div>
          </div>

          {/* Lignes produits */}
          <div className="px-6 py-4 border-b border-surface-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
              Produits ({vente.lignes?.length ?? 0})
            </p>
            <div className="space-y-2">
              {(vente.lignes ?? []).map((ligne) => (
                <div key={ligne.id} className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50">
                      <Package size={13} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{ligne.produit?.nom}</p>
                      <p className="text-xs text-surface-400">{ligne.produit?.reference} · {Number(ligne.quantite)} {ligne.produit?.unite}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-surface-900">{formaterXOF(ligne.total)}</p>
                    <p className="text-xs text-surface-400">{formaterXOF(ligne.prixUnitaire)} / u</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paiements */}
          <div className="px-6 py-4 border-b border-surface-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Paiements</p>
              <PaiementBadge statut={vente.statutPaiement} />
            </div>
            <div className="space-y-1.5">
              {(vente.paiements ?? []).map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-surface-500">{p.modePaiement.replace("_", " ")}</span>
                  <span className="font-medium text-surface-900">{formaterXOF(p.montant)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="px-6 py-4 space-y-2 border-b border-surface-100">
            {Number(vente.remise) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500">Remise</span>
                <span className="text-danger-600">−{formaterXOF(vente.remise)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">TVA</span>
              <span className="text-surface-700">{formaterXOF(vente.tva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-surface-100 pt-2">
              <span className="text-surface-900">Total</span>
              <span className="text-surface-900">{formaterXOF(vente.total)}</span>
            </div>
          </div>

          {/* Changer statut */}
          {vente.statut !== "ANNULEE" && vente.statut !== "RETOURNEE" && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">Modifier le statut</p>
              <div className="flex gap-3">
                <select
                  value={nouveauStatut}
                  onChange={(e) => setNouveauStatut(e.target.value)}
                  className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Choisir un statut…</option>
                  {statutsDisponibles.map((s) => (
                    <option key={s} value={s}>{STATUT_CFG[s]?.label ?? s}</option>
                  ))}
                  <option value="ANNULEE">Annulée</option>
                </select>
                <button
                  onClick={handleStatut}
                  disabled={!nouveauStatut || enregistrement}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {enregistrement ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Appliquer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Squelette ────────────────────────────────────────────────────────────────

function TableauSkeleton() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} className="animate-pulse border-b border-surface-100">
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="px-4 py-3.5">
          <div className="h-3 rounded-full bg-surface-100" style={{ width: `${40 + Math.random() * 50}%` }} />
        </td>
      ))}
    </tr>
  ));
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function VentesPage() {
  const { ventes, pagination, chargement, erreur, filtres, changerFiltres, changerPage, modifierStatut, actualiser } = useVentes();
  const [venteSelectionnee, setVenteSelectionnee] = useState(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Ventes</h1>
          <p className="mt-0.5 text-sm text-surface-400">
            {pagination.total} transaction{pagination.total !== 1 ? "s" : ""} au total
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

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-surface-200 bg-white p-4 shadow-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro…"
            className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm text-surface-700 placeholder-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            value={filtres.recherche ?? ""}
            onChange={(e) => changerFiltres({ recherche: e.target.value || undefined })}
          />
        </div>

        <select
          value={filtres.statut ?? ""}
          onChange={(e) => changerFiltres({ statut: e.target.value || undefined })}
          className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={filtres.dateDebut?.split("T")[0] ?? ""}
          onChange={(e) => changerFiltres({ dateDebut: e.target.value ? e.target.value + "T00:00:00.000Z" : undefined })}
          className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <input
          type="date"
          value={filtres.dateFin?.split("T")[0] ?? ""}
          onChange={(e) => changerFiltres({ dateFin: e.target.value ? e.target.value + "T23:59:59.999Z" : undefined })}
          className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />

        {(filtres.statut || filtres.dateDebut || filtres.dateFin) && (
          <button
            onClick={() => changerFiltres({ statut: undefined, dateDebut: undefined, dateFin: undefined, recherche: undefined })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-500 hover:bg-surface-50 transition-colors"
          >
            <XCircle size={14} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-5 py-4">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-warning-600" />
          <p className="text-sm text-warning-800">{erreur}</p>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card">
        <div className="border-b border-surface-100 px-6 py-4">
          <SectionHeader
            titre="Liste des ventes"
            sous={`Page ${pagination.page} / ${pagination.totalPages || 1}`}
          />
        </div>

        {chargement ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <tbody className="divide-y divide-surface-100"><TableauSkeleton /></tbody>
            </table>
          </div>
        ) : ventes.length === 0 ? (
          <EmptyState
            icone={ShoppingCart}
            titre="Aucune vente trouvée"
            sous="Modifiez vos filtres ou enregistrez une nouvelle vente depuis la caisse."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/70">
                  {["N° Vente", "Source", "Client", "Statut", "Paiement", "Total", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 first:pl-6 last:pr-6 last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {ventes.map((v, i) => (
                  <tr
                    key={v.id}
                    className={clsx(
                      "group transition-colors hover:bg-surface-50 cursor-pointer",
                      i % 2 === 0 ? "bg-white" : "bg-surface-50/40"
                    )}
                    onClick={() => setVenteSelectionnee(v)}
                  >
                    <td className="whitespace-nowrap py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50">
                          <ShoppingCart size={14} className="text-brand-600" />
                        </div>
                        <p className="text-sm font-semibold text-surface-900">{v.numero}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <SourceBadge source={v.sourceVente} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-surface-600">
                      {v.client?.nom ?? <span className="text-surface-400 italic">Anonyme</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatutBadge statut={v.statut} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <PaiementBadge statut={v.statutPaiement} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-surface-900">
                      {formaterXOF(v.total)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-surface-500">
                      {formaterDate(v.dateCommande)}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-4 pr-6 text-right">
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setVenteSelectionnee(v); }}
                      >
                        <Eye size={12} />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-100 px-6 py-4">
            <p className="text-xs text-surface-500">
              {(pagination.page - 1) * filtres.limite + 1}–
              {Math.min(pagination.page * filtres.limite, pagination.total)} sur {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changerPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-3 text-sm font-medium text-surface-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => changerPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 text-surface-500 hover:bg-surface-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale */}
      {venteSelectionnee && (
        <ModaleVente
          vente={venteSelectionnee}
          onClose={() => setVenteSelectionnee(null)}
          onModifierStatut={modifierStatut}
        />
      )}
    </div>
  );
}
