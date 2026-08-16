import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Layout principal de l'application DSI Dashboard.
 * 
 * Structure de la page :
 * - Gauche : Sidebar (fixe)
 * - Droite Haut : Navbar (fixe)
 * - Droite Bas : Zone de contenu principal (scrollable) où <Outlet />
 *   injecte le contenu spécifique à la route courante (Dashboard, Projets, etc.)
 */
const MainLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-private-light font-sans">
      {/* Sidebar latérale fixe */}
      <Sidebar />

      {/* Conteneur principal droite */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barre de navigation supérieure */}
        <Navbar />

        {/* Zone de contenu principale scrollable */}
        <main className="flex-1 overflow-y-auto bg-private-light p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
