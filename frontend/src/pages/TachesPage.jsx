import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertTriangle, Search, Filter, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TacheDetailModal from '../components/taches/TacheDetailModal';
import toast from 'react-hot-toast';

/**
 * Composant : Page de Gestion des Tâches (Mon Espace)
 * Affiche les tâches de l'utilisateur connecté sous forme de Kanban à 4 colonnes.
 * Permet de modifier rapidement le statut et filtrer par recherche/priorité.
 */
const TachesPage = () => {
  const { user } = useAuth();
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTache, setSelectedTache] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [prioriteFilter, setPrioriteFilter] = useState('TOUTES');

  useEffect(() => {
    fetchMesTaches();
  }, []);

  const fetchMesTaches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/taches/mes-taches');
      setTaches(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches', error);
      toast.error('Erreur lors du chargement des tâches.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Appelle l'API pour changer le statut d'une tâche.
   */
  const handleStatusChange = async (tacheId, nouveauStatut) => {
    try {
      await api.put(`/taches/${tacheId}/statut`, { statut: nouveauStatut });
      setTaches(taches.map(t => 
        t.id === tacheId ? { ...t, statut: nouveauStatut } : t
      ));
      
      if (selectedTache && selectedTache.id === tacheId) {
        setSelectedTache({ ...selectedTache, statut: nouveauStatut });
      }
      toast.success('Statut de la tâche mis à jour.');
    } catch (error) {
      console.error('Erreur lors du changement de statut', error);
      toast.error('Erreur lors de la modification du statut.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Filtrage des tâches selon recherche et priorité
  const filteredTaches = taches.filter(t => {
    const matchSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.projet?.titre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPriorite = prioriteFilter === 'TOUTES' || t.priorite === parseInt(prioriteFilter);
    return matchSearch && matchPriorite;
  });

  // Filtrage par statuts pour les 4 colonnes Kanban
  const tachesAFaire = filteredTaches.filter(t => t.statut === 'A_FAIRE' || t.statut === 'EN_ATTENTE');
  const tachesEnCours = filteredTaches.filter(t => t.statut === 'EN_COURS');
  const tachesBloquees = filteredTaches.filter(t => t.statut === 'BLOQUEE');
  const tachesTerminees = filteredTaches.filter(t => t.statut === 'TERMINEE');

  // Rendu générique d'une colonne Kanban
  const renderTacheList = (titre, listeTaches, colorCls, badgeCls) => (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[450px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`flex items-center text-xs font-bold uppercase tracking-wider font-montserrat ${colorCls}`}>
          <span className="mr-2 h-2.5 w-2.5 rounded-full bg-current"></span>
          {titre}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeCls}`}>
          {listeTaches.length}
        </span>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {listeTaches.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs italic text-slate-400">
            Aucune tâche
          </div>
        ) : (
          listeTaches.map(tache => {
            const isEnRetard = tache.dateEcheance && new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE';
            const prioriteLabel = tache.priorite >= 4 ? 'Critique' : tache.priorite === 3 ? 'Haute' : tache.priorite === 2 ? 'Moyenne' : 'Basse';
            const prioriteCls = tache.priorite >= 4 ? 'bg-red-100 text-red-700' :
                                tache.priorite === 3 ? 'bg-red-50 text-red-700' :
                                tache.priorite === 2 ? 'bg-yellow-50 text-yellow-800' :
                                'bg-blue-50 text-blue-700';

            return (
              <div 
                key={tache.id} 
                onClick={() => setSelectedTache(tache)}
                className="group relative cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:bg-white hover:border-blue-300"
              >
                {/* Projet parent si disponible */}
                {tache.projet && (
                  <div className="mb-2 flex items-center gap-1 text-[11px] font-medium text-blue-600">
                    <FolderKanban className="h-3 w-3" />
                    <span className="line-clamp-1">{tache.projet.titre}</span>
                  </div>
                )}

                {/* Priorité + Sélecteur de statut rapide */}
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${prioriteCls}`}>
                    {prioriteLabel}
                  </span>
                  
                  <select 
                    className="block rounded-md border-0 py-1 pl-2 pr-6 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white"
                    value={tache.statut}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(tache.id, e.target.value)}
                  >
                    <option value="A_FAIRE">À Faire</option>
                    <option value="EN_COURS">En Cours</option>
                    <option value="BLOQUEE">Bloquée</option>
                    <option value="TERMINEE">Terminée</option>
                  </select>
                </div>

                {/* Description */}
                <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-3">{tache.description}</p>
                
                {/* Échéance */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tache.dateEcheance ? new Date(tache.dateEcheance).toLocaleDateString('fr-FR') : 'Sans date'}</span>
                  </div>
                  
                  {isEnRetard && (
                    <span className="flex items-center gap-1 font-semibold text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" /> Retard
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-blue-700">Mon Plan de Travail</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tableau Kanban de vos tâches assignées avec mise à jour rapide du statut.</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une tâche ou un projet..."
            className="w-full rounded-lg border-0 py-2 pl-9 pr-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 w-full sm:w-auto"
            value={prioriteFilter}
            onChange={(e) => setPrioriteFilter(e.target.value)}
          >
            <option value="TOUTES">Toutes les priorités</option>
            <option value="1">Priorité Basse</option>
            <option value="2">Priorité Moyenne</option>
            <option value="3">Priorité Haute</option>
            <option value="4">Priorité Critique</option>
          </select>
        </div>
      </div>

      {/* Grille Kanban (4 colonnes) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {renderTacheList("À Faire", tachesAFaire, "text-slate-600", "bg-slate-100 text-slate-700")}
        {renderTacheList("En Cours", tachesEnCours, "text-blue-700", "bg-blue-100 text-blue-800")}
        {renderTacheList("Bloquées", tachesBloquees, "text-red-600", "bg-red-100 text-red-700")}
        {renderTacheList("Terminées", tachesTerminees, "text-green-600", "bg-green-100 text-green-800")}
      </div>
      
      {/* Modale de détails de tâche */}
      {selectedTache && (
        <TacheDetailModal 
          tache={selectedTache} 
          onClose={() => setSelectedTache(null)} 
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

export default TachesPage;
