import { useTranslation } from 'react-i18next';

const TYPES = [
  { key: 'requirement', labelKey: 'calendar.modules.requirement', color: '#1a4a6b' },
  { key: 'activity',    labelKey: 'calendar.modules.activity',    color: '#2563a8' },
  { key: 'training',    labelKey: 'calendar.modules.training',    color: '#16a34a' },
  { key: 'drill',       labelKey: 'calendar.modules.drill',       color: '#d97706' },
  { key: 'maintenance', labelKey: 'calendar.modules.maintenance', color: '#e8622a' },
  { key: 'risk',        labelKey: 'calendar.modules.risk',        color: '#dc2626' },
  { key: 'audit',       labelKey: 'calendar.modules.audit',       color: '#7c3aed' },
  { key: 'cmsh',        labelKey: 'calendar.modules.cmsh',        color: '#4d7c0f' },
];

export default function CalendarLegend({ activeTypes, onToggle }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TYPES.map(tp => {
        const isActive = activeTypes.includes(tp.key);
        return (
          <button
            key={tp.key}
            onClick={() => onToggle(tp.key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: isActive ? tp.color : 'var(--color-border)',
              background: isActive ? `${tp.color}18` : 'var(--color-surface)',
              color: isActive ? tp.color : 'var(--color-text-muted)',
              opacity: isActive ? 1 : 0.55,
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isActive ? tp.color : 'var(--color-border)' }}
            />
            {t(tp.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

export { TYPES };
