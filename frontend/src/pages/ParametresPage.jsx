import React, { useState } from 'react';
import { User, Lock, Shield, Building2, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ParametresPage = () => {
  const { user, login, logout } = useAuth();

  // Onglet actif
  const [activeTab, setActiveTab] = useState('profil');

  // État formulaire profil
  const [nom, setNom] = useState(user?.nom || '');
  const [savingProfil, setSavingProfil] = useState(false);

  // État formulaire mot de passe
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [savingMdp, setSavingMdp] = useState(false);

  const handleUpdateProfil = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return toast.error('Le nom ne peut pas être vide.');
    setSavingProfil(true);
    try {
      const response = await api.put('/utilisateurs/me/profil', { nom });
      // Mettre à jour le localStorage avec le nouveau nom
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.nom = response.data.nom;
      localStorage.setItem('user', JSON.stringify(stored));
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfil(false);
    }
  };

  const handleChangerMotDePasse = async (e) => {
    e.preventDefault();
    if (nouveauMotDePasse.length < 6) {
      return toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }
    if (nouveauMotDePasse !== confirmMotDePasse) {
      return toast.error('Les mots de passe ne correspondent pas.');
    }
    setSavingMdp(true);
    try {
      await api.put('/utilisateurs/me/mot-de-passe', {
        ancienMotDePasse,
        nouveauMotDePasse,
      });
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmMotDePasse('');
      toast.success('Mot de passe changé avec succès ! Veuillez vous reconnecter.');
      setTimeout(() => logout(), 2000);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Mot de passe actuel incorrect.');
      } else {
        toast.error('Erreur lors du changement de mot de passe.');
      }
    } finally {
      setSavingMdp(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'DIRECTEUR':   return { label: 'Directeur',         cls: 'bg-purple-100 text-purple-700' };
      case 'CHEF_SERVICE': return { label: 'Chef de Service',  cls: 'bg-blue-100 text-blue-700' };
      case 'AGENT':        return { label: 'Agent / Technicien', cls: 'bg-slate-100 text-slate-600' };
      default:             return { label: role, cls: 'bg-gray-100 text-gray-600' };
    }
  };

  const roleConf = getRoleLabel(user?.role);

  const tabs = [
    { id: 'profil',   label: 'Profil',           icon: User },
    { id: 'securite', label: 'Sécurité',          icon: Lock },
  ];

  const passwordStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { level: 1, label: 'Trop court',  cls: 'bg-red-500' };
    if (pwd.length < 10) return { level: 2, label: 'Acceptable', cls: 'bg-orange-400' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { level: 3, label: 'Fort', cls: 'bg-green-500' };
    return { level: 2, label: 'Moyen', cls: 'bg-yellow-400' };
  };
  const strength = passwordStrength(nouveauMotDePasse);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold font-montserrat text-blue-700">Paramètres du compte</h1>
        <p className="mt-1 text-sm text-slate-500">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Carte Profil résumé */}
      <div className="flex items-center gap-5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl font-bold font-montserrat text-white ring-2 ring-white/40">
          {user?.nom?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-xl font-bold">{user?.nom}</p>
          <p className="text-sm text-blue-200">{user?.email}</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${roleConf.cls}`}>
            {roleConf.label}
          </span>
        </div>
        <div className="ml-auto text-right text-sm text-blue-200 hidden md:block">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {user?.departement?.nom || 'Aucun département'}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu onglet Profil */}
      {activeTab === 'profil' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-5">
            <User className="h-5 w-5 text-blue-700" />
            Informations personnelles
          </h2>
          <form onSubmit={handleUpdateProfil} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom complet</label>
              <input type="text"
                className="block w-full rounded-xl border-0 py-3 px-4 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse e-mail</label>
              <input type="email" disabled
                className="block w-full rounded-xl border-0 py-3 px-4 text-sm bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200 cursor-not-allowed"
                value={user?.email || ''}
              />
              <p className="mt-1 text-xs text-slate-400">L'adresse e-mail ne peut pas être modifiée.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rôle</label>
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-slate-200 ${roleConf.cls}`}>
                  <Shield className="h-4 w-4" />
                  {roleConf.label}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Département</label>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {user?.departement?.nom || 'Non assigné'}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingProfil}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors">
                {savingProfil ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contenu onglet Sécurité */}
      {activeTab === 'securite' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-5">
              <Lock className="h-5 w-5 text-blue-700" />
              Changer le mot de passe
            </h2>
            <form onSubmit={handleChangerMotDePasse} className="space-y-5">
              {/* Ancien MDP */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe actuel</label>
                <div className="relative">
                  <input type={showAncien ? 'text' : 'password'}
                    className="block w-full rounded-xl border-0 py-3 px-4 pr-12 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                    value={ancienMotDePasse}
                    onChange={e => setAncienMotDePasse(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowAncien(!showAncien)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showAncien ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Nouveau MDP */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showNouveau ? 'text' : 'password'}
                    className="block w-full rounded-xl border-0 py-3 px-4 pr-12 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
                    value={nouveauMotDePasse}
                    onChange={e => setNouveauMotDePasse(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowNouveau(!showNouveau)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNouveau ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Indicateur de force */}
                {strength && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(l => (
                        <div key={l} className={`h-1.5 flex-1 rounded-full transition-all ${l <= strength.level ? strength.cls : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <input type="password"
                    className={`block w-full rounded-xl border-0 py-3 px-4 pr-10 text-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 ${
                      confirmMotDePasse && confirmMotDePasse !== nouveauMotDePasse
                        ? 'ring-red-400 text-red-700'
                        : 'ring-slate-300'
                    }`}
                    value={confirmMotDePasse}
                    onChange={e => setConfirmMotDePasse(e.target.value)}
                    placeholder="••••••••"
                  />
                  {confirmMotDePasse && confirmMotDePasse === nouveauMotDePasse && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                ⚠️ Après le changement de mot de passe, vous serez automatiquement déconnecté et devrez vous reconnecter.
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingMdp || !ancienMotDePasse || !nouveauMotDePasse || !confirmMotDePasse}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors">
                  {savingMdp ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Changer le mot de passe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametresPage;
