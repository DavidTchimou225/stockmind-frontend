import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, ArrowRight, TrendingUp, Package, BarChart3 } from "lucide-react";
import useAuthStore from "../context/useAuthStore";
import clsx from "clsx";

// ─── Composant : Indicateur de force du mot de passe ─────────────────────────
function FeatureItem({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 text-white/80">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 flex-shrink-0">
        <Icon size={15} className="text-white" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

// ─── Composant : Champ de formulaire ─────────────────────────────────────────
function FormField({ label, id, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-surface-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger-600 animate-fade-in">
          <AlertCircle size={12} className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connexion, isLoading, erreur, effacerErreur, accessToken } = useAuthStore();

  const [form, setForm] = useState({ email: "", motDePasse: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  // Rediriger si déjà connecté (token ET utilisateur requis pour éviter boucle)
  const { utilisateur } = useAuthStore();
  useEffect(() => {
    if (accessToken && utilisateur) {
      navigate(from, { replace: true });
    }
  }, [accessToken, utilisateur, navigate, from]);

  // Effacer l'erreur serveur dès que l'utilisateur retape
  useEffect(() => {
    if (erreur) effacerErreur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email, form.motDePasse]);

  // ── Validation côté client ─────────────────────────────────────────────────
  function valider() {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = "L'adresse email est requise.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Veuillez saisir une adresse email valide.";
    }

    if (!form.motDePasse) {
      errors.motDePasse = "Le mot de passe est requis.";
    } else if (form.motDePasse.length < 6) {
      errors.motDePasse = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    return errors;
  }

  // ── Soumission ─────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    const errors = valider();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const result = await connexion(form.email.trim().toLowerCase(), form.motDePasse);

    if (result.succes) {
      navigate(from, { replace: true });
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (submitted) {
      const errors = valider();
      setFieldErrors((prev) => ({ ...prev, [name]: errors[name] }));
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Panneau gauche : branding ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-12 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-500/20 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <span className="text-lg font-black text-white">S</span>
            </div>
            <div>
              <p className="text-lg font-bold text-white tracking-tight">StockMind AI</p>
              <p className="text-xs text-white/60 -mt-0.5">Gestion intelligente de stock</p>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight text-balance">
              La gestion de stock réinventée pour les PME africaines
            </h1>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-sm">
              Prévisions IA, alertes en temps réel, rapports automatiques —
              tout ce dont vous avez besoin pour piloter votre activité.
            </p>
          </div>

          <div className="space-y-3">
            <FeatureItem icon={Package}    text="Gestion de stock multi-entrepôts" />
            <FeatureItem icon={TrendingUp} text="Prédictions de rupture anticipée" />
            <FeatureItem icon={BarChart3}  text="Rapports financiers journaliers" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} StockMind AI · Conçu pour l&apos;Afrique
          </p>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* En-tête mobile */}
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <span className="text-base font-black text-white">S</span>
            </div>
            <p className="text-lg font-bold text-surface-900 tracking-tight">StockMind AI</p>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900 tracking-tight">
              Bon retour 👋
            </h2>
            <p className="mt-1.5 text-sm text-surface-500">
              Connectez-vous à votre espace de gestion.
            </p>
          </div>

          {/* Carte formulaire */}
          <div className="card p-8 shadow-card-md">
            {/* Erreur serveur globale */}
            {erreur && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 animate-fade-in">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-danger-600" />
                <p className="text-sm text-danger-700 leading-snug">{erreur}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <FormField label="Adresse email" id="email" error={fieldErrors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={form.email}
                  onChange={handleChange}
                  placeholder="vous@entreprise.com"
                  className={clsx(
                    "input-base",
                    fieldErrors.email && "input-error"
                  )}
                />
              </FormField>

              {/* Mot de passe */}
              <FormField label="Mot de passe" id="motDePasse" error={fieldErrors.motDePasse}>
                <div className="relative">
                  <input
                    id="motDePasse"
                    name="motDePasse"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={form.motDePasse}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={clsx(
                      "input-base pr-11",
                      fieldErrors.motDePasse && "input-error"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormField>

              {/* Lien mot de passe oublié */}
              <div className="flex justify-end -mt-1">
                <Link
                  to="/mot-de-passe-oublie"
                  className="text-xs text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton de connexion */}
              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "btn-primary btn-lg w-full mt-2",
                  isLoading && "cursor-not-allowed opacity-75"
                )}
              >
                {isLoading ? (
                  <>
                    <span className="spinner border-white" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Lien inscription */}
          <p className="mt-6 text-center text-sm text-surface-500">
            Pas encore de compte ?{" "}
            <Link
              to="/inscription"
              className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
            >
              Créer votre entreprise
            </Link>
          </p>

          {/* Mention légale */}
          <p className="mt-4 text-center text-xs text-surface-400">
            En vous connectant, vous acceptez nos{" "}
            <a href="#" className="hover:underline">Conditions d&apos;utilisation</a>
            {" "}et notre{" "}
            <a href="#" className="hover:underline">Politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
