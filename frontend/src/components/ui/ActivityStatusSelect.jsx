const STATUS_STYLES = {
  PENDING:     'bg-gray-100 text-gray-700 border-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
  COMPLETED:   'bg-green-100 text-green-800 border-green-300',
  BLOCKED:     'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const STATUS_LABELS = {
  PENDING:     'Pendiente',
  IN_PROGRESS: 'En proceso',
  COMPLETED:   'Completada',
  BLOCKED:     'Bloqueada',
};

export default function ActivityStatusSelect({ value, onChange, disabled }) {
  const safeValue = value || 'PENDING';
  return (
    <select
      value={safeValue}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`text-xs font-medium rounded-md px-2 py-1.5 border cursor-pointer
        focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors
        ${STATUS_STYLES[safeValue] || STATUS_STYLES.PENDING}`}
    >
      {Object.entries(STATUS_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
