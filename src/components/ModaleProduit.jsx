import { useState, useEffect, useRef } from "react";
import { X, Package, Barcode, AlertCircle, Check, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useCategories } from "../hooks/useProduits";

// ─── Champ de formulaire réutilisable ────────────────────────────────────────

function Champ({ label, id, erreur, requis, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-surface-600 uppercase tracking-wide">
        {label}
        {requis && <span className="ml-1 text-danger-500">*</span>}
      </label>
      {children}
      {erreur && (
        <p className="flex items-center gap-1 text-xs text-danger-600 animate-fade-in">
          <AlertCircle size={11} className="flex-shrink-0" />
          {erreur}
        </p>
      )}
    </div>
  );
}

function InputTexte({ id, value, onChange, placeholder, erreur, type = "text", ...rest }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-all duration-150 focus:outline-none focus:border-brand-500 focus:shadow-input",
        erreur ? "border-danger-400" : "border-surface-200"
      )}
      {...rest}
    />
  );
}

function InputNombre({ id, value, onChange, placeholder, min = "0", erreur, ...rest }) {
  return (
    <input
      id={id}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step="0.01"
      className={clsx(
        "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-all duration-150 focus:outline-none focus:border-brand-500 focus:shadow-input",
        erreur ? "border-danger-400" : "border-surface-200"
      )}
      {...rest}
    />
  );
}

// ─── État initial du formulaire ───────────────────────────────────────────────

