import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Layout principal de l'application DSI Dashboard avec gestion responsive complète.
 */
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-private-light font-sans">
      {/* Sidebar (Desktop fixe + Mobile drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Conteneur principal droite */}
      <div className="flex flex-1 flex-col overflow-hidden w-full min-w-0">
        {/* Barre de navigation supérieure avec bouton toggle mobile */}
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Zone de contenu principale scrollable et responsive */}
        <main className="flex-1 overflow-y-auto bg-private-light p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
