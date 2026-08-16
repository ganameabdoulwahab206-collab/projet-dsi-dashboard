import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Composant Route Protégée.
 * Enveloppe les routes nécessitant une authentification (Dashboard, Projets...).
 * Si l'utilisateur n'est pas connecté, il est redirigé vers /login.
 * 
 * S'il est connecté, on affiche les routes enfants grâce à <Outlet />.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Évite de rediriger pendant que l'on vérifie le localStorage
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Redirection vers le login si déconnecté
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Affiche les sous-routes (ex: /dashboard, /projets)
  return <Outlet />;
};

export default ProtectedRoute;