function etatInitial(produit = null) {
  return {
    reference:    produit?.reference    ?? "",
    nom:          produit?.nom          ?? "",
    description:  produit?.description  ?? "",
    categorieId:  produit?.categorieId  ?? "",
    unite:        produit?.unite        ?? "pcs",
    prixAchat:    produit?.prixAchat    != null ? String(produit.prixAchat)    : "",
    prixVente:    produit?.prixVente    != null ? String(produit.prixVente)    : "",
    stockMinimum: produit?.stockMinimum != null ? String(produit.stockMinimum) : "0",
    stockMaximum: produit?.stockMaximum != null ? String(produit.stockMaximum) : "",
    emplacement:  produit?.emplacement  ?? "",
    codeBarres:   produit?.codeBarres   ?? "",
    actif:        produit?.actif        ?? true,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function valider(form) {
  const e = {};
  if (!form.reference.trim()) e.reference = "La référence est requise.";
  if (!form.nom.trim()) e.nom = "Le nom est requis.";
  if (form.prixAchat !== "" && isNaN(Number(form.prixAchat))) e.prixAchat = "Prix invalide.";
  if (form.prixVente !== "" && isNaN(Number(form.prixVente))) e.prixVente = "Prix invalide.";
  if (form.stockMinimum !== "" && (isNaN(Number(form.stockMinimum)) || Number(form.stockMinimum) < 0))
    e.stockMinimum = "Seuil invalide.";
  return e;
}

// ─── Modale principale ────────────────────────────────────────────────────────

export default function ModaleProduit({ ouvert, produit = null, onFermer, onSauvegarder }) {
  const modeEdition = Boolean(produit?.id);
  const { categories } = useCategories();

  const [form, setForm] = useState(etatInitial(produit));
  const [erreurs, setErreurs] = useState({});
  const [soumis, setSoumis] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurServeur, setErreurServeur] = useState("");
  const [succes, setSucces] = useState(false);

  const premierChampRef = useRef(null);

  // Réinitialiser à chaque ouverture
  useEffect(() => {
    if (ouvert) {
      setForm(etatInitial(produit));
      setErreurs({});
      setSoumis(false);
      setErreurServeur("");
      setSucces(false);
      setTimeout(() => premierChampRef.current?.focus(), 50);
    }
  }, [ouvert, produit]);

  // Fermer sur Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && ouvert) onFermer();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ouvert, onFermer]);

  function changer(champ) {
    return (val) => {
      setForm((prev) => ({ ...prev, [champ]: val }));
      if (soumis) {
        const e = valider({ ...form, [champ]: val });
        setErreurs(e);
      }
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSoumis(true);
    const e2 = valider(form);
    setErreurs(e2);
    if (Object.keys(e2).length > 0) return;

    setEnregistrement(true);
    setErreurServeur("");

    try {
      const payload = {
        reference:   form.reference.trim(),
        nom:         form.nom.trim(),
        description: form.description.trim() || undefined,
        categorieId: form.categorieId || undefined,
        unite:       form.unite.trim() || "pcs",
        prixAchat:   form.prixAchat   !== "" ? Number(form.prixAchat)    : undefined,
        prixVente:   form.prixVente   !== "" ? Number(form.prixVente)    : undefined,
        stockMinimum: form.stockMinimum !== "" ? Number(form.stockMinimum) : undefined,
        stockMaximum: form.stockMaximum !== "" ? Number(form.stockMaximum) : undefined,
        emplacement: form.emplacement.trim() || undefined,
        codeBarres:  form.codeBarres.trim()  || undefined,
        ...(modeEdition && { actif: form.actif }),
      };

      await onSauvegarder(payload, produit?.id);
      setSucces(true);
      setTimeout(() => { setSucces(false); onFermer(); }, 900);
    } catch (err) {
      setErreurServeur(
        err?.response?.data?.message ??
        err?.response?.data?.erreur ??
        "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onFermer}
      />

      {/* Panneau */}
      <div className="relative w-full max-w-2xl animate-slide-up bg-white rounded-2xl shadow-card-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
              <Package size={18} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-900 leading-tight">
                {modeEdition ? "Modifier le produit" : "Nouveau produit"}
              </h2>
              {modeEdition && (
                <p className="text-xs text-surface-400 leading-tight mt-0.5">
                  Réf. {produit.reference}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onFermer}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Erreur serveur */}
        {erreurServeur && (
          <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 flex-shrink-0 animate-fade-in">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-danger-600" />
            <p className="text-sm text-danger-700">{erreurServeur}</p>
          </div>
        )}

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1 px-6 py-5">
          <div className="space-y-6">
            {/* Bloc 1 : Identification */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-300">
                Identification
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Champ label="Référence" id="reference" erreur={erreurs.reference} requis>
                  <InputTexte
                    id="reference"
                    ref={premierChampRef}
                    value={form.reference}
                    onChange={changer("reference")}
                    placeholder="ex: PROD-001"
                    erreur={erreurs.reference}
                  />
                </Champ>
                <Champ label="Nom du produit" id="nom" erreur={erreurs.nom} requis>
                  <InputTexte
                    id="nom"
                    value={form.nom}
                    onChange={changer("nom")}
                    placeholder="ex: Farine de blé 25kg"
                    erreur={erreurs.nom}
                  />
                </Champ>
              </div>

              <div className="mt-4">
                <Champ label="Description" id="description">
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => changer("description")(e.target.value)}
                    placeholder="Description optionnelle du produit..."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-all focus:outline-none focus:border-brand-500 focus:shadow-input"
                  />
                </Champ>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Champ label="Catégorie" id="categorieId">
                  <select
                    id="categorieId"
                    value={form.categorieId}
                    onChange={(e) => changer("categorieId")(e.target.value)}
                    className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-all focus:outline-none focus:border-brand-500 focus:shadow-input"
                  >
                    <option value="">— Sans catégorie —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </Champ>
                <Champ label="Unité" id="unite">
                  <InputTexte
                    id="unite"
                    value={form.unite}
                    onChange={changer("unite")}
                    placeholder="pcs, kg, litre…"
                  />
                </Champ>
              </div>
            </div>

            {/* Bloc 2 : Tarification */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-300">
                Tarification (FCFA)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Champ label="Prix d'achat" id="prixAchat" erreur={erreurs.prixAchat}>
                  <InputNombre
                    id="prixAchat"
                    value={form.prixAchat}
                    onChange={changer("prixAchat")}
                    placeholder="0"
                    erreur={erreurs.prixAchat}
                  />
                </Champ>
                <Champ label="Prix de vente" id="prixVente" erreur={erreurs.prixVente}>
                  <InputNombre
                    id="prixVente"
                    value={form.prixVente}
                    onChange={changer("prixVente")}
                    placeholder="0"
                    erreur={erreurs.prixVente}
                  />
                </Champ>
              </div>
            </div>

            {/* Bloc 3 : Stock */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-300">
                Seuils de stock
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Champ label="Stock minimum (seuil alerte)" id="stockMinimum" erreur={erreurs.stockMinimum}>
                  <InputNombre
                    id="stockMinimum"
                    value={form.stockMinimum}
                    onChange={changer("stockMinimum")}
                    placeholder="0"
                    erreur={erreurs.stockMinimum}
                  />
                </Champ>
                <Champ label="Stock maximum" id="stockMaximum">
                  <InputNombre
                    id="stockMaximum"
                    value={form.stockMaximum}
                    onChange={changer("stockMaximum")}
                    placeholder="Illimité"
                  />
                </Champ>
              </div>
            </div>

            {/* Bloc 4 : Logistique */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-300">
                Logistique & identification
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Champ label="Emplacement" id="emplacement">
                  <InputTexte
                    id="emplacement"
                    value={form.emplacement}
                    onChange={changer("emplacement")}
                    placeholder="ex: Rayon A3, Entrepôt 2"
                  />
                </Champ>
                <Champ label="Code-barres" id="codeBarres">
                  <div className="relative">
                    <InputTexte
                      id="codeBarres"
                      value={form.codeBarres}
                      onChange={changer("codeBarres")}
                      placeholder="EAN13, QR, UPC…"
                    />
                    <Barcode
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300 pointer-events-none"
                    />
                  </div>
                </Champ>
              </div>

              {/* Toggle actif (mode édition seulement) */}
              {modeEdition && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-surface-700">Produit actif</p>
                    <p className="text-xs text-surface-400">Un produit inactif n&apos;apparaît pas dans les ventes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => changer("actif")(!form.actif)}
                    className={clsx(
                      "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none",
                      form.actif ? "bg-brand-600" : "bg-surface-300"
                    )}
                    role="switch"
                    aria-checked={form.actif}
                  >
                    <span
                      className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200",
                        form.actif ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Pied de modale */}
        <div className="flex items-center justify-end gap-3 border-t border-surface-100 px-6 py-4 flex-shrink-0 bg-surface-50/50">
          <button type="button" onClick={onFermer} className="btn-secondary">
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={enregistrement || succes}
            className={clsx(
              "btn inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none",
              succes
                ? "bg-success-600 shadow-none"
                : "bg-brand-600 hover:bg-brand-700 active:scale-[0.98] shadow-brand hover:shadow-none"
            )}
          >
            {succes ? (
              <><Check size={15} /> Enregistré !</>
            ) : enregistrement ? (
              <><Loader2 size={15} className="animate-spin" /> Enregistrement…</>
            ) : (
              modeEdition ? "Mettre à jour" : "Créer le produit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
