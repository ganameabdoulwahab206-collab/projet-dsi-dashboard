import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderKanban, Filter, X, Calendar, Tag } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ProjetsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');
  const [showModal, setShowModal] = useState(false);
  const [newProjet, setNewProjet] = useState({
    titre: '',
    description: '',
    dateDebut: '',
    dateFin: '',
  });

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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProjet = async (e) => {
    e.preventDefault();
    try {
      const departementId = user?.departement?.id || 1;
      await api.post(`/projets?departementId=${departementId}`, newProjet);
      setShowModal(false);
      setNewProjet({ titre: '', description: '', dateDebut: '', dateFin: '' });
      fetchProjets();
    } catch (error) {
      console.error('Erreur création projet', error);
      alert('Erreur lors de la création du projet');
    }
  };

  const getStatusConfig = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return { label: 'En Attente', cls: 'bg-slate-100 text-slate-700' };
      case 'EN_COURS':   return { label: 'En Cours',   cls: 'bg-blue-100 text-private-blue' };
      case 'TERMINE':    return { label: 'Terminé',    cls: 'bg-green-100 text-gov-green' };
      case 'SUSPENDU':   return { label: 'Suspendu',   cls: 'bg-orange-100 text-private-orange' };
      case 'ANNULE':     return { label: 'Annulé',     cls: 'bg-red-100 text-gov-red' };
      default:           return { label: statut,       cls: 'bg-gray-100 text-gray-700' };
    }
  };

  const getProgressColor = (avancement, statut) => {
    if (statut === 'TERMINE') return 'bg-gov-green';
    if (avancement < 25) return 'bg-gov-red';
    if (avancement < 75) return 'bg-private-orange';
    return 'bg-private-blue';
  };

  const filteredProjets = projets.filter((projet) => {
    const matchSearch = projet.titre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'TOUS' || projet.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const canCreateProject = user?.role === 'DIRECTEUR' || user?.role === 'CHEF_SERVICE';

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-private-blue">Projets DSI</h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'CHEF_SERVICE' ? `Projets de votre département` : 'Portefeuille global des projets du ministère'}
          </p>
        </div>
        {canCreateProject && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-private-blue px-4 py-2.5 text-sm font-semibold font-montserrat text-white shadow-sm transition-all hover:bg-private-dark sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            Nouveau Projet
          </button>
        )}
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            className="w-full rounded-lg border-0 py-2 pl-10 pr-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <select
            className="rounded-lg border-0 py-2 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_ATTENTE">En Attente</option>
            <option value="EN_COURS">En Cours</option>
            <option value="TERMINE">Terminés</option>
            <option value="SUSPENDU">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Compteur */}
      <p className="text-sm text-slate-500">{filteredProjets.length} projet(s) trouvé(s)</p>

      {/* Grille des projets */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-private-blue border-t-transparent"></div>
        </div>
      ) : filteredProjets.length === 0 ? (
        <div className="rounded-xl bg-white p-16 text-center shadow-sm ring-1 ring-slate-100">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">Aucun projet</h3>
          <p className="mt-1 text-sm text-slate-500">Aucun projet ne correspond à vos critères.</p>
          {canCreateProject && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-private-blue px-4 py-2 text-sm font-semibold text-white hover:bg-private-dark"
            >
              <Plus className="h-4 w-4" /> Créer le premier projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjets.map((projet) => {
            const statusConf = getStatusConfig(projet.statut);
            return (
              <div
                key={projet.id}
                onClick={() => navigate(`/projets/${projet.id}`)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-private-blue/30"
              >
                {/* Bande de couleur supérieure */}
                <div className={`h-1.5 w-full ${getProgressColor(projet.avancement, projet.statut)}`} />
                
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-900 group-hover:text-private-blue transition-colors line-clamp-2">
                      {projet.titre}
                    </h3>
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConf.cls}`}>
                      {statusConf.label}
                    </span>
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
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(projet.avancement, projet.statut)}`}
                        style={{ width: `${projet.avancement}%` }}
                      />
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

      {/* Modale Nouveau Projet */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold font-montserrat text-private-blue">Créer un nouveau projet</h2>
              <button onClick={() => setShowModal(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProjet} className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Titre <span className="text-gov-red">*</span></label>
                <input
                  required
                  type="text"
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
                  placeholder="Ex : Migration vers le Cloud"
                  value={newProjet.titre}
                  onChange={e => setNewProjet({...newProjet, titre: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue resize-none"
                  placeholder="Décrivez les objectifs et le périmètre du projet..."
                  value={newProjet.description}
                  onChange={e => setNewProjet({...newProjet, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
                    value={newProjet.dateDebut}
                    onChange={e => setNewProjet({...newProjet, dateDebut: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date de fin <span className="text-gov-red">*</span></label>
                  <input
                    type="date"
                    className="block w-full rounded-lg border-0 py-2.5 px-3 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-private-blue"
                    value={newProjet.dateFin}
                    onChange={e => setNewProjet({...newProjet, dateFin: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-private-blue px-5 py-2 text-sm font-semibold font-montserrat text-white hover:bg-private-dark"
                >
                  Créer le projet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjetsPage;
