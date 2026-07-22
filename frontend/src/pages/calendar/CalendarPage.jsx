import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTranslation } from 'react-i18next';

import api from '../../api/axios.config';
import useCompanyStore from '../../store/company.store';
import useAuthStore from '../../store/auth.store';

import CalendarToolbar from './CalendarToolbar';
import CalendarEventItem from './CalendarEventItem';
import CalendarLegend, { TYPES } from './CalendarLegend';
import CalendarSummaryCards from './CalendarSummaryCards';
import EventDetailDrawer from './EventDetailDrawer';
import usePageHeader from '../../hooks/usePageHeader';

/* ── date-fns localizer ─────────────────────────────────── */
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: es }),
  getDay,
  locales,
});

/* ── Colores por tipo ───────────────────────────────────── */
const TYPE_COLORS = {
  training:    '#16a34a',
  drill:       '#d97706',
  cmsh:        '#4d7c0f',
};

const SEVERITY_BORDERS = {
  overdue:  '#dc2626',
  urgent:   '#f59e0b',
  upcoming: '#3b82f6',
  normal:   'transparent',
};

export default function CalendarPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { selectedCompany } = useCompanyStore();
  const { user } = useAuthStore();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Tipos activos en leyenda — inicializa desde query param ?type=
  const initialTypes = TYPES.map(t => t.key);
  const [activeTypes, setActiveTypes] = useState(() => {
    const typeParam = searchParams.get('type');
    return typeParam ? [typeParam] : initialTypes;
  });

  /* ── Fetch ──────────────────────────────────────────── */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const companyId = user?.role === 'ADMIN' && selectedCompany
        ? selectedCompany.id
        : user?.companyId;

      const start = subDays(startOfMonth(currentDate), 7).toISOString();
      const end   = addDays(endOfMonth(currentDate), 7).toISOString();

      const { data } = await api.get('/calendar', {
        params: { companyId, start, end },
      });
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedCompany, user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ── Filtrar por tipos activos + severity (query param) ── */
  const severityParam = searchParams.get('severity');

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => activeTypes.includes(e.type))
      .filter(e => !severityParam || e.severity === severityParam)
      .map(e => ({
        ...e,
        start: new Date(e.date),
        end:   new Date(e.date),
        allDay: true,
      }));
  }, [events, activeTypes, severityParam]);

  /* ── Toggle tipo en leyenda ───────────────────────────── */
  const handleToggleType = (key) => {
    setActiveTypes(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  /* ── Estilos de evento ────────────────────────────────── */
  const eventPropGetter = useCallback((event) => {
    const bg = TYPE_COLORS[event.type] || '#1a4a6b';
    const border = SEVERITY_BORDERS[event.severity] || 'transparent';
    const isOverdue = event.severity === 'overdue';
    return {
      style: {
        backgroundColor: bg,
        borderLeft: `4px solid ${border}`,
        color: 'white',
        fontSize: '11px',
        borderRadius: '4px',
        opacity: isOverdue ? 0.75 : 1,
      },
    };
  }, []);

  usePageHeader(t('calendar.title'));

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="p-6 h-full flex flex-col" style={{ minHeight: 0 }}>
      {/* Summary cards */}
      <CalendarSummaryCards events={events} currentDate={currentDate} />

      {/* Legend */}
      <CalendarLegend activeTypes={activeTypes} onToggle={handleToggleType} />

      {/* Calendar container */}
      <div
        className="flex-1 rounded-xl border overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          minHeight: '520px',
        }}
      >
        <div className="p-4 h-full">
          {/* Custom toolbar */}
          <CalendarToolbar
            date={currentDate}
            view={currentView}
            onNavigate={(action) => {
              const d = new Date(currentDate);
              if (action === 'TODAY') { setCurrentDate(new Date()); return; }
              if (action === 'PREV') {
                if (currentView === 'month') d.setMonth(d.getMonth() - 1);
                else d.setDate(d.getDate() - 7);
              }
              if (action === 'NEXT') {
                if (currentView === 'month') d.setMonth(d.getMonth() + 1);
                else d.setDate(d.getDate() + 7);
              }
              setCurrentDate(new Date(d));
            }}
            onView={setCurrentView}
          />

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              date={currentDate}
              view={currentView}
              onNavigate={setCurrentDate}
              onView={setCurrentView}
              onSelectEvent={(e) => setSelectedEvent(e)}
              eventPropGetter={eventPropGetter}
              components={{
                toolbar: () => null, // usamos nuestro toolbar personalizado
                event: CalendarEventItem,
              }}
              messages={{
                noEventsInRange: t('calendar.noEvents'),
                showMore: (count) => `+${count} más`,
                date: t('common.date'),
                time: 'Hora',
                event: 'Evento',
                allDay: 'Todo el día',
                week: t('calendar.views.week'),
                day: 'Día',
                month: t('calendar.views.month'),
                previous: t('common.previous'),
                next: t('common.next'),
                today: t('calendar.today'),
                agenda: t('calendar.views.agenda'),
              }}
              style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}
              popup
            />
          )}
        </div>
      </div>

      {/* Event drawer */}
      {selectedEvent && (
        <EventDetailDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Estilos override react-big-calendar */}
      <style>{`
        .rbc-calendar { font-family: var(--font-body); }
        .rbc-header { background: var(--color-bg); color: var(--color-text-secondary); font-size: 12px; font-weight: 600; padding: 8px 4px; border-color: var(--color-border) !important; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: var(--color-border) !important; }
        .rbc-day-bg { border-color: var(--color-border) !important; }
        .rbc-off-range-bg { background: var(--color-bg) !important; }
        .rbc-today { background: rgba(26,74,107,0.06) !important; }
        .rbc-date-cell { font-size: 12px; color: var(--color-text-secondary); padding: 4px 6px; }
        .rbc-date-cell.rbc-now { font-weight: 700; color: var(--color-primary); }
        .rbc-event { padding: 2px 4px !important; }
        .rbc-show-more { color: var(--color-primary) !important; font-size: 11px; font-weight: 600; }
        .rbc-agenda-table { border-color: var(--color-border) !important; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell { color: var(--color-text-secondary); font-size: 12px; }
        .rbc-agenda-event-cell { font-size: 13px; }
        .rbc-row-segment { padding: 1px 2px; }
      `}</style>
    </div>
  );
}
