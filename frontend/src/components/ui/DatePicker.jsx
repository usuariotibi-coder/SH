export default function DatePicker({ label, required, error, ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type="date"
        className={`w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors ${error ? 'border-red-500' : 'border-[var(--color-border)]'}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FormField({ label, required, error, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Input({ label, required, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors ${error ? 'border-red-500' : 'border-[var(--color-border)]'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, required, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors ${error ? 'border-red-500' : 'border-[var(--color-border)]'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, required, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        rows={3}
        className={`w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors resize-none ${error ? 'border-red-500' : 'border-[var(--color-border)]'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
