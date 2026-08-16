import React, { useState, useEffect } from 'react';
import { FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const KpiCard = ({ title, value, icon: Icon, bgColor, iconColor, textColor, subtitle, alert }) => (
  <div className={`flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${alert ? 'border-gov-red ring-1 ring-gov-red/20' : 'border-slate-100'}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className={`rounded-full p-2 ${bgColor}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </div>
    <div className="mt-4 flex items-baseline gap-2">
      <p className={`text-4xl font-bold font-montserrat ${textColor || 'text-slate-900'}`}>{value}</p>
    </div>
    {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        setError('Impossible de charger les statistiques.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-private-blue border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gov-red/20 bg-red-50 p-4 text-gov-red">
        <AlertTriangle className="inline-block h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  // Données pour les graphiques (couleurs de la charte)
  const CHART_COLORS = {
    'En Attente': '#94a3b8',
    'En Cours':   '#535FDD', // private-blue
    'Terminés':   '#78CC99', // gov-green
    'Suspendus':  '#F2AA3E', // private-orange
  };

  const pieData = [
    { name: 'En Attente', value: stats.projetsEnAttente },
    { name: 'En Cours',   value: stats.projetsEnCours },
    { name: 'Terminés',   value: stats.projetsTermines },
    { name: 'Suspendus',  value: stats.projetsSuspendus },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'À Faire',   Tâches: stats.tachesAFaire,    fill: '#94a3b8' },
    { name: 'En Cours',  Tâches: stats.tachesEnCours,   fill: '#535FDD' },
    { name: 'Terminées', Tâches: stats.tachesTerminees, fill: '#78CC99' },
    { name: 'Bloquées',  Tâches: stats.tachesBloquees,  fill: '#EF2B2B' },
  ];

  const isDirecteur = user?.role === 'DIRECTEUR';

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-private-blue">
            {isDirecteur
              ? 'Tableau de bord — Vision Globale DSI'
              : `Tableau de bord — ${stats.departement || 'Mon Département'}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenue <strong>{user?.nom}</strong> · Synthèse au {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isDirecteur && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-private-blue/10 px-4 py-2 text-sm font-semibold text-private-blue">
            <Users className="h-4 w-4" />
            Directeur Général
          </div>
        )}
      </div>

      {/* Alerte critique */}
      {stats.tachesCritiquesEnSouffrance > 0 && (
        <div className="flex items-start gap-3 rounded-xl border-l-4 border-gov-red bg-red-50 p-4 shadow-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-gov-red mt-0.5" />
          <div>
            <h3 className="font-bold text-gov-red">Attention requise</h3>
            <p className="text-sm text-red-700 mt-0.5">
              <strong>{stats.tachesCritiquesEnSouffrance} tâches critiques</strong> ont dépassé leur date limite sans être terminées. Veuillez vérifier le plan de charge.
            </p>
          </div>
        </div>
      )}

      {/* KPIs Projets */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Projets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Projets"
            value={stats.totalProjets}
            icon={FolderKanban}
            bgColor="bg-private-blue/10"
            iconColor="text-private-blue"
          />
          <KpiCard
            title="Projets en cours"
            value={stats.projetsEnCours}
            icon={TrendingUp}
            bgColor="bg-private-orange/10"
            iconColor="text-private-orange"
            textColor="text-private-orange"
          />
          <KpiCard
            title="Avancement Moyen"
            value={`${Math.round(stats.tauxAvancementMoyen)}%`}
            icon={CheckSquare}
            bgColor="bg-gov-green/10"
            iconColor="text-gov-green"
            textColor="text-gov-green"
            subtitle="Des projets en cours"
          />
          <KpiCard
            title="Projets en Retard"
            value={stats.projetsEnRetard}
            icon={AlertTriangle}
            bgColor={stats.projetsEnRetard > 0 ? 'bg-gov-red/10' : 'bg-slate-100'}
            iconColor={stats.projetsEnRetard > 0 ? 'text-gov-red' : 'text-slate-400'}
            textColor={stats.projetsEnRetard > 0 ? 'text-gov-red' : 'text-slate-900'}
            alert={stats.projetsEnRetard > 0}
          />
        </div>
      </div>

      {/* KPIs Tâches */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Tâches</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'À Faire', val: stats.tachesAFaire, color: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'En Cours', val: stats.tachesEnCours, color: 'text-private-blue', bg: 'bg-private-blue/5' },
            { label: 'Terminées', val: stats.tachesTerminees, color: 'text-gov-green', bg: 'bg-gov-green/5' },
            { label: 'Bloquées', val: stats.tachesBloquees, color: 'text-gov-red', bg: 'bg-gov-red/5' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className={`rounded-xl p-4 ${bg} ring-1 ring-slate-100`}>
              <p className={`text-2xl font-bold font-montserrat ${color}`}>{val}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Camembert Projets */}
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold font-montserrat text-slate-800">Répartition des Projets</h2>
          {pieData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400 italic">Aucun projet à afficher</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
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
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold font-montserrat text-slate-800">État d'avancement des Tâches</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
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

    </div>
  );
};

export default DashboardPage;
