import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, FileText, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Barre de navigation latérale (Sidebar).
 * Affiche le logo du Ministère et les liens de navigation.
 * Les liens actifs sont mis en surbrillance grâce à NavLink.
 */
const Sidebar = () => {
  const { user } = useAuth();

  const isDirecteur = user?.role === 'DIRECTEUR';

  // Menu commun à tous les rôles
  const menuItems = [
    { name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projets', path: '/projets', icon: FolderKanban, hidden: user?.role === 'AGENT' },
    { name: 'Tâches', path: '/taches', icon: CheckSquare },
    { name: 'Rapports', path: '/rapports', icon: FileText },
  ].filter(item => !item.hidden);

  // Menu réservé au Directeur
  const directorItems = [
    { name: 'Utilisateurs', path: '/utilisateurs', icon: Users },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-private-blue text-white shadow-xl">
      {/* En-tête Sidebar / Logo */}
      <div className="flex h-16 items-center justify-center border-b border-black/10 bg-black/10 px-4">
        <h1 className="text-center font-bold leading-tight">
          <span className="text-private-orange">DSI</span> Dashboard
          <span className="block text-xs font-normal text-white/70">Ministère de la Santé</span>
        </h1>
      </div>

      {/* Badge Rôle Utilisateur */}
      <div className="flex justify-center py-4">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/30">
          Rôle : {user?.role || 'AGENT'}
        </span>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
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

        {/* Section Directeur */}
        {isDirecteur && (
          <>
            <div className="mx-3 my-3 border-t border-white/10" />
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Administration</p>
            {directorItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
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
        <a
          href="#"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-white/60 group-hover:text-white" />
          Paramètres
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
