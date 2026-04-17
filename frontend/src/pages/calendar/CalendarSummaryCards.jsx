import { getMonth, getYear } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function CalendarSummaryCards({ events, currentDate }) {
  const { t } = useTranslation();

  const CARDS = [
    { key: 'overdue',  labelKey: 'calendar.summary.overdue',  bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '🔴' },
    { key: 'urgent',   labelKey: 'calendar.summary.urgent',   bg: '#fffbeb', border: '#fde68a', text: '#d97706', dot: '🟡' },
    { key: 'upcoming', labelKey: 'calendar.summary.upcoming', bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', dot: '🔵' },
    { key: 'normal',   labelKey: 'calendar.summary.completed', bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '✅' },
  ];

  const month = getMonth(currentDate);
  const year = getYear(currentDate);

  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    return getMonth(d) === month && getYear(d) === year;
  });

  const counts = monthEvents.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {CARDS.map(c => (
        <div
          key={c.key}
          className="rounded-xl border px-4 py-3 flex items-center gap-3"
          style={{ background: c.bg, borderColor: c.border }}
        >
          <span className="text-xl">{c.dot}</span>
          <div>
            <p className="text-xl font-bold leading-none" style={{ color: c.text }}>
              {counts[c.key] || 0}
            </p>
            <p className="text-xs mt-0.5" style={{ color: c.text, opacity: 0.75 }}>{t(c.labelKey)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
