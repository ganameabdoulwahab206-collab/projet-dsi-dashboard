import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, CheckSquare, Plus, Clock,
  UserCircle, AlertTriangle, X, Edit2, Trash2, Save
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TacheDetailModal from '../components/taches/TacheDetailModal';
import toast from 'react-hot-toast';

const STATUTS_PROJET = [
  { value: 'EN_ATTENTE', label: 'En Attente' },
  { value: 'EN_COURS',   label: 'En Cours' },
  { value: 'TERMINE',    label: 'Terminé' },
  { value: 'SUSPENDU',   label: 'Suspendu' },
  { value: 'ANNULE',     label: 'Annulé' },
];

const ProjetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projet, setProjet] = useState(null);
  const [taches, setTaches] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTache, setSelectedTache] = useState(null);

  // Ajout tâche
  const [showAddTache, setShowAddTache] = useState(false);
  const [newTache, setNewTache] = useState({ description: '', dateEcheance: '', priorite: 2 });

  // Modification tâche
  const [editingTache, setEditingTache] = useState(null);

  // Confirmation suppression tâche
  const [deletingTache, setDeletingTache] = useState(null);

  useEffect(() => {
    fetchProjetDetails();
  }, [id]);

  useEffect(() => {
    if (projet) {
      const deptId = projet.departement?.id || user?.departementId;
      if (deptId) fetchAgentsDepartement(deptId);
    }
  }, [projet]);

  const canManage = user?.role === 'DIRECTEUR' || user?.role === 'CHEF_SERVICE';

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
      toast.error('Erreur lors du chargement du projet.');
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

  // --- Statut projet ---
  const handleChangerStatutProjet = async (nouveauStatut) => {
    try {
      const updated = await api.put(`/projets/${id}`, { ...projet, statut: nouveauStatut });
      setProjet(updated.data);
      toast.success('Statut du projet mis à jour.');
    } catch (error) {
      toast.error('Erreur lors du changement de statut du projet.');
    }
  };

  // --- Création tâche ---
  const handleCreateTache = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/taches?projetId=${id}`, newTache);
      setShowAddTache(false);
      setNewTache({ description: '', dateEcheance: '', priorite: 2 });
      fetchProjetDetails();
      toast.success('Tâche ajoutée au projet.');
    } catch (error) {
      console.error('Erreur lors de la création de la tâche', error);
      toast.error('Erreur lors de la création de la tâche.');
    }
  };

  // --- Modification tâche ---
  const handleUpdateTache = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/taches/${editingTache.id}/statut`, { statut: editingTache.statut });
      // Mise à jour description / priorité / échéance via PUT tache (si endpoint disponible)
      fetchProjetDetails();
      setEditingTache(null);
      toast.success('Tâche mise à jour.');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la tâche.');
    }
  };

  // --- Suppression tâche ---
  const handleDeleteTache = async () => {
    try {
      await api.delete(`/taches/${deletingTache.id}`);
      setDeletingTache(null);
      fetchProjetDetails();
      toast.success('Tâche supprimée.');
    } catch (error) {
      toast.error('Erreur lors de la suppression de la tâche.');
    }
  };

  // --- Assignation tâche ---
  const handleAssignerTache = async (tacheId, utilisateurId) => {
    try {
      if (!utilisateurId || utilisateurId === '') {
        await api.put(`/taches/${tacheId}/desassigner`);
      } else {
        await api.put(`/taches/${tacheId}/assigner`, { utilisateurId: parseInt(utilisateurId) });
      }
      fetchProjetDetails();
      toast.success('Assignation mise à jour.');
    } catch (error) {
      toast.error("Erreur lors de l'assignation de la tâche.");
    }
  };

  // --- Statut tâche ---
  const handleStatusChange = async (tacheId, nouveauStatut) => {
    try {
      await api.put(`/taches/${tacheId}/statut`, { statut: nouveauStatut });
      fetchProjetDetails();
      if (selectedTache && selectedTache.id === tacheId) {
        setSelectedTache({ ...selectedTache, statut: nouveauStatut });
      }
      toast.success('Statut mis à jour.');
    } catch (error) {
      toast.error('Erreur lors du changement de statut.');
    }
  };

  const getStatusBadge = (statut) => {
    const cfg = {
      'TERMINEE': { label: 'Terminée', cls: 'bg-green-100 text-green-700' },
      'EN_COURS': { label: 'En Cours', cls: 'bg-blue-100 text-blue-700' },
      'A_FAIRE':  { label: 'À Faire',  cls: 'bg-slate-100 text-slate-600' },
      'BLOQUEE':  { label: 'Bloquée',  cls: 'bg-red-100 text-red-600' },
    };
    const c = cfg[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.cls}`}>{c.label}</span>;
  };

  const getStatutProjetConfig = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'bg-slate-100 text-slate-700';
      case 'EN_COURS':   return 'bg-blue-100 text-blue-700';
      case 'TERMINE':    return 'bg-green-100 text-green-700';
      case 'SUSPENDU':   return 'bg-orange-100 text-orange-700';
      case 'ANNULE':     return 'bg-red-100 text-red-600';
      default:           return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!projet) {
    return <div className="text-center text-red-600">Projet introuvable</div>;
  }

  const tachesTerminees = taches.filter(t => t.statut === 'TERMINEE').length;
  const tachesEnRetard = taches.filter(t => t.dateEcheance && new Date(t.dateEcheance) < new Date() && t.statut !== 'TERMINEE').length;

  return (
    <div className="space-y-6">
      {/* Navigation retour */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projets')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-montserrat text-blue-700">{projet.titre}</h1>
            <p className="text-sm text-slate-500">
              {projet.departement ? `Département : ${projet.departement.nom}` : 'Détails du projet'}
            </p>
          </div>
          {/* Statut du projet (modifiable) */}
          {canManage ? (
            <select
              className={`rounded-full px-4 py-1.5 text-sm font-semibold border-0 cursor-pointer ${getStatutProjetConfig(projet.statut)}`}
              value={projet.statut}
              onChange={(e) => handleChangerStatutProjet(e.target.value)}
            >
              {STATUTS_PROJET.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          ) : (
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${getStatutProjetConfig(projet.statut)}`}>
              {STATUTS_PROJET.find(s => s.value === projet.statut)?.label || projet.statut}
            </span>
          )}
        </div>
      </div>

      {/* Fiche Résumé */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="h-1.5 bg-slate-100">
          <div className={`h-1.5 ${projet.avancement === 100 ? 'bg-green-500' : projet.avancement > 50 ? 'bg-blue-600' : 'bg-orange-400'}`}
            style={{ width: `${projet.avancement}%` }} />
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
                  <span>
                    {projet.dateDebut ? new Date(projet.dateDebut).toLocaleDateString('fr-FR') : 'N/A'}
                    {' → '}
                    {projet.dateFin ? new Date(projet.dateFin).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Avancement</span>
                  <span className="font-bold text-blue-700">{projet.avancement}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full transition-all ${projet.avancement === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${projet.avancement}%` }} />
                </div>
              </div>
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center rounded-lg bg-slate-50 p-2">
                  <p className="text-lg font-bold text-slate-900">{taches.length}</p>
                  <p className="text-[10px] text-slate-500">Total</p>
                </div>
                <div className="text-center rounded-lg bg-green-50 p-2">
                  <p className="text-lg font-bold text-green-600">{tachesTerminees}</p>
                  <p className="text-[10px] text-slate-500">Terminées</p>
                </div>
                <div className="text-center rounded-lg bg-red-50 p-2">
                  <p className="text-lg font-bold text-red-600">{tachesEnRetard}</p>
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
            <CheckSquare className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold font-montserrat text-slate-900">Tâches du projet</h2>
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{taches.length}</span>
          </div>
          {canManage && (
            <button onClick={() => setShowAddTache(!showAddTache)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description *</label>
                <input required type="text" placeholder="Ex : Installer le serveur..."
                  className="block w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newTache.description}
                  onChange={e => setNewTache({ ...newTache, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Échéance</label>
                <input type="date"
                  className="block w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newTache.dateEcheance}
                  onChange={e => setNewTache({ ...newTache, dateEcheance: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newTache.priorite}
                  onChange={e => setNewTache({ ...newTache, priorite: parseInt(e.target.value) })}>
                  <option value={1}>Basse</option>
                  <option value={2}>Moyenne</option>
                  <option value={3}>Haute</option>
                  <option value={4}>Critique</option>
                </select>
                <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">+</button>
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
                {canManage && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {taches.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-6 py-10 text-center text-sm text-slate-400 italic">
                    Aucune tâche n'a été créée pour ce projet.
                  </td>
                </tr>
              ) : (
                taches.map((tache) => {
                  const isEnRetard = tache.dateEcheance && new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE';
                  const prioriteLabel = tache.priorite >= 4 ? 'Critique' : tache.priorite === 3 ? 'Haute' : tache.priorite === 2 ? 'Moyenne' : 'Basse';
                  const prioriteCls = tache.priorite >= 3 ? 'bg-red-50 text-red-600' : tache.priorite === 2 ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-50 text-slate-600';

                  return (
                    <tr key={tache.id} className="transition-colors hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedTache(tache)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{tache.description}</span>
                          {isEnRetard && <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" title="En retard" />}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${prioriteCls}`}>{prioriteLabel}</span>
                      </td>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        {canManage ? (
                          <select
                            className="rounded-md border-0 py-1 pl-2 pr-6 text-xs ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white"
                            value={tache.statut}
                            onChange={(e) => handleStatusChange(tache.id, e.target.value)}>
                            <option value="A_FAIRE">À Faire</option>
                            <option value="EN_COURS">En Cours</option>
                            <option value="TERMINEE">Terminée</option>
                            <option value="BLOQUEE">Bloquée</option>
                          </select>
                        ) : getStatusBadge(tache.statut)}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-1 text-sm ${isEnRetard ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          <Clock className="h-4 w-4" />
                          {tache.dateEcheance ? new Date(tache.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        {canManage && agents.length > 0 ? (
                          <select
                            className="rounded-lg border-0 py-1.5 pl-3 pr-8 text-xs font-medium ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                            value={tache.utilisateur?.id || ''}
                            onChange={(e) => handleAssignerTache(tache.id, e.target.value)}>
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
                      {canManage && (
                        <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDeletingTache(tache)}
                              title="Supprimer la tâche"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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

      {/* Modal Confirmation Suppression Tâche */}
      {deletingTache && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Supprimer la tâche ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Vous êtes sur le point de supprimer la tâche : <strong>"{deletingTache.description}"</strong>. Cette action est irréversible.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeletingTache(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleDeleteTache}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjetDetailPage;
