import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, User, CheckCircle, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Page d'Inscription (Register) avec le logo officiel du Burkina Faso
 * et un design 100% harmonisé avec la page de connexion.
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: ''
  });
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const clientErrors = [];
    if (!formData.nom.trim()) {
      clientErrors.push('Le nom complet est obligatoire.');
    }
    if (!formData.email.trim()) {
      clientErrors.push("L'adresse email est obligatoire.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      clientErrors.push("L'adresse email n'est pas valide.");
    }
    if (!formData.motDePasse) {
      clientErrors.push('Le mot de passe est obligatoire.');
    } else if (formData.motDePasse.length < 6) {
      clientErrors.push('Le mot de passe doit contenir au moins 6 caractères.');
    }
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      clientErrors.push('Les mots de passe ne correspondent pas.');
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsLoading(true);

    const result = await register({
      nom: formData.nom,
      email: formData.email,
      motDePasse: formData.motDePasse
    });

    if (result.success) {
      navigate('/dashboard');
    } else {
      if (result.details && result.details.length > 0) {
        setErrors(result.details);
      } else {
        setErrors([result.message]);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/70 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-xl ring-1 ring-slate-200/80">

        {/* En-tête avec Logo Officiel du Burkina Faso */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="Armoiries du Burkina Faso"
              className="h-24 sm:h-28 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
          </div>
          <h1 className="text-2xl font-extrabold font-montserrat text-blue-700">
            DSI Dashboard
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ministère de la Santé · Burkina Faso
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Créer un nouveau compte d'accès
          </p>
        </div>

        {/* Bloc d'erreurs */}
        {errors.length > 0 && (
          <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200 animate-in fade-in">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-800 mb-1">
                  {errors.length === 1 ? 'Veuillez corriger cette erreur :' : 'Veuillez corriger les erreurs suivantes :'}
                </p>
                <ul className="list-disc list-inside space-y-0.5">
                  {errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-600">{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire d'Inscription */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Champ Nom */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom complet *</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                name="nom"
                type="text"
                required
                className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition"
                placeholder="Ex : Moussa Ouédraogo"
                value={formData.nom}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Champ Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adresse Email *</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                name="email"
                type="email"
                required
                className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition"
                placeholder="nom@sante.gov.bf"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe *</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                name="motDePasse"
                type="password"
                required
                className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition"
                placeholder="Min. 6 caractères"
                value={formData.motDePasse}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Champ Confirmation mot de passe */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirmer le mot de passe *</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                name="confirmMotDePasse"
                type="password"
                required
                className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition"
                placeholder="Confirmer le mot de passe"
                value={formData.confirmMotDePasse}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Règles de validation en direct */}
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[11px] font-semibold text-slate-600 mb-1">Critères du compte :</p>
            <div className="space-y-1">
              {[
                { label: 'Au moins 6 caractères', valid: formData.motDePasse.length >= 6 },
                { label: 'Les mots de passe correspondent', valid: Boolean(formData.motDePasse && formData.motDePasse === formData.confirmMotDePasse) },
              ].map(({ label, valid }) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs ${valid ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                  <CheckCircle className={`h-3.5 w-3.5 ${valid ? 'text-green-500' : 'text-slate-300'}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 transition-all disabled:opacity-60"
          >
            {isLoading ? 'Inscription en cours...' : (
              <>
                <span>Créer mon compte</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">Vous avez déjà un compte ? </span>
            <Link to="/login" className="text-xs font-semibold text-blue-700 hover:underline">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
