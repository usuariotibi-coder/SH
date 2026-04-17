const SEVERITY_DOT = {
  overdue:  '#dc2626',
  urgent:   '#f59e0b',
  upcoming: '#3b82f6',
  normal:   '#6b7280',
};

export default function CalendarEventItem({ event }) {
  const dotColor = SEVERITY_DOT[event.severity] || SEVERITY_DOT.normal;

  return (
    <div className="flex items-center gap-1 px-1 overflow-hidden" title={event.title}>
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />
      <span className="text-xs truncate leading-tight">{event.title}</span>
    </div>
  );
}
