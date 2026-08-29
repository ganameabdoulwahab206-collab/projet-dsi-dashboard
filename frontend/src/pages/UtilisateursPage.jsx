import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserCheck, UserX, Shield, Building2, Plus, Trash2, X, Lock, Mail, User } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  DIRECTEUR:    { label: 'Directeur',    cls: 'bg-private-blue text-white' },
  CHEF_SERVICE: { label: 'Chef Service', cls: 'bg-private-orange/20 text-private-orange' },
  AGENT:        { label: 'Agent',        cls: 'bg-slate-100 text-slate-600' },
};

const UtilisateursPage = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TOUS');
  const [savingId, setSavingId] = useState(null);

  // Modal Création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', email: '', motDePasse: '', role: 'AGENT', departementId: '' });

  // Modal Suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/utilisateurs'),
        api.get('/departements'),
      ]);
      setUtilisateurs(usersRes.data);
      setDepartements(deptsRes.data);
    } catch (error) {
      console.error('Erreur chargement', error);
      toast.error('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/utilisateurs', {
        ...newUser,
        departementId: newUser.departementId ? parseInt(newUser.departementId) : null,
      });
      setShowCreateModal(false);
      setNewUser({ nom: '', email: '', motDePasse: '', role: 'AGENT', departementId: '' });
      fetchData();
      toast.success('Utilisateur créé avec succès !');
    } catch (error) {
      const msg = error.response?.data?.message || "Erreur lors de la création de l'utilisateur.";
      toast.error(msg);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/utilisateurs/${deletingUser.id}`);
      setShowDeleteModal(false);
      setDeletingUser(null);
      fetchData();
      toast.success('Utilisateur supprimé.');
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const handleChangerDepartement = async (userId, departementId) => {
    setSavingId(userId);
    try {
      if (!departementId) return;
      await api.put(`/utilisateurs/${userId}/departement`, { departementId: parseInt(departementId) });
      setUtilisateurs(prev => prev.map(u => {
        if (u.id !== userId) return u;
        const dept = departements.find(d => d.id === parseInt(departementId));
        return { ...u, departement: dept || u.departement };
      }));
      toast.success('Département mis à jour.');
    } catch (error) {
      toast.error('Erreur lors du changement de département.');
    } finally {
      setSavingId(null);
    }
  };

  const handleChangerRole = async (userId, role) => {
    setSavingId(userId);
    try {
      await api.put(`/utilisateurs/${userId}/role`, { role });
      setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success('Rôle mis à jour.');
    } catch (error) {
      toast.error('Erreur lors du changement de rôle.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActif = async (userId) => {
    setSavingId(userId);
    try {
      const res = await api.put(`/utilisateurs/${userId}/actif`);
      setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, actif: res.data.actif } : u));
      toast.success(res.data.actif ? 'Compte activé.' : 'Compte désactivé.');
    } catch (error) {
      toast.error('Erreur lors du changement de statut du compte.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = utilisateurs.filter((u) => {
    const matchSearch =
      u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'TOUS' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalAgents = utilisateurs.filter(u => u.role === 'AGENT').length;
  const totalChefs = utilisateurs.filter(u => u.role === 'CHEF_SERVICE').length;
  const totalActifs = utilisateurs.filter(u => u.actif).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-blue-700">Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">Administration des comptes, rôles et affectations départementales.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* Cartes KPI rapides */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold font-montserrat text-slate-900">{utilisateurs.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Utilisateurs</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold font-montserrat text-green-600">{totalActifs}</p>
          <p className="text-xs text-slate-400 mt-1">Comptes Actifs</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold font-montserrat text-orange-500">{totalChefs}</p>
          <p className="text-xs text-slate-400 mt-1">Chefs de Service</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold font-montserrat text-blue-700">{totalAgents}</p>
          <p className="text-xs text-slate-400 mt-1">Agents / Techniciens</p>
        </div>
      </div>

      {/* Barre de recherche et filtre */}
      <div className="flex flex-col sm:flex-row gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou adresse email..."
            className="w-full rounded-lg border-0 py-2 pl-9 pr-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="DIRECTEUR">Directeurs</option>
            <option value="CHEF_SERVICE">Chefs de Service</option>
            <option value="AGENT">Agents</option>
          </select>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 italic">Aucun utilisateur trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rôle</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Département</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {filteredUsers.map((u) => {
                  const isSaving = savingId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                            {u.nom?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.nom}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          disabled={isSaving}
                          className="rounded-lg border-0 py-1.5 pl-2.5 pr-8 text-xs font-semibold ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                          value={u.role}
                          onChange={(e) => handleChangerRole(u.id, e.target.value)}
                        >
                          <option value="DIRECTEUR">Directeur</option>
                          <option value="CHEF_SERVICE">Chef Service</option>
                          <option value="AGENT">Agent</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          disabled={isSaving}
                          className="rounded-lg border-0 py-1.5 pl-2.5 pr-8 text-xs ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                          value={u.departement?.id || ''}
                          onChange={(e) => handleChangerDepartement(u.id, e.target.value)}
                        >
                          <option value="">— Aucun —</option>
                          {departements.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.nom}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          disabled={isSaving}
                          onClick={() => handleToggleActif(u.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                            u.actif
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {u.actif ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                          {u.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => {
                            setDeletingUser(u);
                            setShowDeleteModal(true);
                          }}
                          title="Supprimer l'utilisateur"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création Utilisateur */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-bold font-montserrat text-blue-700">Créer un Utilisateur</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom complet *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex : Driss Bennani"
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newUser.nom}
                  onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse e-mail *</label>
                <input
                  required
                  type="email"
                  placeholder="nom@sante.gov.ma"
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mot de passe temporaire *</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                  value={newUser.motDePasse}
                  onChange={(e) => setNewUser({ ...newUser, motDePasse: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle *</label>
                  <select
                    className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 bg-white"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="AGENT">Agent</option>
                    <option value="CHEF_SERVICE">Chef de Service</option>
                    <option value="DIRECTEUR">Directeur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Département</label>
                  <select
                    className="block w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 bg-white"
                    value={newUser.departementId}
                    onChange={(e) => setNewUser({ ...newUser, departementId: e.target.value })}
                  >
                    <option value="">— Aucun —</option>
                    {departements.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.nom}</option>
                    ))}
                  </select>
                </div>
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
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Supprimer cet utilisateur ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong>"{deletingUser.nom}"</strong> ({deletingUser.email}) ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingUser(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
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

export default UtilisateursPage;
