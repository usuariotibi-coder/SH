import { useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, User, Layers, ArrowRight,
  FileText, AlertTriangle, Users2, GraduationCap, Siren,
  FlaskConical } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const MODULE_ICONS = {
  training:    GraduationCap,
  drill:       Siren,
  cmsh:        Users2,
};

const TYPE_COLORS = {
  training:    '#16a34a',
  drill:       '#d97706',
  cmsh:        '#4d7c0f',
};

export default function EventDetailDrawer({ event, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!event) return null;

  const SEVERITY_LABELS = {
    overdue:  { label: t('calendar.severity.overdue'),  bg: '#fef2f2', color: '#dc2626' },
    urgent:   { label: t('calendar.severity.urgent'),   bg: '#fffbeb', color: '#d97706' },
    upcoming: { label: t('calendar.severity.upcoming'), bg: '#eff6ff', color: '#2563eb' },
    normal:   { label: t('calendar.severity.normal'),   bg: '#f0fdf4', color: '#16a34a' },
  };

  const Icon = MODULE_ICONS[event.type] || FileText;
  const color = TYPE_COLORS[event.type] || '#1a4a6b';
  const sev = SEVERITY_LABELS[event.severity] || SEVERITY_LABELS.normal;
  const dateFormatted = event.date
    ? format(new Date(event.date), "d 'de' MMMM yyyy", { locale: es })
    : '—';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[400px] z-50 shadow-2xl flex flex-col"
        style={{ background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)', background: `${color}10` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="font-semibold text-sm" style={{ color }}>
              {event.module}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h2 className="text-lg font-bold leading-snug mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {event.title}
          </h2>

          {/* Severity badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ background: sev.bg, color: sev.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.color }} />
            {sev.label}
          </div>

          {/* Detalles */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.date')}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{dateFormatted}</p>
              </div>
            </div>

            {event.area && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.area')}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{event.area}</p>
                </div>
              </div>
            )}

            {event.status && (
              <div className="flex items-start gap-3">
                <Layers className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.status')}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{event.status}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Módulo</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{event.module}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => { onClose(); navigate(event.url); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors text-white"
            style={{ background: color }}
          >
            {t('calendar.viewDetail')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
