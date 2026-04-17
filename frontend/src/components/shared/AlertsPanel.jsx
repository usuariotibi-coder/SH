import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Wrench, GraduationCap, Users2, Siren, CalendarDays } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';

const ALERT_ICONS = {
  REQUIREMENT_OVERDUE: AlertTriangle,
  REQUIREMENT_DUE_SOON: Clock,
  MAINTENANCE_OVERDUE: Wrench,
  MAINTENANCE_DUE_SOON: Wrench,
  TRAINING_EXPIRING: GraduationCap,
  CMSH_MEETING_MISSING: Users2,
  DRILL_PENDING: Siren,
};

const ALERT_COLORS = {
  3: 'border-red-200 bg-red-50 text-red-700',
  2: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  1: 'border-blue-200 bg-blue-50 text-blue-700',
};

const ALERT_TYPE_TO_CALENDAR = {
  REQUIREMENT_OVERDUE:  { type: 'requirement', severity: 'overdue' },
  REQUIREMENT_DUE_SOON: { type: 'requirement', severity: 'urgent' },
  MAINTENANCE_OVERDUE:  { type: 'maintenance', severity: 'overdue' },
  MAINTENANCE_DUE_SOON: { type: 'maintenance', severity: 'urgent' },
  TRAINING_EXPIRING:    { type: 'training',    severity: 'urgent' },
  CMSH_MEETING_MISSING: { type: 'cmsh',        severity: 'overdue' },
  DRILL_PENDING:        { type: 'drill',       severity: 'upcoming' },
};

export default function AlertsPanel({ alerts = [], onMarkRead }) {
  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--color-text-muted)] text-sm">
        Sin alertas activas
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
        const colorClass = ALERT_COLORS[alert.priority] || ALERT_COLORS[1];
        const calParams = ALERT_TYPE_TO_CALENDAR[alert.type];
        const calUrl = calParams
          ? `/calendar?type=${calParams.type}&severity=${calParams.severity}`
          : '/calendar';

        return (
          <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${colorClass}`}>
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{alert.title}</p>
              <p className="text-xs opacity-80 truncate">{alert.description}</p>
              <Link
                to={calUrl}
                className="inline-flex items-center gap-1 text-xs font-medium mt-1 opacity-70 hover:opacity-100 transition-opacity"
              >
                <CalendarDays className="w-3 h-3" />
                Ver en calendario
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
