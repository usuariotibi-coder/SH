export default function Table({ columns, data, isLoading, emptyMessage = 'Sin datos' }) {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-3" />
        Cargando...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[var(--color-text-muted)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr key={ri} className="border-b border-[var(--color-border)] hover:bg-gray-50 transition-colors">
                {columns.map((col, ci) => (
                  <td key={ci} className="px-4 py-3 text-[var(--color-text)]">
                    {col.render ? col.render(row[col.accessor], row) : row[col.accessor] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
