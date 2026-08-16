import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, MoreVertical, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TacheDetailModal from '../components/taches/TacheDetailModal';

/**
 * Composant : Page de Gestion des Tâches (Mon Espace)
 * Affiche les tâches de l'utilisateur connecté sous forme de liste/kanban simplifié.
 * Permet de modifier rapidement le statut.
 */
const TachesPage = () => {
  const { user } = useAuth();
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTache, setSelectedTache] = useState(null);

  useEffect(() => {
    fetchMesTaches();
  }, []);

  const fetchMesTaches = async () => {
    try {
      setLoading(true);
      // L'API sait qui on est grâce au token JWT
      const response = await api.get('/taches/mes-taches');
      setTaches(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Appelle l'API pour changer le statut d'une tâche.
   * C'est cette action qui déclenche le recalcul de l'avancement du projet côté Spring Boot.
   */
  const handleStatusChange = async (tacheId, nouveauStatut) => {
    try {
      await api.put(`/taches/${tacheId}/statut`, { statut: nouveauStatut });
      // Mise à jour optimiste du state local
      setTaches(taches.map(t => 
        t.id === tacheId ? { ...t, statut: nouveauStatut } : t
      ));
      
      // Mettre à jour aussi la modale si elle est ouverte
      if (selectedTache && selectedTache.id === tacheId) {
        setSelectedTache({ ...selectedTache, statut: nouveauStatut });
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut', error);
      alert('Erreur lors de la modification du statut. Veuillez réessayer.');
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  }

  // Filtrage par statuts pour faire des sections pseudo-Kanban
  const tachesAFaire = taches.filter(t => t.statut === 'A_FAIRE' || t.statut === 'EN_ATTENTE');
  const tachesEnCours = taches.filter(t => t.statut === 'EN_COURS');
  const tachesTerminees = taches.filter(t => t.statut === 'TERMINEE');

  // Rendu générique d'une liste de tâches
  const renderTacheList = (titre, listeTaches, borderColor) => (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className={`mb-4 flex items-center text-sm font-bold uppercase tracking-wider font-montserrat ${borderColor}`}>
        <span className="mr-2 h-2 w-2 rounded-full bg-current"></span>
        {titre} ({listeTaches.length})
      </h3>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {listeTaches.length === 0 ? (
          <p className="text-center text-sm italic text-slate-400">Aucune tâche</p>
        ) : (
          listeTaches.map(tache => (
            <div 
              key={tache.id} 
              onClick={() => setSelectedTache(tache)}
              className="group relative cursor-pointer rounded-lg border border-slate-200 bg-private-light p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              
              {/* Priorité */}
              <div className="mb-2 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  tache.priorite >= 3 ? 'bg-red-50 text-red-700 ring-red-600/10' :
                  tache.priorite === 2 ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                  'bg-blue-50 text-blue-700 ring-blue-700/10'
                }`}>
                  {tache.priorite >= 3 ? 'Priorité Haute' : tache.priorite === 2 ? 'Priorité Moyenne' : 'Priorité Basse'}
                </span>
                
                {/* Sélecteur de statut rapide */}
                <select 
                  className="block rounded-md border-0 py-1 pl-2 pr-7 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-private-blue"
                  value={tache.statut}
                  onClick={(e) => e.stopPropagation()} // Évite d'ouvrir la modale au clic
                  onChange={(e) => handleStatusChange(tache.id, e.target.value)}
                >
                  <option value="A_FAIRE">À Faire</option>
                  <option value="EN_COURS">En Cours</option>
                  <option value="TERMINEE">Terminée</option>
                  <option value="BLOQUEE">Bloquée</option>
                </select>
              </div>

              {/* Description */}
              <p className="text-sm font-medium text-slate-900">{tache.description}</p>
              
              {/* Échéance */}
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <Clock className="mr-1.5 h-4 w-4 text-slate-400" />
                Échéance : <strong className="ml-1">{tache.dateEcheance ? new Date(tache.dateEcheance).toLocaleDateString('fr-FR') : 'Non définie'}</strong>
                
                {/* Alerte si en retard */}
                {tache.dateEcheance && new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE' && (
                  <span className="ml-2 flex items-center text-red-600">
                    <AlertTriangle className="mr-1 h-3 w-3" /> En retard
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-private-blue">Mon Plan de Travail</h1>
          <p className="text-sm text-slate-500">Gérez vos tâches assignées et mettez à jour leur statut.</p>
        </div>
      </div>

      {/* Grille pseudo-Kanban (3 colonnes sur grand écran) */}
      <div className="grid h-[calc(100vh-140px)] grid-cols-1 gap-6 md:grid-cols-3">
        {renderTacheList("À Faire", tachesAFaire, "text-slate-500")}
        {renderTacheList("En Cours", tachesEnCours, "text-private-orange")}
        {renderTacheList("Terminées", tachesTerminees, "text-gov-green")}
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
