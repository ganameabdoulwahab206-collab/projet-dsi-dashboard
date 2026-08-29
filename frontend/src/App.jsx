import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjetsPage from './pages/ProjetsPage';
import ProjetDetailPage from './pages/ProjetDetailPage';
import TachesPage from './pages/TachesPage';
import UtilisateursPage from './pages/UtilisateursPage';
import DepartementsPage from './pages/DepartementsPage';
import RapportsPage from './pages/RapportsPage';
import ParametresPage from './pages/ParametresPage';
import { Toaster } from 'react-hot-toast';

/**
 * Composant Racine de l'application React.
 * Configure le routage (React Router) et englobe l'application
 * avec le AuthProvider pour la gestion globale de l'authentification.
 */
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées enveloppées par MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Projets */}
              <Route path="/projets" element={<ProjetsPage />} />
              <Route path="/projets/:id" element={<ProjetDetailPage />} />
              
              {/* Tâches */}
              <Route path="/taches" element={<TachesPage />} />
              
              {/* Rapports */}
              <Route path="/rapports" element={<RapportsPage />} />

              {/* Administration — Directeur uniquement */}
              <Route path="/utilisateurs" element={<UtilisateursPage />} />
              <Route path="/departements" element={<DepartementsPage />} />

              {/* Paramètres — accessible à tous */}
              <Route path="/parametres" element={<ParametresPage />} />

              {/* Redirection par défaut (racine) vers /dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Redirection pour toute URL inconnue (404) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
