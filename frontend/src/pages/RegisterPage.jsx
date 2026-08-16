import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Page d'Inscription (Register).
 * Permet à un nouvel utilisateur de créer un compte et le redirige
 * automatiquement vers le tableau de bord en cas de succès.
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: ''
  });
  const [errors, setErrors] = useState([]); // Liste des erreurs à afficher
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Si l'utilisateur est déjà connecté, on le redirige directement
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

    // Validation côté client (avant d'appeler le serveur)
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
      // Afficher les erreurs renvoyées par le backend
      if (result.details && result.details.length > 0) {
        setErrors(result.details);
      } else {
        setErrors([result.message]);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-public-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl ring-1 ring-slate-200">

        {/* En-tête */}
        <div className="text-center">
          <img src="/logo.png" alt="Armoiries du Burkina Faso" className="mx-auto h-24 w-auto mb-6" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-public-blue">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            Créer un compte
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Rejoignez le tableau de bord DSI
          </p>
        </div>

        {/* Bloc d'erreurs */}
        {errors.length > 0 && (
          <div className="rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {errors.length === 1 ? 'Veuillez corriger l\'erreur suivante :' : 'Veuillez corriger les erreurs suivantes :'}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((err, i) => (
                    <li key={i} className="text-sm text-red-600">{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 rounded-md shadow-sm">

            {/* Champ Nom */}
            <div>
              <label htmlFor="nom" className="sr-only">Nom complet</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-public-blue sm:text-sm sm:leading-6"
                  placeholder="Nom complet (ex: Mohammed Alami)"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="sr-only">Adresse Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-public-blue sm:text-sm sm:leading-6"
                  placeholder="Adresse Email (ex: agent@sante.gov.ma)"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="motDePasse" className="sr-only">Mot de passe</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-public-blue sm:text-sm sm:leading-6"
                  placeholder="Mot de passe (min. 6 caractères)"
                  value={formData.motDePasse}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmMotDePasse" className="sr-only">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmMotDePasse"
                  name="confirmMotDePasse"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-public-blue sm:text-sm sm:leading-6"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmMotDePasse}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Règles du mot de passe */}
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium text-slate-600 mb-1">Règles :</p>
            <ul className="space-y-1">
              {[
                { label: 'Au moins 6 caractères', valid: formData.motDePasse.length >= 6 },
                { label: 'Les mots de passe correspondent', valid: formData.motDePasse && formData.motDePasse === formData.confirmMotDePasse },
              ].map(({ label, valid }) => (
                <li key={label} className={`flex items-center gap-1.5 text-xs ${valid ? 'text-green-600' : 'text-slate-400'}`}>
                  <CheckCircle className={`h-3.5 w-3.5 ${valid ? 'text-green-500' : 'text-slate-300'}`} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex w-full justify-center rounded-lg bg-public-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-public-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-blue transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Inscription en cours...
                </span>
              ) : (
                "S'inscrire"
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-slate-600">Vous avez déjà un compte ? </span>
            <Link to="/login" className="text-sm font-medium text-public-blue hover:text-public-dark">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
