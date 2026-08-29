import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, X, Users, FolderKanban, Info } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DepartementsPage = () => {
  const { user } = useAuth();
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDept, setNewDept] = useState({ nom: '', description: '' });

  // Modal Édition
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Modal Suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  useEffect(() => {
    fetchDepartements();
  }, []);

  const fetchDepartements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departements');
      setDepartements(response.data);
    } catch (error) {
      console.error('Erreur chargement départements', error);
      toast.error('Erreur lors du chargement des départements.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDept.nom.trim()) return toast.error('Le nom du département est obligatoire.');
    try {
      await api.post('/departements', newDept);
      setShowCreateModal(false);
      setNewDept({ nom: '', description: '' });
      fetchDepartements();
      toast.success('Département créé avec succès !');
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors de la création du département.';
      toast.error(msg);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDept.nom.trim()) return toast.error('Le nom est obligatoire.');
    try {
      await api.put(`/departements/${editingDept.id}`, editingDept);
      setShowEditModal(false);
      setEditingDept(null);
      fetchDepartements();
      toast.success('Département mis à jour.');
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors de la modification.';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/departements/${deletingDept.id}`);
      setShowDeleteModal(false);
      setDeletingDept(null);
      fetchDepartements();
      toast.success('Département supprimé.');
    } catch (error) {
      toast.error('Impossible de supprimer ce département (il contient des utilisateurs ou des projets).');
    }
  };

  const isDirecteur = user?.role === 'DIRECTEUR';

  const filteredDepts = departements.filter(d =>
    d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-blue-700">Gestion des Départements</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organisez les divisions et services techniques de la DSI du Ministère de la Santé.
          </p>
        </div>
        {isDirecteur && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nouveau Département
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un département par nom ou mission..."
            className="w-full rounded-lg border-0 py-2 pl-9 pr-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grille des Départements */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center shadow-sm ring-1 ring-slate-100">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun département</h3>
          <p className="mt-1 text-sm text-slate-500">Aucun département ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-montserrat text-slate-900">{dept.nom}</h3>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Code #{dept.id}
                      </span>
                    </div>
                  </div>

                  {isDirecteur && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingDept(dept);
                          setShowEditModal(true);
                        }}
                        title="Modifier"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingDept(dept);
                          setShowDeleteModal(true);
                        }}
                        title="Supprimer"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-sm text-slate-600 leading-relaxed min-h-[48px]">
                  {dept.description || <span className="italic text-slate-400">Aucune description disponible.</span>}
                </p>
              </div>

              {/* Métriques bas de carte */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>{dept.utilisateurs ? dept.utilisateurs.length : '0'} agent(s)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FolderKanban className="h-4 w-4 text-slate-400" />
                  <span>{dept.projets ? dept.projets.length : '0'} projet(s)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-bold font-montserrat text-blue-700">Nouveau Département</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nom du département <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex : SERSI, SEISAI, SPCP..."
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newDept.nom}
                  onChange={(e) => setNewDept({ ...newDept, nom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description / Missions</label>
                <textarea
                  rows={3}
                  placeholder="Rôle, missions et compétences du service..."
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 resize-none"
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Créer le département
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {showEditModal && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-bold font-montserrat text-blue-700">Modifier le Département</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDept(null);
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nom du département <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={editingDept.nom}
                  onChange={(e) => setEditingDept({ ...editingDept, nom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description / Missions</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 resize-none"
                  value={editingDept.description || ''}
                  onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDept(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Supprimer le département ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer le département <strong>"{deletingDept.nom}"</strong> ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingDept(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartementsPage;
