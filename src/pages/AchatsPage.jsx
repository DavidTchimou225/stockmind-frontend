import { useState } from "react";
import {
  Truck, Search, RefreshCw, AlertTriangle, Eye, X,
  ChevronLeft, ChevronRight, XCircle, Package, CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { useAchats } from "../hooks/useAchats";
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
  BROUILLON:           { label: "Brouillon",       cls: "bg-surface-100 text-surface-500" },
  ENVOYEE:             { label: "Envoyée",          cls: "bg-brand-50 text-brand-700" },
  RECUE_PARTIELLEMENT: { label: "Reçue partiel.",   cls: "bg-warning-50 text-warning-700" },
  RECUE:               { label: "Reçue",            cls: "bg-success-50 text-success-700" },
  ANNULEE:             { label: "Annulée",          cls: "bg-danger-50 text-danger-700" },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CFG[statut] ?? { label: statut, cls: "bg-surface-100 text-surface-500" };
  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ─── Modale détail + réception ────────────────────────────────────────────────

function ModaleAchat({ achat, onClose, onReceptionner }) {
  const [reception, setReception] = useState(false);
  const [quantites, setQuantites] = useState({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [dateReception, setDateReception] = useState(new Date().toISOString().split("T")[0]);

  if (!achat) return null;

  const peutReceptionner = achat.statut === "ENVOYEE" || achat.statut === "RECUE_PARTIELLEMENT";

  async function handleReception() {
    const lignes = achat.lignes
      .filter((l) => Number(quantites[l.id] ?? 0) > 0)
      .map((l) => ({ ligneAchatId: l.id, quantiteRecue: Number(quantites[l.id]) }));

    if (lignes.length === 0) return;
    setEnregistrement(true);
    try {
      await onReceptionner(achat.id, lignes, dateReception ? dateReception + "T12:00:00Z" : undefined);
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
            <h2 className="text-base font-bold text-surface-900">Achat #{achat.id?.slice(-8)}</h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Fournisseur : {achat.fournisseur?.nom ?? "—"} · {formaterDate(achat.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatutBadge statut={achat.statut} />
            <button onClick={onClose} className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[65vh]">
          {/* Lignes */}
          <div className="px-6 py-4 border-b border-surface-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3">
              Produits commandés
            </p>
            <div className="space-y-2">
              {(achat.lignes ?? []).map((ligne) => (
                <div key={ligne.id} className="rounded-lg bg-surface-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warning-50">
                        <Package size={13} className="text-warning-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-900">{ligne.produit?.nom}</p>
                        <p className="text-xs text-surface-400">{ligne.produit?.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-surface-900">{formaterXOF(ligne.total ?? Number(ligne.prixUnitaire) * Number(ligne.quantite))}</p>
                      <p className="text-xs text-surface-400">
                        Qté : {Number(ligne.quantite)} · {formaterXOF(ligne.prixUnitaire)}/u
                      </p>
                      {Number(ligne.quantiteRecue ?? 0) > 0 && (
                        <p className="text-xs text-success-600 font-medium">Reçu : {Number(ligne.quantiteRecue)}</p>
                      )}
                    </div>
                  </div>

                  {/* Champ réception */}
                  {reception && peutReceptionner && (
                    <div className="mt-3 flex items-center gap-3 border-t border-surface-100 pt-3">
                      <label className="text-xs text-surface-500 flex-1">Quantité reçue :</label>
                      <input
                        type="number"
                        min="0"
                        max={Number(ligne.quantite)}
                        step="0.001"
                        placeholder="0"
                        value={quantites[ligne.id] ?? ""}
                        onChange={(e) => setQuantites((prev) => ({ ...prev, [ligne.id]: e.target.value }))}
                        className="w-24 rounded-lg border border-surface-200 px-3 py-1.5 text-sm text-right focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="px-6 py-4 space-y-2 border-b border-surface-100">
            <div className="flex justify-between text-base font-bold">
              <span className="text-surface-900">Total</span>
              <span className="text-surface-900">{formaterXOF(achat.total)}</span>
            </div>
            {achat.notes && (
              <p className="text-xs text-surface-400 italic">{achat.notes}</p>
            )}
          </div>

          {/* Actions réception */}
          {peutReceptionner && (
            <div className="px-6 py-4">
              {!reception ? (
                <button
                  onClick={() => setReception(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-success-700 transition-colors"
                >
                  <Truck size={15} />
                  Enregistrer une réception
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-surface-600">Date de réception :</label>
                    <input
                      type="date"
                      value={dateReception}
                      onChange={(e) => setDateReception(e.target.value)}
                      className="rounded-lg border border-surface-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReception}
                      disabled={enregistrement || Object.values(quantites).every((v) => !v || Number(v) <= 0)}
                      className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50 transition-colors"
                    >
                      {enregistrement ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Confirmer la réception
                    </button>
                    <button
                      onClick={() => { setReception(false); setQuantites({}); }}
                      className="rounded-lg border border-surface-200 px-4 py-2 text-sm text-surface-500 hover:bg-surface-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
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

export default function AchatsPage() {
  const { achats, pagination, chargement, erreur, filtres, changerFiltres, changerPage, receptionner, actualiser } = useAchats();
  const [achatSelectionne, setAchatSelectionne] = useState(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Achats</h1>
          <p className="mt-0.5 text-sm text-surface-400">
            {pagination.total} facture{pagination.total !== 1 ? "s" : ""} fournisseur
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
            placeholder="Rechercher…"
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
            titre="Factures fournisseurs"
            sous={`Page ${pagination.page} / ${pagination.totalPages || 1}`}
          />
        </div>

        {chargement ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <tbody className="divide-y divide-surface-100"><TableauSkeleton /></tbody>
            </table>
          </div>
        ) : achats.length === 0 ? (
          <EmptyState
            icone={Truck}
            titre="Aucun achat trouvé"
            sous="Les factures fournisseurs apparaîtront ici."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/70">
                  {["Fournisseur", "Statut", "Lignes", "Total", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-400 first:pl-6 last:pr-6 last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {achats.map((a, i) => (
                  <tr
                    key={a.id}
                    className={clsx(
                      "group transition-colors hover:bg-surface-50 cursor-pointer",
                      i % 2 === 0 ? "bg-white" : "bg-surface-50/40"
                    )}
                    onClick={() => setAchatSelectionne(a)}
                  >
                    <td className="whitespace-nowrap py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning-50">
                          <Truck size={14} className="text-warning-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-900">
                            {a.fournisseur?.nom ?? "Fournisseur inconnu"}
                          </p>
                          <p className="text-xs text-surface-400">{a.fournisseur?.email ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatutBadge statut={a.statut} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-surface-600">
                      {a.lignes?.length ?? 0} produit{(a.lignes?.length ?? 0) > 1 ? "s" : ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-surface-900">
                      {formaterXOF(a.total)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-surface-500">
                      {formaterDate(a.createdAt)}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-4 pr-6 text-right">
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setAchatSelectionne(a); }}
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
      {achatSelectionne && (
        <ModaleAchat
          achat={achatSelectionne}
          onClose={() => setAchatSelectionne(null)}
          onReceptionner={receptionner}
        />
      )}
    </div>
  );
}
