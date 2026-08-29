import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Filter, X, Calendar, Edit2, Trash2, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUTS = [
  { value: 'EN_ATTENTE', label: 'En Attente' },
  { value: 'EN_COURS',   label: 'En Cours' },
  { value: 'TERMINE',    label: 'Terminé' },
  { value: 'SUSPENDU',   label: 'Suspendu' },
  { value: 'ANNULE',     label: 'Annulé' },
];

// Composant modale réutilisable pour les formulaires de projet (au niveau module pour préserver le focus)
const ProjetForm = ({ values, setValues, onSubmit, onCancel, title, submitLabel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold font-montserrat text-blue-700">{title}</h2>
        <button onClick={onCancel} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 p-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Titre <span className="text-red-500">*</span></label>
          <input
            required type="text"
            className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            placeholder="Ex : Migration vers le Cloud"
            value={values.titre}
            onChange={e => setValues({ ...values, titre: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea rows={3}
            className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 resize-none"
            placeholder="Décrivez les objectifs du projet..."
            value={values.description || ''}
            onChange={e => setValues({ ...values, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Date de début</label>
            <input type="date"
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
              value={values.dateDebut || ''}
              onChange={e => setValues({ ...values, dateDebut: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Date de fin <span className="text-red-500">*</span></label>
            <input required type="date"
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
              value={values.dateFin || ''}
              onChange={e => setValues({ ...values, dateFin: e.target.value })}
            />
          </div>
        </div>
        {/* Statut uniquement en mode édition */}
        {values.statut !== undefined && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Statut</label>
            <select
              className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
              value={values.statut}
              onChange={e => setValues({ ...values, statut: e.target.value })}
            >
              {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Annuler
          </button>
          <button type="submit"
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ProjetsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');

  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjet, setNewProjet] = useState({ titre: '', description: '', dateDebut: '', dateFin: '' });

  // Modal modification
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState(null);

  // Modal confirmation suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProjet, setDeletingProjet] = useState(null);

  useEffect(() => {
    fetchProjets();
  }, []);

  const fetchProjets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projets');
      setProjets(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets', error);
      toast.error('Erreur lors du chargement des projets.');
    } finally {
      setLoading(false);
    }
  };

  // --- Création ---
  const handleCreateProjet = async (e) => {
    e.preventDefault();
    try {
      const departementId = user?.departement?.id || 1;
      await api.post(`/projets?departementId=${departementId}`, newProjet);
      setShowCreateModal(false);
      setNewProjet({ titre: '', description: '', dateDebut: '', dateFin: '' });
      fetchProjets();
      toast.success('Projet créé avec succès !');
    } catch (error) {
      console.error('Erreur création projet', error);
      toast.error('Erreur lors de la création du projet.');
    }
  };

  // --- Modification ---
  const openEditModal = (e, projet) => {
    e.stopPropagation();
    setEditingProjet({
      ...projet,
      dateDebut: projet.dateDebut ? projet.dateDebut.substring(0, 10) : '',
      dateFin:   projet.dateFin   ? projet.dateFin.substring(0, 10)   : '',
    });
    setShowEditModal(true);
  };

  const handleUpdateProjet = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projets/${editingProjet.id}`, editingProjet);
      setShowEditModal(false);
      setEditingProjet(null);
      fetchProjets();
      toast.success('Projet mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur modification projet', error);
      toast.error('Erreur lors de la mise à jour du projet.');
    }
  };

  // --- Suppression ---
  const openDeleteModal = (e, projet) => {
    e.stopPropagation();
    setDeletingProjet(projet);
    setShowDeleteModal(true);
  };

  const handleDeleteProjet = async () => {
    try {
      await api.delete(`/projets/${deletingProjet.id}`);
      setShowDeleteModal(false);
      setDeletingProjet(null);
      fetchProjets();
      toast.success('Projet supprimé.');
    } catch (error) {
      console.error('Erreur suppression projet', error);
      toast.error('Erreur lors de la suppression du projet.');
    }
  };

  // --- Changement de statut rapide ---
  const handleChangerStatut = async (e, projetId, nouveauStatut) => {
    e.stopPropagation();
    try {
      await api.put(`/projets/${projetId}`, { statut: nouveauStatut });
      setProjets(prev => prev.map(p => p.id === projetId ? { ...p, statut: nouveauStatut } : p));
      toast.success('Statut du projet mis à jour.');
    } catch (error) {
      toast.error('Erreur lors du changement de statut.');
    }
  };

  const getStatusConfig = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return { label: 'En Attente', cls: 'bg-slate-100 text-slate-700' };
      case 'EN_COURS':   return { label: 'En Cours',   cls: 'bg-blue-100 text-blue-700' };
      case 'TERMINE':    return { label: 'Terminé',    cls: 'bg-green-100 text-green-700' };
      case 'SUSPENDU':   return { label: 'Suspendu',   cls: 'bg-orange-100 text-orange-700' };
      case 'ANNULE':     return { label: 'Annulé',     cls: 'bg-red-100 text-red-700' };
      default:           return { label: statut,       cls: 'bg-gray-100 text-gray-700' };
    }
  };

  const getProgressColor = (avancement, statut) => {
    if (statut === 'TERMINE') return 'bg-green-500';
    if (avancement < 25) return 'bg-red-500';
    if (avancement < 75) return 'bg-orange-400';
    return 'bg-blue-600';
  };

  const filteredProjets = projets.filter((projet) => {
    const matchSearch = projet.titre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'TOUS' || projet.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCreateProject = user?.role === 'DIRECTEUR' || user?.role === 'CHEF_SERVICE';
  const canDelete = user?.role === 'DIRECTEUR';

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-blue-700">Projets DSI</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'CHEF_SERVICE' ? `Projets de votre département` : 'Portefeuille global des projets du ministère'}
          </p>
        </div>
        {canCreateProject && (
          <button onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 sm:mt-0">
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </button>
        )}
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input type="text" placeholder="Rechercher un projet..."
            className="w-full rounded-lg border-0 py-2 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <select
            className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="TOUS">Tous les statuts</option>
            {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-500">{filteredProjets.length} projet(s) trouvé(s)</p>

      {/* Grille des projets */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : filteredProjets.length === 0 ? (
        <div className="rounded-xl bg-white p-16 text-center shadow-sm ring-1 ring-slate-100">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun projet</h3>
          <p className="mt-1 text-sm text-slate-500">Aucun projet ne correspond à vos critères.</p>
          {canCreateProject && (
            <button onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              <Plus className="h-4 w-4" /> Créer le premier projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjets.map((projet) => {
            const statusConf = getStatusConfig(projet.statut);
            return (
              <div key={projet.id} onClick={() => navigate(`/projets/${projet.id}`)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-blue-300">
                {/* Bande de couleur */}
                <div className={`h-1.5 w-full ${getProgressColor(projet.avancement, projet.statut)}`} />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 flex-1">
                      {projet.titre}
                    </h3>
                    {/* Actions (éditer / supprimer) */}
                    {canCreateProject && (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={(e) => openEditModal(e, projet)}
                          title="Modifier"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button onClick={(e) => openDeleteModal(e, projet)}
                            title="Supprimer"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Statut modifiable */}
                  <div className="mt-2" onClick={e => e.stopPropagation()}>
                    <select
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border-0 cursor-pointer ${statusConf.cls}`}
                      value={projet.statut}
                      onChange={(e) => handleChangerStatut(e, projet.id, e.target.value)}
                    >
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <p className="mt-2 flex-1 text-sm text-slate-500 line-clamp-2">
                    {projet.description || 'Aucune description fournie.'}
                  </p>

                  {/* Avancement */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>Avancement</span>
                      <span className="font-bold text-slate-700">{projet.avancement}%</span>
                    </div>
                    <div className="w-full h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full transition-all ${getProgressColor(projet.avancement, projet.statut)}`}
                        style={{ width: `${projet.avancement}%` }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Échéance : <strong>{projet.dateFin ? new Date(projet.dateFin).toLocaleDateString('fr-FR') : 'Non définie'}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <ProjetForm
          values={newProjet}
          setValues={setNewProjet}
          onSubmit={handleCreateProjet}
          onCancel={() => { setShowCreateModal(false); setNewProjet({ titre: '', description: '', dateDebut: '', dateFin: '' }); }}
          title="Créer un nouveau projet"
          submitLabel="Créer le projet"
        />
      )}

      {/* Modal Modification */}
      {showEditModal && editingProjet && (
        <ProjetForm
          values={editingProjet}
          setValues={setEditingProjet}
          onSubmit={handleUpdateProjet}
          onCancel={() => { setShowEditModal(false); setEditingProjet(null); }}
          title="Modifier le projet"
          submitLabel="Enregistrer les modifications"
        />
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && deletingProjet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Confirmer la suppression</h2>
            <p className="mt-2 text-sm text-slate-600">
              Vous êtes sur le point de supprimer le projet <strong>"{deletingProjet.titre}"</strong> ainsi que toutes ses tâches associées. Cette action est <span className="text-red-600 font-semibold">irréversible</span>.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeletingProjet(null); }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={handleDeleteProjet}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjetsPage;
