import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserCheck, UserX, Shield, Building2, RefreshCw } from 'lucide-react';
import api from '../api/axios';

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
    } finally {
      setLoading(false);
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
    } catch (error) {
      alert('Erreur lors du changement de département.');
    } finally {
      setSavingId(null);
    }
  };

  const handleChangerRole = async (userId, role) => {
    setSavingId(userId);
    try {
      await api.put(`/utilisateurs/${userId}/role`, { role });
      setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (error) {
      alert('Erreur lors du changement de rôle.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActif = async (userId) => {
    setSavingId(userId);
    try {
      const updated = await api.put(`/utilisateurs/${userId}/actif`);
      setUtilisateurs(prev => prev.map(u => u.id === userId ? { ...u, actif: updated.data.actif } : u));
    } catch (error) {
      alert('Erreur lors du changement de statut.');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = utilisateurs.filter(u => {
    const matchSearch = u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'TOUS' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-private-blue">Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">Affectez les agents à leurs départements et gérez leurs accès.</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* KPI rapide */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Directeurs',     count: utilisateurs.filter(u => u.role === 'DIRECTEUR').length,    color: 'text-private-blue',   bg: 'bg-private-blue/10' },
          { label: 'Chefs Service',  count: utilisateurs.filter(u => u.role === 'CHEF_SERVICE').length, color: 'text-private-orange', bg: 'bg-private-orange/10' },
          { label: 'Agents',         count: utilisateurs.filter(u => u.role === 'AGENT').length,        color: 'text-slate-600',      bg: 'bg-slate-100' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg} text-center ring-1 ring-slate-100`}>
            <p className={`text-3xl font-bold font-montserrat ${color}`}>{count}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Barre filtres */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            className="w-full rounded-lg border-0 py-2 pl-9 pr-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="DIRECTEUR">Directeurs</option>
            <option value="CHEF_SERVICE">Chefs de Service</option>
            <option value="AGENT">Agents</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-private-blue border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Département</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-400 italic">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => {
                    const isSaving = savingId === u.id;
                    const roleCfg = ROLE_CONFIG[u.role] || ROLE_CONFIG['AGENT'];
                    return (
                      <tr key={u.id} className={`transition-colors hover:bg-slate-50 ${!u.actif ? 'opacity-50' : ''}`}>

                        {/* Utilisateur */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-private-blue/10 font-bold text-sm text-private-blue">
                              {u.nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{u.nom}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="px-4 py-4">
                          <select
                            disabled={isSaving}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 focus:ring-2 focus:ring-private-blue cursor-pointer ${roleCfg.cls}`}
                            value={u.role}
                            onChange={e => handleChangerRole(u.id, e.target.value)}
                          >
                            <option value="AGENT">Agent</option>
                            <option value="CHEF_SERVICE">Chef Service</option>
                            <option value="DIRECTEUR">Directeur</option>
                          </select>
                        </td>

                        {/* Département */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <select
                              disabled={isSaving}
                              className="rounded-lg border-0 py-1 pl-2 pr-7 text-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-private-blue bg-white"
                              value={u.departement?.id || ''}
                              onChange={e => handleChangerDepartement(u.id, e.target.value)}
                            >
                              <option value="">— Non affecté —</option>
                              {departements.map(d => (
                                <option key={d.id} value={d.id}>{d.nom}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Toggle Actif */}
                        <td className="px-4 py-4 text-center">
                          <button
                            disabled={isSaving}
                            onClick={() => handleToggleActif(u.id)}
                            title={u.actif ? 'Désactiver le compte' : 'Activer le compte'}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                              u.actif
                                ? 'bg-gov-green/10 text-gov-green hover:bg-gov-green/20'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            } ${isSaving ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
                          >
                            {u.actif
                              ? <><UserCheck className="h-3.5 w-3.5" /> Actif</>
                              : <><UserX className="h-3.5 w-3.5" /> Inactif</>
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
          <p className="text-xs text-slate-400">{filtered.length} utilisateur(s) affiché(s) sur {utilisateurs.length} total</p>
        </div>
      </div>
    </div>
  );
};

export default UtilisateursPage;
