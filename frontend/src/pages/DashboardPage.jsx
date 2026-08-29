import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Users,
  Plus, ArrowRight, Clock, ShieldAlert, FileText, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const KpiCard = ({ title, value, icon: Icon, bgColor, iconColor, textColor, subtitle, alert }) => (
  <div className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${alert ? 'border-red-200 ring-1 ring-red-500/10' : 'border-slate-100'}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      <div className={`rounded-xl p-2.5 ${bgColor}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
    <div className="mt-4 flex items-baseline gap-2">
      <p className={`text-3xl font-bold font-montserrat ${textColor || 'text-slate-900'}`}>{value}</p>
    </div>
    {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentProjets, setRecentProjets] = useState([]);
  const [urgentTaches, setUrgentTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, projetsRes, tachesRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/projets'),
        api.get('/taches/mes-taches')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (projetsRes.status === 'fulfilled') setRecentProjets(projetsRes.value.data.slice(0, 5));
      if (tachesRes.status === 'fulfilled') {
        const urgentes = tachesRes.value.data
          .filter(t => t.statut !== 'TERMINEE')
          .sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
          .slice(0, 4);
        setUrgentTaches(urgentes);
      }
    } catch (err) {
      setError('Impossible de charger les statistiques du tableau de bord.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <AlertTriangle className="inline-block h-5 w-5 mr-2" />
        {error || 'Erreur lors du chargement.'}
      </div>
    );
  }

  const CHART_COLORS = {
    'En Attente': '#94a3b8',
    'En Cours':   '#535FDD',
    'Terminés':   '#78CC99',
    'Suspendus':  '#F2AA3E',
  };

  const pieData = [
    { name: 'En Attente', value: stats.projetsEnAttente || 0 },
    { name: 'En Cours',   value: stats.projetsEnCours || 0 },
    { name: 'Terminés',   value: stats.projetsTermines || 0 },
    { name: 'Suspendus',  value: stats.projetsSuspendus || 0 },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'À Faire',   Tâches: stats.tachesAFaire || 0,    fill: '#94a3b8' },
    { name: 'En Cours',  Tâches: stats.tachesEnCours || 0,   fill: '#535FDD' },
    { name: 'Terminées', Tâches: stats.tachesTerminees || 0, fill: '#78CC99' },
    { name: 'Bloquées',  Tâches: stats.tachesBloquees || 0,  fill: '#EF2B2B' },
  ];

  const isDirecteur = user?.role === 'DIRECTEUR';
  const canManageProjects = user?.role === 'DIRECTEUR' || user?.role === 'CHEF_SERVICE';

  return (
    <div className="space-y-8">
      {/* En-tête de Bienvenue */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-blue-700">
            {isDirecteur
              ? 'Tableau de bord — Vision Globale DSI'
              : `Tableau de bord — ${stats.departement || 'Mon Département'}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenue <strong>{user?.nom}</strong> · Synthèse ministérielle au{' '}
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isDirecteur && (
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10">
            <Users className="h-4 w-4" />
            Direction Générale DSI
          </div>
        )}
      </div>

      {/* Alerte critique de dépassement */}
      {stats.tachesCritiquesEnSouffrance > 0 && (
        <div className="flex items-start gap-3.5 rounded-2xl border-l-4 border-red-600 bg-red-50 p-4 shadow-xs ring-1 ring-red-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-sm">Alerte de charge critique</h3>
            <p className="text-xs text-red-700 mt-0.5">
              <strong>{stats.tachesCritiquesEnSouffrance} tâches critiques</strong> ont dépassé leur date limite sans être clôturées.
            </p>
          </div>
          <Link to="/taches" className="text-xs font-bold text-red-700 hover:underline">
            Voir les tâches →
          </Link>
        </div>
      )}

      {/* Raccourcis d'actions rapides (Quick Action Bar) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {canManageProjects && (
          <button
            onClick={() => navigate('/projets')}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Nouveau Projet</p>
              <p className="text-[11px] text-slate-400">Créer & planifier</p>
            </div>
          </button>
        )}

        <button
          onClick={() => navigate('/taches')}
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all text-left group"
        >
          <div className="rounded-xl bg-green-50 p-2.5 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Mon Plan</p>
            <p className="text-[11px] text-slate-400">Kanban des tâches</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/rapports')}
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all text-left group"
        >
          <div className="rounded-xl bg-orange-50 p-2.5 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Rapports</p>
            <p className="text-[11px] text-slate-400">Export & statistiques</p>
          </div>
        </button>

        {isDirecteur && (
          <button
            onClick={() => navigate('/utilisateurs')}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Équipe DSI</p>
              <p className="text-[11px] text-slate-400">Gérer les comptes</p>
            </div>
          </button>
        )}
      </div>

      {/* Cartes KPI Synthétiques Projets */}
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Projets"
            value={stats.totalProjets || 0}
            icon={FolderKanban}
            bgColor="bg-blue-50"
            iconColor="text-blue-700"
          />
          <KpiCard
            title="Projets en cours"
            value={stats.projetsEnCours || 0}
            icon={TrendingUp}
            bgColor="bg-orange-50"
            iconColor="text-orange-500"
            textColor="text-orange-600"
          />
          <KpiCard
            title="Avancement Moyen"
            value={`${Math.round(stats.tauxAvancementMoyen || 0)}%`}
            icon={CheckSquare}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            textColor="text-green-600"
            subtitle="Moyenne des projets actifs"
          />
          <KpiCard
            title="Projets en Retard"
            value={stats.projetsEnRetard || 0}
            icon={AlertTriangle}
            bgColor={stats.projetsEnRetard > 0 ? 'bg-red-50' : 'bg-slate-50'}
            iconColor={stats.projetsEnRetard > 0 ? 'text-red-600' : 'text-slate-400'}
            textColor={stats.projetsEnRetard > 0 ? 'text-red-600' : 'text-slate-900'}
            alert={stats.projetsEnRetard > 0}
          />
        </div>
      </div>

      {/* Cartes KPI Tâches */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'À Faire', val: stats.tachesAFaire || 0, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'En Cours', val: stats.tachesEnCours || 0, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Terminées', val: stats.tachesTerminees || 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Bloquées', val: stats.tachesBloquees || 0, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} className={`rounded-2xl p-4 ${bg} border border-slate-100 shadow-2xs`}>
            <p className={`text-2xl font-bold font-montserrat ${color}`}>{val}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Graphiques Analytiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Camembert Projets */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold font-montserrat text-slate-900">Répartition du Portefeuille</h2>
          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400 italic">Aucun projet enregistré</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CHART_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} Projet(s)`, 'Quantité']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Histogramme Tâches */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold font-montserrat text-slate-900">Progression des Tâches</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Tâches" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sections d'activités récentes et tâches prioritaires */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projets récents */}
        {canManageProjects && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold font-montserrat text-slate-900">Projets Récents</h2>
              <Link to="/projets" className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1">
                Tous les projets <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentProjets.length === 0 ? (
              <p className="text-xs italic text-slate-400 py-6 text-center">Aucun projet disponible.</p>
            ) : (
              <div className="space-y-3">
                {recentProjets.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projets/${p.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.titre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.departement?.nom || 'Non affecté'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">{p.avancement}%</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tâches Prioritaires Assignées */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold font-montserrat text-slate-900">Mes Tâches Prioritaires</h2>
            <Link to="/taches" className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1">
              Mon plan complet <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {urgentTaches.length === 0 ? (
            <p className="text-xs italic text-slate-400 py-6 text-center">Aucune tâche en cours.</p>
          ) : (
            <div className="space-y-3">
              {urgentTaches.map(t => {
                const isRetard = t.dateEcheance && new Date(t.dateEcheance) < new Date();
                return (
                  <div
                    key={t.id}
                    onClick={() => navigate('/taches')}
                    className="flex items-start justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100 gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{t.dateEcheance ? new Date(t.dateEcheance).toLocaleDateString('fr-FR') : 'Sans échéance'}</span>
                        {isRetard && <span className="text-red-600 font-bold">● Retard</span>}
                      </div>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      t.priorite >= 3 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {t.priorite >= 3 ? 'Prioritaire' : 'Standard'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
