import { useState, useCallback } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
  Filter,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { useProduits, useCategories } from "../hooks/useProduits";
import ModaleProduit from "../components/ModaleProduit";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formaterXOF(n) {
  return new Intl.NumberFormat("fr-FR").format(Number(n ?? 0)) + " FCFA";
}

function formaterStock(val) {
  return Number(val ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 });
}

function statutStock(produit) {
  const actuel = Number(produit.stockActuel ?? 0);
  const min = Number(produit.stockMinimum ?? 0);
  if (min > 0 && actuel <= 0) return "rupture";
  if (min > 0 && actuel <= min) return "critique";
  return "ok";
}

// ─── Badge stock ──────────────────────────────────────────────────────────────

function BadgeStock({ produit }) {
  const statut = statutStock(produit);

  if (statut === "rupture") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-2.5 py-0.5 text-[11px] font-semibold text-danger-700">
        <AlertTriangle size={10} className="flex-shrink-0" />
        Rupture
      </span>
    );
  }
  if (statut === "critique") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-[11px] font-semibold text-warning-700">
        <TrendingDown size={10} className="flex-shrink-0" />
        Alerte rupture
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-0.5 text-[11px] font-semibold text-success-700">
      <CheckCircle2 size={10} className="flex-shrink-0" />
      Normal
    </span>
  );
}

// ─── Valeur stock colorée ─────────────────────────────────────────────────────

function ValeurStock({ produit }) {
  const statut = statutStock(produit);
  const val = formaterStock(produit.stockActuel);
  const unite = produit.unite ?? "pcs";

  return (
    <span
      className={clsx(
        "text-sm font-semibold tabular-nums",
        statut === "rupture" && "text-danger-700",
        statut === "critique" && "text-warning-700",
        statut === "ok" && "text-surface-900"
      )}
    >
      {val}
      <span className={clsx("ml-1 text-xs font-normal",
        statut === "rupture" ? "text-danger-500" :
        statut === "critique" ? "text-warning-600" :
        "text-surface-400"
      )}>
        {unite}
      </span>
    </span>
  );
}

// ─── Squelette de ligne tableau ───────────────────────────────────────────────

