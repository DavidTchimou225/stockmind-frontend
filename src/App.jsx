import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProduitsPage from "./pages/ProduitsPage";
import VentesPage from "./pages/VentesPage";
import AchatsPage from "./pages/AchatsPage";
import TresoreriePage from "./pages/TresorerierPage";
import InsightsPage from "./pages/InsightsPage";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function PageEnConstruction({ titre }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 text-surface-300 mb-5">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-lg font-semibold text-surface-900 mb-1">{titre}</h2>
      <p className="text-sm text-surface-400 max-w-xs">
        Cette section est en cours de développement et sera disponible prochainement.
      </p>
    </div>
  );
}

function NonAutorise() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50">
      <div className="card px-8 py-10 text-center max-w-sm">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-lg font-semibold text-surface-900 mb-2">Accès refusé</h1>
        <p className="text-sm text-surface-500">
          Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.
        </p>
      </div>
    </div>
  );
}

function LayoutProtege({ children, roleRequis }) {
  return (
    <ProtectedRoute roleRequis={roleRequis}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Publiques */}
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/non-autorise" element={<NonAutorise />} />

        {/* Application protégée */}
        <Route
          path="/dashboard"
          element={
            <LayoutProtege>
              <DashboardPage />
            </LayoutProtege>
          }
        />
        <Route
          path="/produits"
          element={
            <LayoutProtege>
              <ProduitsPage />
            </LayoutProtege>
          }
        />
        <Route
          path="/ventes"
          element={
            <LayoutProtege>
              <VentesPage />
            </LayoutProtege>
          }
        />
        <Route
          path="/achats"
          element={
            <LayoutProtege roleRequis="MANAGER">
              <AchatsPage />
            </LayoutProtege>
          }
        />
        <Route
          path="/tresorerie"
          element={
            <LayoutProtege>
              <TresoreriePage />
            </LayoutProtege>
          }
        />
        <Route
          path="/insights"
          element={
            <LayoutProtege>
              <InsightsPage />
            </LayoutProtege>
          }
        />
        <Route
          path="/parametres"
          element={
            <LayoutProtege roleRequis="ADMIN">
              <PageEnConstruction titre="Paramètres" />
            </LayoutProtege>
          }
        />

        {/* Redirections */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
