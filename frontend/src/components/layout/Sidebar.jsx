import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText,
  Settings, Users, Building2, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Barre de navigation latérale (Sidebar).
 * - Fixe sur grand écran (>= md)
 * - Tiroir coulissant (Drawer) avec backdrop sur mobile (< md)
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const isDirecteur = user?.role === 'DIRECTEUR';

  // Menu commun
  const menuItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projets', path: '/projets', icon: FolderKanban, hidden: user?.role === 'AGENT' },
    { name: 'Tâches', path: '/taches', icon: CheckSquare },
    { name: 'Rapports', path: '/rapports', icon: FileText },
  ].filter(item => !item.hidden);

  // Menu réservé au Directeur
  const directorItems = [
    { name: 'Utilisateurs', path: '/utilisateurs', icon: Users },
    { name: 'Départements', path: '/departements', icon: Building2 },
  ];

  return (
    <>
      {/* Backdrop sombre sur mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity md:hidden"
        />
      )}

      {/* Sidebar principale */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-private-blue text-white shadow-2xl transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* En-tête Sidebar / Logo + Bouton fermer sur mobile */}
        <div className="flex h-20 items-center justify-between border-b border-black/10 bg-black/10 px-4">
          <div className="flex items-center gap-3 flex-1">
            <img
              src="/logo.png"
              alt="Burkina Faso"
              className="h-11 w-auto object-contain rounded-md bg-white/10 p-1"
            />
            <div className="leading-tight">
              <h1 className="font-bold font-montserrat text-sm tracking-wide">
                <span className="text-private-orange">DSI</span> Dashboard
              </h1>
              <span className="block text-[10px] font-normal text-white/70">
                Ministère de la Santé
              </span>
            </div>
          </div>

          {/* Bouton fermer (mobile uniquement) */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Badge Rôle Utilisateur */}
        <div className="flex justify-center py-4">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/30">
            Rôle : {user?.role || 'AGENT'}
          </span>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white shadow-md'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {item.name}
              </NavLink>
            );
          })}

          {/* Section Administration (Directeur) */}
          {isDirecteur && (
            <>
              <div className="mx-3 my-3 border-t border-white/10" />
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                Administration
              </p>
              {directorItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white shadow-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer Sidebar (Paramètres) */}
        <div className="border-t border-black/10 p-3">
          <NavLink
            to="/parametres"
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-white/60 group-hover:text-white" />
            Paramètres
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
