const variants = {
  primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white',
  secondary: 'bg-white border border-[var(--color-border)] text-[var(--color-text)] hover:bg-gray-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'text-[var(--color-text-muted)] hover:bg-gray-100',
  accent: 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({ children, variant = 'primary', size = 'md', isLoading, disabled, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 font-medium rounded-[var(--radius-sm)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
