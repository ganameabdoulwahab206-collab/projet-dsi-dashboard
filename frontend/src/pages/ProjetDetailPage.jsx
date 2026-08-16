import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckSquare, Plus, Clock, UserCircle, AlertTriangle, X, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TacheDetailModal from '../components/taches/TacheDetailModal';

const ProjetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projet, setProjet] = useState(null);
  const [taches, setTaches] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTache, setSelectedTache] = useState(null);
  const [showAddTache, setShowAddTache] = useState(false);
  const [newTache, setNewTache] = useState({ description: '', dateEcheance: '', priorite: 2 });

  useEffect(() => {
    fetchProjetDetails();
  }, [id]);

  // Quand on a le projet, on charge les agents du département
  useEffect(() => {
    if (canManage && projet) {
      // Utilise l'id du département du projet en priorité, sinon celui de l'utilisateur
      const deptId = projet.departement?.id || user?.departementId;
      if (deptId) fetchAgentsDepartement(deptId);
    }
  }, [projet]);

  const fetchProjetDetails = async () => {
    try {
      setLoading(true);
      const [projetRes, tachesRes] = await Promise.all([
        api.get(`/projets/${id}`),
        api.get(`/taches/projet/${id}`)
      ]);
      setProjet(projetRes.data);
      setTaches(tachesRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des détails du projet', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsDepartement = async (departementId) => {
    try {
      const response = await api.get(`/utilisateurs/departement/${departementId}`);
      setAgents(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des agents', error);
    }
  };

  const handleCreateTache = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/taches?projetId=${id}`, newTache);
      setShowAddTache(false);
      setNewTache({ description: '', dateEcheance: '', priorite: 2 });
      fetchProjetDetails();
    } catch (error) {
      console.error('Erreur lors de la création de la tâche', error);
      alert('Erreur lors de la création de la tâche');
    }
  };

  const handleAssignerTache = async (tacheId, utilisateurId) => {
    try {
      if (!utilisateurId || utilisateurId === '') {
        await api.put(`/taches/${tacheId}/desassigner`);
      } else {
        await api.put(`/taches/${tacheId}/assigner`, { utilisateurId: parseInt(utilisateurId) });
      }
      fetchProjetDetails();
    } catch (error) {
      console.error('Erreur lors de l\'assignation', error);
      alert('Erreur lors de l\'assignation de la tâche.');
    }
  };

  const handleStatusChange = async (tacheId, nouveauStatut) => {
    try {
      await api.put(`/taches/${tacheId}/statut`, { statut: nouveauStatut });
      fetchProjetDetails();
      if (selectedTache && selectedTache.id === tacheId) {
        setSelectedTache({ ...selectedTache, statut: nouveauStatut });
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut', error);
      alert('Erreur lors du changement de statut.');
    }
  };

  const getStatusBadge = (statut) => {
    const cfg = {
      'TERMINEE':  { label: 'Terminée', cls: 'bg-green-100 text-gov-green' },
      'EN_COURS':  { label: 'En Cours', cls: 'bg-blue-100 text-private-blue' },
      'A_FAIRE':   { label: 'À Faire',  cls: 'bg-slate-100 text-slate-600' },
      'BLOQUEE':   { label: 'Bloquée',  cls: 'bg-red-100 text-gov-red' },
    };
    const c = cfg[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-private-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!projet) {
    return <div className="text-center text-gov-red">Projet introuvable</div>;
  }

  const canManage = user?.role === 'DIRECTEUR' || user?.role === 'CHEF_SERVICE';
  const tachesTerminees = taches.filter(t => t.statut === 'TERMINEE').length;
  const tachesEnRetard = taches.filter(t => t.dateEcheance && new Date(t.dateEcheance) < new Date() && t.statut !== 'TERMINEE').length;

  return (
    <div className="space-y-6">
      {/* Navigation retour */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projets')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-private-blue">{projet.titre}</h1>
          <p className="text-sm text-slate-500">
            {projet.departement ? `Département : ${projet.departement.nom}` : 'Détails du projet'}
          </p>
        </div>
      </div>

      {/* Fiche Résumé du Projet */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="h-1.5 bg-private-blue" style={{ width: '100%' }}>
          <div className={`h-1.5 ${projet.avancement === 100 ? 'bg-gov-green' : projet.avancement > 50 ? 'bg-private-blue' : 'bg-private-orange'}`} style={{ width: `${projet.avancement}%` }} />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{projet.description || 'Aucune description.'}</p>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Calendrier</h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{projet.dateDebut ? new Date(projet.dateDebut).toLocaleDateString('fr-FR') : 'N/A'} → {projet.dateFin ? new Date(projet.dateFin).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Avancement</span>
                  <span className="font-bold text-private-blue">{projet.avancement}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full transition-all ${projet.avancement === 100 ? 'bg-gov-green' : 'bg-private-blue'}`}
                    style={{ width: `${projet.avancement}%` }}
                  />
                </div>
              </div>
              {/* KPIs Rapides */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center rounded-lg bg-slate-50 p-2">
                  <p className="text-lg font-bold text-slate-900">{taches.length}</p>
                  <p className="text-[10px] text-slate-500">Total</p>
                </div>
                <div className="text-center rounded-lg bg-green-50 p-2">
                  <p className="text-lg font-bold text-gov-green">{tachesTerminees}</p>
                  <p className="text-[10px] text-slate-500">Terminées</p>
                </div>
                <div className="text-center rounded-lg bg-red-50 p-2">
                  <p className="text-lg font-bold text-gov-red">{tachesEnRetard}</p>
                  <p className="text-[10px] text-slate-500">En retard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Tâches */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-private-orange" />
            <h2 className="text-base font-semibold font-montserrat text-slate-900">Tâches du projet</h2>
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {taches.length}
            </span>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddTache(!showAddTache)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-private-blue/10 px-3 py-1.5 text-sm font-semibold text-private-blue transition-colors hover:bg-private-blue/20"
            >
              <Plus className="h-4 w-4" />
              Ajouter une tâche
            </button>
          )}
        </div>

        {/* Formulaire d'ajout rapide */}
        {showAddTache && (
          <form onSubmit={handleCreateTache} className="border-b border-slate-100 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description de la tâche *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex : Installer le serveur..."
                  className="block w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
                  value={newTache.description}
                  onChange={e => setNewTache({...newTache, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date d'échéance</label>
                <input
                  type="date"
                  className="block w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
                  value={newTache.dateEcheance}
                  onChange={e => setNewTache({...newTache, dateEcheance: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
                  value={newTache.priorite}
                  onChange={e => setNewTache({...newTache, priorite: parseInt(e.target.value)})}
                >
                  <option value={1}>Basse</option>
                  <option value={2}>Moyenne</option>
                  <option value={3}>Haute</option>
                  <option value={4}>Critique</option>
                </select>
                <button type="submit" className="rounded-lg bg-private-blue px-4 py-2 text-sm font-semibold text-white hover:bg-private-dark">
                  +
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tableau des tâches */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Priorité</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Échéance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Assignation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {taches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400 italic">
                    Aucune tâche n'a été créée pour ce projet.
                  </td>
                </tr>
              ) : (
                taches.map((tache) => {
                  const isEnRetard = tache.dateEcheance && new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE';
                  const prioriteLabel = tache.priorite >= 4 ? 'Critique' : tache.priorite === 3 ? 'Haute' : tache.priorite === 2 ? 'Moyenne' : 'Basse';
                  const prioriteCls = tache.priorite >= 3 ? 'bg-red-50 text-gov-red' : tache.priorite === 2 ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-50 text-slate-600';
                  return (
                    <tr
                      key={tache.id}
                      className="transition-colors hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedTache(tache)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{tache.description}</span>
                          {isEnRetard && <AlertTriangle className="h-4 w-4 text-gov-red flex-shrink-0" title="En retard" />}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${prioriteCls}`}>{prioriteLabel}</span>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(tache.statut)}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1 text-sm ${isEnRetard ? 'text-gov-red font-semibold' : 'text-slate-500'}`}>
                          <Clock className="h-4 w-4" />
                          {tache.dateEcheance ? new Date(tache.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        {canManage && agents.length > 0 ? (
                          <select
                            className="rounded-lg border-0 py-1.5 pl-3 pr-8 text-xs font-medium ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue bg-white"
                            value={tache.utilisateur?.id || ''}
                            onChange={(e) => handleAssignerTache(tache.id, e.target.value)}
                          >
                            <option value="">— Non assignée —</option>
                            {agents.map(agent => (
                              <option key={agent.id} value={agent.id}>{agent.nom}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <UserCircle className="h-4 w-4 text-slate-400" />
                            {tache.utilisateur ? tache.utilisateur.nom : <span className="italic text-slate-400">Non assignée</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

export default ProjetDetailPage;