function SkeletonLigne() {
  return (
    <tr className="animate-pulse">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-surface-100 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-36 rounded-full bg-surface-100" />
            <div className="h-2.5 w-20 rounded-full bg-surface-100" />
          </div>
        </div>
      </td>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 w-20 rounded-full bg-surface-100" />
        </td>
      ))}
      <td className="px-4 py-4">
        <div className="h-5 w-24 rounded-full bg-surface-100" />
      </td>
      <td className="pl-4 pr-6 py-4">
        <div className="h-7 w-7 rounded-lg bg-surface-100 ml-auto" />
      </td>
    </tr>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ pagination, onChanger }) {
  if (pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limite } = pagination;
  const debut = (page - 1) * limite + 1;
  const fin = Math.min(page * limite, total);

  return (
    <div className="flex items-center justify-between border-t border-surface-100 px-6 py-3.5 bg-surface-50/50">
      <p className="text-xs text-surface-400">
        Affichage de{" "}
        <span className="font-semibold text-surface-600">{debut}–{fin}</span>
        {" "}sur{" "}
        <span className="font-semibold text-surface-600">{total}</span> produit(s)
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChanger(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 hover:text-surface-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={13} />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onChanger(p)}
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                p === page
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onChanger(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-surface-200 bg-white text-surface-500 hover:bg-surface-50 hover:text-surface-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProduitsPage() {
  const {
    donnees,
    pagination,
    chargement,
    erreur,
    changerPage,
    changerRecherche,
    changerCategorie,
    filtres,
    actualiser,
    creerProduit,
    modifierProduit,
  } = useProduits();

  const { categories } = useCategories();

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [produitEnEdition, setProduitEnEdition] = useState(null);
  const [rechercheSaisie, setRechercheSaisie] = useState("");

  // Debounce recherche 350ms
  const timerRef = useState(null);
  function handleRecherche(val) {
    setRechercheSaisie(val);
    clearTimeout(timerRef[0]);
    timerRef[0] = setTimeout(() => changerRecherche(val), 350);
  }

  function ouvrirCreation() {
    setProduitEnEdition(null);
    setModaleOuverte(true);
  }

  function ouvrirEdition(produit) {
    setProduitEnEdition(produit);
    setModaleOuverte(true);
  }

  const handleSauvegarder = useCallback(async (payload, id) => {
    if (id) {
      await modifierProduit(id, payload);
    } else {
      await creerProduit(payload);
    }
  }, [creerProduit, modifierProduit]);

  const nbAlertes = donnees.filter(
    (p) => Number(p.stockMinimum ?? 0) > 0 && Number(p.stockActuel ?? 0) <= Number(p.stockMinimum ?? 0)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── En-tête ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 tracking-tight">Produits</h1>
          <p className="mt-0.5 text-sm text-surface-400">
            {pagination.total} produit(s) dans votre catalogue
            {nbAlertes > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-warning-700 font-medium">
                <AlertTriangle size={12} />
                {nbAlertes} en alerte
              </span>
            )}
          </p>
        </div>
        <button onClick={ouvrirCreation} className="btn-primary self-start sm:self-auto">
          <Plus size={16} />
          Nouveau produit
        </button>
      </div>

      {/* ── Filtres ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            value={rechercheSaisie}
            onChange={(e) => handleRecherche(e.target.value)}
            placeholder="Rechercher par nom, référence…"
            className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-9 pr-4 text-sm text-surface-900 placeholder-surface-400 transition-all focus:border-brand-500 focus:outline-none focus:shadow-input"
          />
        </div>

        {/* Filtre catégorie */}
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <select
            value={filtres.categorieId}
            onChange={(e) => changerCategorie(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white py-2.5 pl-8 pr-8 text-sm text-surface-700 focus:border-brand-500 focus:outline-none cursor-pointer"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        {/* Bouton actualiser */}
        <button
          onClick={actualiser}
          disabled={chargement}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={clsx(chargement && "animate-spin")} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* ── Erreur ───────────────────────────────────────────────────────────── */}
      {erreur && (
        <div className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-5 py-4">
          <AlertTriangle size={16} className="flex-shrink-0 text-danger-600" />
          <p className="text-sm text-danger-700">{erreur}</p>
        </div>
      )}

      {/* ── Tableau ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50/80">
                {["Produit", "Catégorie", "Prix achat", "Prix vente", "Stock actuel", "Seuil mini", "Statut", ""].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "py-3 text-xs font-semibold uppercase tracking-wider text-surface-400 whitespace-nowrap",
                      h === "Produit" ? "pl-6 pr-4 text-left" :
                      h === "" ? "pl-4 pr-6 text-right" :
                      "px-4 text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-100">
              {chargement
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonLigne key={i} />)
                : donnees.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="py-0">
                      <EmptyState
                        icone={Package}
                        titre={filtres.recherche ? "Aucun produit trouvé" : "Aucun produit dans le catalogue"}
                        sous={
                          filtres.recherche
                            ? `Aucun résultat pour "${filtres.recherche}". Essayez un autre terme.`
                            : "Commencez par ajouter votre premier produit."
                        }
                      />
                    </td>
                  </tr>
                )
                : donnees.map((produit, index) => {
                  const statut = statutStock(produit);
                  return (
                    <tr
                      key={produit.id}
                      className={clsx(
                        "group transition-colors hover:bg-surface-50",
                        statut === "rupture" && "bg-danger-50/30 hover:bg-danger-50/50",
                        statut === "critique" && index % 2 === 0 ? "bg-warning-50/20 hover:bg-warning-50/40" : ""
                      )}
                    >
                      {/* Produit */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                            statut === "rupture" ? "bg-danger-50" :
                            statut === "critique" ? "bg-warning-50" :
                            "bg-brand-50"
                          )}>
                            <Package size={16} className={clsx(
                              statut === "rupture" ? "text-danger-500" :
                              statut === "critique" ? "text-warning-600" :
                              "text-brand-500"
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-surface-900 truncate max-w-[180px]">
                              {produit.nom}
                            </p>
                            <p className="text-xs text-surface-400 truncate">
                              {produit.reference}
                              {produit.codeBarres && (
                                <span className="ml-1.5 text-surface-300">· {produit.codeBarres}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="px-4 py-4">
                        {produit.categorie ? (
                          <span className="inline-flex items-center rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
                            {produit.categorie.nom}
                          </span>
                        ) : (
                          <span className="text-xs text-surface-300">—</span>
                        )}
                      </td>

                      {/* Prix achat */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-surface-600 tabular-nums">
                          {formaterXOF(produit.prixAchat)}
                        </p>
                      </td>

                      {/* Prix vente */}
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-surface-900 tabular-nums">
                          {formaterXOF(produit.prixVente)}
                        </p>
                      </td>

                      {/* Stock actuel */}
                      <td className="px-4 py-4">
                        <ValeurStock produit={produit} />
                      </td>

                      {/* Seuil minimum */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-surface-500 tabular-nums">
                          {formaterStock(produit.stockMinimum)} {produit.unite}
                        </p>
                      </td>

                      {/* Badge statut */}
                      <td className="px-4 py-4">
                        <BadgeStock produit={produit} />
                      </td>

                      {/* Actions */}
                      <td className="pl-4 pr-6 py-4 text-right">
                        <button
                          onClick={() => ouvrirEdition(produit)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ml-auto"
                          title="Modifier"
                        >
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onChanger={changerPage} />
      </div>

      {/* ── Modale produit ────────────────────────────────────────────────────── */}
      <ModaleProduit
        ouvert={modaleOuverte}
        produit={produitEnEdition}
        onFermer={() => { setModaleOuverte(false); setProduitEnEdition(null); }}
        onSauvegarder={handleSauvegarder}
      />
    </div>
  );
}
