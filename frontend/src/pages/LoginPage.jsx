import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Page de Connexion (Login) avec le logo officiel du Burkina Faso
 * et sélecteur rapide de comptes de test.
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login({ email, motDePasse: password });

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Email ou mot de passe incorrect.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (testEmail, testPwd) => {
    setEmail(testEmail);
    setPassword(testPwd);
    setError(null);
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
            Connectez-vous à votre espace de travail
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center space-x-2.5 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-600 ring-1 ring-red-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire de Connexion */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adresse Email</label>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                name="password"
                type="password"
                required
                className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 transition-all disabled:opacity-60"
          >
            {isLoading ? 'Connexion en cours...' : (
              <>
                <span>Se Connecter</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Bloc d'aide pour les tests manuels par rôle */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold font-montserrat text-blue-900">
            <KeyRound className="h-4 w-4 text-blue-700" />
            Comptes de Test (cliquez pour pré-remplir) :
          </div>

          <div className="space-y-2 text-xs">
            {/* Directeur */}
            <button
              type="button"
              onClick={() => handleQuickFill('directeur@sante.gov.ma', 'Directeur123!')}
              className="w-full flex items-center justify-between rounded-xl bg-white p-2.5 text-left shadow-2xs hover:bg-blue-100/60 transition-colors border border-blue-100"
            >
              <div>
                <p className="font-bold text-purple-700">👑 DIRECTEUR</p>
                <p className="text-[11px] text-slate-500">directeur@sante.gov.ma</p>
              </div>
              <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-semibold">
                Directeur123!
              </span>
            </button>

            {/* Chef de Service */}
            <button
              type="button"
              onClick={() => handleQuickFill('chef.sersi@sante.gov.ma', 'Chef123!')}
              className="w-full flex items-center justify-between rounded-xl bg-white p-2.5 text-left shadow-2xs hover:bg-blue-100/60 transition-colors border border-blue-100"
            >
              <div>
                <p className="font-bold text-blue-700">👔 CHEF DE SERVICE (SERSI)</p>
                <p className="text-[11px] text-slate-500">chef.sersi@sante.gov.ma</p>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                Chef123!
              </span>
            </button>

            {/* Agent */}
            <button
              type="button"
              onClick={() => handleQuickFill('agent.sersi@sante.gov.ma', 'Agent123!')}
              className="w-full flex items-center justify-between rounded-xl bg-white p-2.5 text-left shadow-2xs hover:bg-blue-100/60 transition-colors border border-blue-100"
            >
              <div>
                <p className="font-bold text-slate-700">🛠️ AGENT / TECHNICIEN</p>
                <p className="text-[11px] text-slate-500">agent.sersi@sante.gov.ma</p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                Agent123!
              </span>
            </button>
          </div>
        </div>

        {/* Lien vers Inscription */}
        <div className="text-center pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Vous n'avez pas encore de compte ? </span>
          <Link to="/register" className="text-xs font-semibold text-blue-700 hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
