import React from 'react';
import { Bell, Search, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Barre de navigation supérieure (Navbar).
 * Contient le champ de recherche, les notifications et le profil utilisateur.
 */
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      {/* Côté Gauche : Recherche */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-private-blue sm:text-sm sm:leading-6"
            placeholder="Rechercher un projet, une tâche..."
          />
        </div>
      </div>

      {/* Côté Droit : Notifications & Profil */}
      <div className="flex items-center space-x-6">
        {/* Bouton Notifications */}
        <button className="relative text-gray-400 transition-colors hover:text-gray-500">
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gov-red text-[10px] font-bold text-white ring-2 ring-white">
            3
          </span>
          <Bell className="h-6 w-6" />
        </button>

        {/* Séparateur vertical */}
        <div className="hidden h-6 w-px bg-gray-200 sm:block"></div>

        {/* Profil Utilisateur */}
        <div className="flex items-center space-x-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-gray-900">{user?.nom || 'Utilisateur'}</span>
            <span className="text-xs text-gray-500">
              {user?.departement ? `Dpt. ${user.departement}` : 'Directeur Général'}
            </span>
          </div>
          <UserCircle className="h-9 w-9 text-gray-400" />
          
          {/* Bouton Déconnexion */}
          <button 
            onClick={logout}
            className="ml-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gov-red"
            title="Se déconnecter"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
