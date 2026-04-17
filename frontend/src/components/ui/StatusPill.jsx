import Badge from './Badge';

const STATUS_MAP = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En proceso', className: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Cumplido', className: 'bg-green-100 text-green-800' },
  OVERDUE: { label: 'Vencido', className: 'bg-red-100 text-red-800' },
  NOT_APPLICABLE: { label: 'No aplica', className: 'bg-gray-100 text-gray-600' },
  // Incident severity
  MINOR: { label: 'Leve', className: 'bg-blue-100 text-blue-800' },
  MODERATE: { label: 'Moderado', className: 'bg-yellow-100 text-yellow-800' },
  SERIOUS: { label: 'Grave', className: 'bg-orange-100 text-orange-800' },
  FATAL: { label: 'Fatal', className: 'bg-red-100 text-red-800' },
  // Risk
  LOW: { label: 'Bajo', className: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Medio', className: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'Alto', className: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Crítico', className: 'bg-red-100 text-red-800' },
  // Maintenance/Audit
  SCHEDULED: { label: 'Programado', className: 'bg-blue-100 text-blue-800' },
  PLANNED: { label: 'Planeado', className: 'bg-gray-100 text-gray-800' },
};

export default function StatusPill({ status, customLabel }) {
  const config = STATUS_MAP[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <Badge className={config.className}>{customLabel || config.label}</Badge>;
}
