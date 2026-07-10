import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Wallet,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import useAuthStore from "../context/useAuthStore";

// ─── Configuration de la navigation ──────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    href: "/dashboard",
    icone: LayoutDashboard,
  },
  {
    id: "produits",
    label: "Produits",
    href: "/produits",
    icone: Package,
  },
  {
    id: "ventes",
    label: "Ventes",
    href: "/ventes",
    icone: ShoppingCart,
  },
  {
    id: "achats",
    label: "Achats",
    href: "/achats",
    icone: Truck,
  },
  {
    id: "tresorerie",
    label: "Trésorerie",
    href: "/tresorerie",
    icone: Wallet,
  },
  {
    id: "insights",
    label: "Insights IA",
    href: "/insights",
    icone: Sparkles,
    badge: "IA",
  },
  {
    id: "parametres",
    label: "Paramètres",
    href: "/parametres",
    icone: Settings,
    separatorBefore: true,
  },
];

// ─── Composant : Élément de navigation ───────────────────────────────────────

function NavItem({ item, collapsed, onClick }) {
  return (
    <>
      {item.separatorBefore && (
        <div className="mx-3 my-2 border-t border-surface-800/60" />
      )}
      <NavLink
        to={item.href}
        onClick={onClick}
        className={({ isActive }) =>
          clsx(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none",
            isActive
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/60 hover:bg-white/6 hover:text-white/90"
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Indicateur actif */}
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-400" />
            )}

            <item.icone
              size={18}
              strokeWidth={isActive ? 2 : 1.8}
              className="flex-shrink-0"
            />

            {!collapsed && (
              <span className="flex-1 truncate">{item.label}</span>
            )}

            {!collapsed && item.badge && (
              <span className="flex h-5 items-center rounded-full bg-brand-500/30 px-1.5 text-[10px] font-semibold text-brand-300 leading-none">
                {item.badge}
              </span>
            )}

            {/* Tooltip pour mode collapsed */}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-surface-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>
    </>
  );
}

// ─── Composant : Avatar utilisateur ──────────────────────────────────────────

function UserMenu({ utilisateur, collapsed, onDeconnexion }) {
  const [ouvert, setOuvert] = useState(false);
  const initiales =
    ((utilisateur?.prenom?.[0] ?? "") + (utilisateur?.nom?.[0] ?? "")).toUpperCase() || "?";

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert((v) => !v)}
        className={clsx(
          "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-white/8",
          collapsed && "justify-center"
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/40 text-xs font-bold text-white">
          {initiales}
        </div>

        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white leading-tight">
                {utilisateur?.prenom} {utilisateur?.nom}
              </p>
              <p className="truncate text-xs text-white/50 leading-tight mt-0.5">
                {utilisateur?.role}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={clsx(
                "flex-shrink-0 text-white/40 transition-transform duration-200",
                ouvert && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {ouvert && (
        <div
          className={clsx(
            "absolute bottom-full mb-2 z-50 min-w-[180px] rounded-xl border border-surface-200 bg-white shadow-card-lg py-1.5 animate-fade-in",
            collapsed ? "left-0" : "left-0 right-0"
          )}
        >
          <div className="px-3 py-2 border-b border-surface-100 mb-1">
            <p className="text-xs font-semibold text-surface-900 truncate">
              {utilisateur?.prenom} {utilisateur?.nom}
            </p>
            <p className="text-xs text-surface-400 truncate">{utilisateur?.email}</p>
          </div>

          <button
            onClick={() => { setOuvert(false); onDeconnexion(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors rounded-md mx-auto"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle, mobileOuvert, onMobileClose }) {
  const { utilisateur, deconnexion } = useAuthStore();
  const navigate = useNavigate();

  async function handleDeconnexion() {
    await deconnexion();
    navigate("/connexion");
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-surface-900 to-brand-900">
      {/* Logo + toggle collapse */}
      <div className={clsx(
        "flex items-center border-b border-white/8 px-4 py-4 flex-shrink-0",
        collapsed ? "justify-center" : "justify-between gap-2"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500 shadow-brand">
              <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white tracking-tight truncate">StockMind AI</p>
              <p className="text-[10px] text-white/40 truncate">Gestion intelligente</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 shadow-brand">
            <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
          </div>
        )}

        <button
          onClick={onToggle}
          className="hidden lg:flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-white/40 hover:bg-white/8 hover:text-white transition-colors"
          aria-label={collapsed ? "Développer la sidebar" : "Réduire la sidebar"}
        >
          <Menu size={15} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onClick={onMobileClose}
          />
        ))}
      </nav>

      {/* Footer utilisateur */}
      <div className="border-t border-white/8 px-2 py-3 flex-shrink-0">
        <UserMenu
          utilisateur={utilisateur}
          collapsed={collapsed}
          onDeconnexion={handleDeconnexion}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Overlay mobile */}
      {mobileOuvert && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col lg:hidden transition-transform duration-300 ease-in-out",
          mobileOuvert ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ onMobileMenuToggle, alertesCount = 0 }) {
  const location = useLocation();
  const { utilisateur } = useAuthStore();

  const pageCourante = NAV_ITEMS.find((item) => item.href === location.pathname);
  const titre = pageCourante?.label ?? "StockMind AI";

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
      {/* Bouton menu mobile + Titre */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-sm font-semibold text-surface-900">{titre}</h1>
        </div>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-2">
        {/* Cloche de notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors">
          <Bell size={17} />
          {alertesCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white leading-none">
              {alertesCount > 9 ? "9+" : alertesCount}
            </span>
          )}
        </button>

        {/* Avatar compact */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
          {((utilisateur?.prenom?.[0] ?? "") + (utilisateur?.nom?.[0] ?? "")).toUpperCase() || "?"}
        </div>
      </div>
    </header>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function DashboardLayout({ children, alertesCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOuvert, setMobileOuvert] = useState(false);
  const location = useLocation();

  // Fermer le menu mobile à chaque navigation
  useEffect(() => {
    setMobileOuvert(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOuvert={mobileOuvert}
        onMobileClose={() => setMobileOuvert(false)}
      />

      {/* Zone principale */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          onMobileMenuToggle={() => setMobileOuvert(true)}
          alertesCount={alertesCount}
        />

        {/* Contenu page */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
