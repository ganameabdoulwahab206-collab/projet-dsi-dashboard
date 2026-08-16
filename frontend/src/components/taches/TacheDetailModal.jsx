import React, { useState, useEffect } from 'react';
import { X, Send, Clock, User, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const TacheDetailModal = ({ tache, onClose, onStatusChange }) => {
  const { user } = useAuth();
  const [commentaires, setCommentaires] = useState([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tache) {
      fetchCommentaires();
    }
  }, [tache]);

  const fetchCommentaires = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/taches/${tache.id}/commentaires`);
      setCommentaires(response.data);
    } catch (error) {
      console.error('Erreur chargement commentaires', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAjouterCommentaire = async (e) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim()) return;
    
    try {
      const response = await api.post(`/taches/${tache.id}/commentaires`, {
        contenu: nouveauCommentaire
      });
      setCommentaires([...commentaires, response.data]);
      setNouveauCommentaire('');
    } catch (error) {
      console.error('Erreur ajout commentaire', error);
      alert('Erreur lors de l\'ajout du commentaire.');
    }
  };

  if (!tache) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        
        {/* Header Modale */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Détails de la Tâche
            </h2>
            <p className="text-sm font-medium text-private-orange">
              {tache.projet ? `Projet: ${tache.projet.titre}` : 'Projet inconnu'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps Modale */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Infos de base */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  tache.priorite >= 3 ? 'bg-red-50 text-red-700 ring-red-600/10' :
                  tache.priorite === 2 ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                  'bg-blue-50 text-blue-700 ring-blue-700/10'
                }`}>
                  {tache.priorite >= 3 ? 'Priorité Haute' : tache.priorite === 2 ? 'Priorité Moyenne' : 'Priorité Basse'}
                </span>
                
                <select 
                  className="block rounded-md border-0 py-1.5 pl-3 pr-8 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-private-blue"
                  value={tache.statut}
                  onChange={(e) => onStatusChange(tache.id, e.target.value)}
                >
                  <option value="A_FAIRE">À Faire</option>
                  <option value="EN_COURS">En Cours</option>
                  <option value="TERMINEE">Terminée</option>
                  <option value="BLOQUEE">Bloquée</option>
                </select>
              </div>

              <p className="text-sm text-slate-800 whitespace-pre-wrap">{tache.description}</p>
              
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <Clock className="mr-1.5 h-4 w-4 text-slate-400" />
                Échéance : <strong className="ml-1">{tache.dateEcheance ? new Date(tache.dateEcheance).toLocaleDateString('fr-FR') : 'Non définie'}</strong>
                
                {tache.dateEcheance && new Date(tache.dateEcheance) < new Date() && tache.statut !== 'TERMINEE' && (
                  <span className="ml-3 flex items-center text-gov-red font-semibold">
                    <AlertTriangle className="mr-1 h-4 w-4" /> En retard
                  </span>
                )}
              </div>
            </div>

            {/* Section Commentaires */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                Commentaires
              </h3>
              
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-private-blue border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {commentaires.length === 0 ? (
                    <p className="text-center text-sm italic text-slate-400">Aucun commentaire pour l'instant.</p>
                  ) : (
                    commentaires.map(comment => (
                      <div key={comment.id} className={`flex ${comment.auteur.id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                          comment.auteur.id === user.id 
                            ? 'bg-private-blue text-white' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          <div className="mb-1 flex items-center justify-between text-[10px] opacity-70">
                            <span className="font-semibold">{comment.auteur.nom}</span>
                            <span className="ml-3">{new Date(comment.dateCreation).toLocaleString('fr-FR')}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.contenu}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer (Ajout Commentaire) */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={handleAjouterCommentaire} className="flex gap-2">
            <input
              type="text"
              value={nouveauCommentaire}
              onChange={(e) => setNouveauCommentaire(e.target.value)}
              placeholder="Écrivez un commentaire..."
              className="flex-1 rounded-lg border-0 bg-slate-50 py-2.5 pl-4 pr-4 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-private-blue"
            />
            <button
              type="submit"
              disabled={!nouveauCommentaire.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-private-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default TacheDetailModal;
