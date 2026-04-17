import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export default function CalendarToolbar({ date, view, onNavigate, onView }) {
  const { t } = useTranslation();

  const VIEWS = [
    { key: 'month', labelKey: 'calendar.views.month' },
    { key: 'week', labelKey: 'calendar.views.week' },
    { key: 'agenda', labelKey: 'calendar.views.agenda' },
  ];

  const label = view === 'month'
    ? format(date, 'MMMM yyyy', { locale: es })
    : view === 'week'
    ? `Semana del ${format(date, 'd MMM yyyy', { locale: es })}`
    : format(date, 'MMMM yyyy', { locale: es });

  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      {/* Navegación */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </button>

        <span className="text-base font-bold font-display capitalize min-w-[180px] text-center"
          style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </span>

        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        </button>

        <button
          onClick={() => onNavigate('TODAY')}
          className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-gray-100"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          {t('calendar.today')}
        </button>
      </div>

      {/* Selector de vista */}
      <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => onView(v.key)}
            className="px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: view === v.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: view === v.key ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            {t(v.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
