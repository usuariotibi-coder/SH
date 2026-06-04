import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { FileText, AlertTriangle, GraduationCap, Siren, ShieldCheck, Bell, HardHat, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { KPICard } from '../../components/ui/Card';
import Card from '../../components/ui/Card';
import AlertsPanel from '../../components/shared/AlertsPanel';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';

const PIE_COLORS = { PENDING: '#fbbf24', IN_PROGRESS: '#60a5fa', COMPLETED: '#34d399', OVERDUE: '#f87171', NOT_APPLICABLE: '#94a3b8' };
const PIE_LABELS = { PENDING: 'Pendiente', IN_PROGRESS: 'En proceso', COMPLETED: 'Cumplido', OVERDUE: 'Vencido', NOT_APPLICABLE: 'No aplica' };

export default function DashboardPage() {
  const { t } = useTranslation();
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [kRes, cRes, aRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/charts'),
          api.get('/dashboard/alerts'),
        ]);
        setKpis(kRes.data);
        setCharts(cRes.data);
        setAlerts(aRes.data);
      } catch {
        toast.error('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)]">Cargando dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display text-[var(--color-text)]">{t('dashboard.title')}</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard
          title="Cumplimiento normativo"
          value={`${kpis?.complianceRate || 0}%`}
          subtitle={`${kpis?.completedRequirements} de ${kpis?.totalRequirements} requerimientos`}
          icon={ShieldCheck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          borderColor={kpis?.complianceRate >= 80 ? 'border-l-green-500' : kpis?.complianceRate >= 50 ? 'border-l-yellow-500' : 'border-l-red-500'}
        />
        <KPICard
          title="Incidentes este mes"
          value={kpis?.incidentsMonth || 0}
          subtitle={`${kpis?.incidentsYear || 0} en el año`}
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          borderColor="border-l-red-500"
        />
        <KPICard
          title="Capacitaciones año"
          value={kpis?.trainingsYear || 0}
          subtitle="Registradas este año"
          icon={GraduationCap}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          borderColor="border-l-blue-500"
        />
        <KPICard
          title="Simulacros realizados"
          value={`${kpis?.drillsCompleted || 0}/${kpis?.drillsYear || 0}`}
          subtitle={`${kpis?.drillsRate || 0}% de cumplimiento`}
          icon={Siren}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          borderColor={kpis?.drillsRate >= 100 ? 'border-l-green-500' : 'border-l-yellow-500'}
        />
        <KPICard
          title="Días perdidos"
          value={kpis?.lostDays || 0}
          subtitle={`${kpis?.accidents || 0} accidentes`}
          icon={AlertTriangle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
          borderColor="border-l-yellow-500"
        />
        <KPICard
          title="Puntaje promedio 5S"
          value={kpis?.avgFiveS ? `${kpis.avgFiveS}%` : '—'}
          subtitle="Promedio de todas las áreas"
          icon={ShieldCheck}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          borderColor={kpis?.avgFiveS >= 80 ? 'border-l-green-500' : 'border-l-yellow-500'}
        />
        <KPICard
          title="Requerimientos vencidos"
          value={kpis?.overdueRequirements || 0}
          subtitle="Requieren atención inmediata"
          icon={FileText}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          borderColor={kpis?.overdueRequirements > 0 ? 'border-l-red-500' : 'border-l-green-500'}
        />
        <KPICard
          title="Alertas activas"
          value={alerts.length}
          subtitle="Pendientes de atención"
          icon={Bell}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          borderColor={alerts.length > 5 ? 'border-l-red-500' : 'border-l-orange-500'}
        />
      </div>

      {/* EPP Inventory KPIs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HardHat size={18} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Inventario EPP</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Valor inventario actual"
            value={kpis?.eppCurrentValue > 0
              ? `$${kpis.eppCurrentValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '$0.00'}
            subtitle="Stock disponible × costo FIFO"
            icon={DollarSign}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-l-green-500"
          />
          <KPICard
            title="Valor inventario completo"
            value={kpis?.eppFullValue > 0
              ? `$${kpis.eppFullValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '$0.00'}
            subtitle="Todos los artículos a stock máximo"
            icon={TrendingUp}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-l-blue-500"
          />
          <KPICard
            title="Unidades a comprar"
            value={kpis?.eppUnitsToBuy ?? 0}
            subtitle={`${kpis?.eppItemsBelowMin ?? 0} artículos bajo mínimo`}
            icon={ShoppingCart}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            borderColor={kpis?.eppUnitsToBuy > 0 ? 'border-l-orange-500' : 'border-l-green-500'}
          />
          <KPICard
            title="Costo estimado de compra"
            value={kpis?.eppBuyCost > 0
              ? `$${kpis.eppBuyCost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '$0.00'}
            subtitle="Para cubrir máximos de artículos bajo mínimo"
            icon={DollarSign}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            borderColor={kpis?.eppBuyCost > 0 ? 'border-l-purple-500' : 'border-l-green-500'}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut requerimientos */}
        <Card>
          <h3 className="text-base font-semibold font-display mb-4">Estado de Requerimientos</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={charts?.requirementsByStatus?.map(r => ({ name: PIE_LABELS[r.status], value: r.count, status: r.status })) || []}
                cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value"
              >
                {charts?.requirementsByStatus?.map((r, i) => (
                  <Cell key={i} fill={PIE_COLORS[r.status] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Incidentes por mes */}
        <Card>
          <h3 className="text-base font-semibold font-display mb-4">Incidentes por Mes (últimos 12)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts?.incidentsByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#e8622a" radius={[4, 4, 0, 0]} name="Incidentes" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Cumplimiento por área */}
        <Card>
          <h3 className="text-base font-semibold font-display mb-4">Cumplimiento por Área</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts?.areaCompliance || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <YAxis dataKey="area" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill="#1a4a6b" radius={[0, 4, 4, 0]} name="Cumplimiento %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Tendencia 5S */}
        <Card>
          <h3 className="text-base font-semibold font-display mb-4">Tendencia 5S</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts?.fiveSTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563a8" strokeWidth={2} dot={{ r: 3 }} name="Puntaje %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="text-base font-semibold font-display">Panel de Alertas</h3>
          {alerts.length > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{alerts.length}</span>
          )}
        </div>
        <AlertsPanel alerts={alerts} />
      </Card>
    </div>
  );
}
