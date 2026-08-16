import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Page de Connexion (Login).
 * Gère l'authentification de l'utilisateur et le redirige vers le tableau de bord
 * en cas de succès.
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Si l'utilisateur est déjà connecté, on le redirige directement
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Appel à la fonction de login du AuthContext
    const result = await login({ email, motDePasse: password });

    if (result.success) {
      navigate('/dashboard'); // Redirection vers l'espace protégé
    } else {
      setError(result.message);
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
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            DSI Dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Connectez-vous à votre espace personnel
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
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
                  placeholder="Adresse Email (ex: directeur@sante.gov.ma)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="sr-only">Mot de passe</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-public-blue sm:text-sm sm:leading-6"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
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
                  Connexion en cours...
                </span>
              ) : (
                'Se Connecter'
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <span className="text-sm text-slate-600">Vous n'avez pas de compte ? </span>
            <Link to="/register" className="text-sm font-medium text-public-blue hover:text-public-dark">
              S'inscrire
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
