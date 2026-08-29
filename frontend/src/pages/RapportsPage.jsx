import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../api/axios';
import {
  FolderKanban, CheckSquare, AlertTriangle, TrendingUp,
  Printer, Download, Filter, BarChart3, PieChart as PieIcon, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#535FDD', '#78CC99', '#F2AA3E', '#EF2B2B', '#94A3B8'];

const RapportsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, projetsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/projets')
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (projetsRes.status === 'fulfilled') setProjets(projetsRes.value.data);
    } catch (error) {
      console.error('Erreur chargement rapports', error);
      toast.error('Erreur lors du chargement des données de rapport.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Préparation des données de graphiques
  const pieProjetData = [
    { name: 'En Attente', value: stats?.projetsEnAttente || 0, color: '#94a3b8' },
    { name: 'En Cours',   value: stats?.projetsEnCours || 0,   color: '#535FDD' },
    { name: 'Terminés',   value: stats?.projetsTermines || 0,  color: '#78CC99' },
    { name: 'Suspendus',  value: stats?.projetsSuspendus || 0, color: '#F2AA3E' },
  ].filter(d => d.value > 0);

  const barTacheData = [
    { name: 'À Faire',   Total: stats?.tachesAFaire || 0,    fill: '#94a3b8' },
    { name: 'En Cours',  Total: stats?.tachesEnCours || 0,   fill: '#535FDD' },
    { name: 'Terminées', Total: stats?.tachesTerminees || 0, fill: '#78CC99' },
    { name: 'Bloquées',  Total: stats?.tachesBloquees || 0,  fill: '#EF2B2B' },
  ];

  const totalTaches = (stats?.tachesAFaire || 0) +
                      (stats?.tachesEnCours || 0) +
                      (stats?.tachesTerminees || 0) +
                      (stats?.tachesBloquees || 0);

  const tauxReussite = totalTaches > 0 ? Math.round(((stats?.tachesTerminees || 0) / totalTaches) * 100) : 0;

  return (
    <div className="space-y-6 print:p-0">
      {/* En-tête avec bouton d'impression */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-montserrat text-blue-700">Rapports & Indicateurs Clés</h1>
          <p className="text-sm text-slate-500 mt-1">
            Synthèse analytique des projets et de la performance opérationnelle de la DSI.
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            Imprimer / Exporter PDF
          </button>
        </div>
      </div>

      {/* Cartes KPI Synthétiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Portefeuille</span>
            <div className="rounded-full bg-blue-50 p-2 text-blue-700">
              <FolderKanban className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-montserrat text-slate-900">{stats?.totalProjets || 0}</p>
          <p className="mt-1 text-xs text-slate-400">Projets enregistrés</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avancement Moyen</span>
            <div className="rounded-full bg-green-50 p-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-montserrat text-green-600">
            {Math.round(stats?.tauxAvancementMoyen || 0)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">Moyenne des projets actifs</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taux Résolution Tâches</span>
            <div className="rounded-full bg-purple-50 p-2 text-purple-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold font-montserrat text-purple-700">{tauxReussite}%</p>
          <p className="mt-1 text-xs text-slate-400">{stats?.tachesTerminees || 0} sur {totalTaches} tâches terminées</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projets à Risque</span>
            <div className={`rounded-full p-2 ${stats?.projetsEnRetard > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className={`mt-3 text-3xl font-bold font-montserrat ${stats?.projetsEnRetard > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {stats?.projetsEnRetard || 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">Date d'échéance dépassée</p>
        </div>
      </div>

      {/* Graphiques Analytiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribution des Projets */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold font-montserrat text-slate-900">Statuts des Projets</h2>
              <p className="text-xs text-slate-400">Répartition par phase du cycle de vie</p>
            </div>
            <PieIcon className="h-5 w-5 text-slate-400" />
          </div>

          {pieProjetData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm italic text-slate-400">
              Aucune donnée à afficher
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieProjetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieProjetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val) => [`${val} projet(s)`, 'Nombre']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Charge et Statuts des Tâches */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold font-montserrat text-slate-900">Répartition des Tâches</h2>
              <p className="text-xs text-slate-400">Volume de travail selon l'état d'exécution</p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barTacheData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Total" radius={[6, 6, 0, 0]}>
                  {barTacheData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tableau détaillé des projets du portefeuille */}
      {projets.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold font-montserrat text-slate-900">Tableau de Bord des Projets</h2>
            <p className="text-xs text-slate-400">Vue synthétique de l'avancement individuel</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Projet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Département</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Avancement</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Échéance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {projets.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{p.titre}</td>
                    <td className="px-4 py-4 text-slate-500">{p.departement?.nom || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.statut === 'TERMINE' ? 'bg-green-100 text-green-700' :
                        p.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-700' :
                        p.statut === 'SUSPENDU' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.avancement === 100 ? 'bg-green-500' : p.avancement > 50 ? 'bg-blue-600' : 'bg-orange-400'}`}
                            style={{ width: `${p.avancement}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-slate-700">{p.avancement}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {p.dateFin ? new Date(p.dateFin).toLocaleDateString('fr-FR') : 'Non définie'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RapportsPage;
