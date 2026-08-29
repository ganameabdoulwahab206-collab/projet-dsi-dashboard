import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Search, UserCircle, LogOut, Menu, AlertTriangle,
  Clock, CheckCircle, FolderKanban, CheckSquare, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

/**
 * Barre de navigation supérieure (Navbar).
 * - Tiroir responsive mobile (Hamburger)
 * - Centre de notifications dynamique et interactif
 * - Profil utilisateur et déconnexion
 */
const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Rafraîchissement automatique toutes les 15 secondes pour les nouvelles notifications
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifsList = [];

      // 1. Tâches assignées à l'utilisateur connecté
      try {
        const resMesTaches = await api.get('/taches/mes-taches');
        const mesTaches = resMesTaches.data || [];

        mesTaches.forEach((t) => {
          if (t.statut !== 'TERMINEE') {
            const isEnRetard = t.dateEcheance && new Date(t.dateEcheance) < new Date();
            const prioriteTxt = t.priorite >= 4 ? 'Critique' : t.priorite === 3 ? 'Haute' : t.priorite === 2 ? 'Moyenne' : 'Basse';
            const projetNom = t.projet?.titre || 'Projet';

            notifsList.push({
              id: `tache-assignee-${t.id}`,
              titre: isEnRetard ? '⚠️ Tâche en retard' : '📋 Tâche assignée',
              message: `"${t.description}" (${projetNom}) · Priorité ${prioriteTxt}`,
              date: t.dateEcheance,
              type: isEnRetard ? 'URGENT' : t.priorite >= 3 ? 'ALERT' : 'INFO',
              lien: '/taches',
            });
          }
        });
      } catch (e) {
        // Ignorer si erreur
      }

      // 2. Projets en retard (pour DIRECTEUR / CHEF_SERVICE)
      if (user?.role === 'DIRECTEUR' || user?.role === 'CHEF_SERVICE') {
        try {
          const resProjetsRetard = await api.get('/projets/en-retard');
          const projetsRetard = resProjetsRetard.data || [];
          projetsRetard.forEach((p) => {
            notifsList.push({
              id: `projet-retard-${p.id}`,
              titre: '🚨 Projet en retard',
              message: `Le projet "${p.titre}" a dépassé sa date de fin.`,
              date: p.dateFin,
              type: 'ALERT',
              lien: `/projets/${p.id}`,
            });
          });
        } catch (e) {
          // Ignorer
        }
      }

      setNotifications(notifsList);
    } catch (error) {
      console.error('Erreur chargement notifications', error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const unreadCount = notifications.length;

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = (lien) => {
    setShowNotifications(false);
    if (lien) navigate(lien);
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs z-20 relative">
      {/* Côté Gauche : Bouton Hamburger Mobile + Recherche */}
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          title="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="relative w-full max-w-xs sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border-0 py-1.5 pl-9 pr-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs sm:text-sm"
            placeholder="Rechercher un projet, une tâche..."
          />
        </div>
      </div>

      {/* Côté Droit : Notifications & Profil */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Centre de Notifications avec Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleNotifications}
            className={`relative rounded-full p-2 transition-colors ${
              showNotifications ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
            title="Notifications"
          >
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
            <Bell className="h-5 w-5" />
          </button>

          {/* Menu Déroulant des Notifications */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-700" />
                  <h3 className="text-sm font-bold font-montserrat text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[11px] font-bold text-blue-800">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {loadingNotifs ? (
                  <div className="p-8 text-center text-xs text-slate-400">Chargement...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                    <p className="text-sm font-semibold text-slate-900">Tout est à jour !</p>
                    <p className="text-xs text-slate-400 mt-1">Aucune alerte ni retard signalé.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.lien)}
                      className="flex items-start gap-3 p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div
                        className={`rounded-full p-2 flex-shrink-0 mt-0.5 ${
                          notif.type === 'URGENT'
                            ? 'bg-red-50 text-red-600'
                            : notif.type === 'ALERT'
                            ? 'bg-orange-50 text-orange-600'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {notif.type === 'URGENT' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : notif.type === 'ALERT' ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : (
                          <CheckSquare className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{notif.titre}</p>
                          {notif.date && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(notif.date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-center">
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Effacer les notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Séparateur vertical */}
        <div className="hidden h-6 w-px bg-slate-200 sm:block"></div>

        {/* Profil Utilisateur */}
        <Link
          to="/parametres"
          className="flex items-center space-x-2.5 rounded-lg p-1.5 transition-colors hover:bg-slate-50"
        >
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-xs sm:text-sm font-semibold text-slate-900">{user?.nom || 'Utilisateur'}</span>
            <span className="text-[11px] text-slate-500">
              {user?.departement?.nom || (user?.role === 'DIRECTEUR' ? 'Directeur Général' : 'Agent')}
            </span>
          </div>
          <UserCircle className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400" />
        </Link>

        {/* Bouton Déconnexion */}
        <button
          onClick={logout}
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Se déconnecter"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
