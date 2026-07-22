export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function KPICard({ title, value, subtitle, icon: Icon, iconColor = 'text-[var(--color-primary)]', iconBg = 'bg-blue-50', borderColor = 'border-l-green-500', trend }) {
  return (
    <Card className={`border-l-4 ${borderColor}`} padding={false}>
      <div className="flex items-start justify-between p-4">
        <div>
          <p className="text-sm text-[var(--color-text-muted)] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[var(--color-text)] mt-0.5 font-display">{value}</p>
          {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
          {trend !== undefined && (
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </Card>
  );
}
