import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import useCompanyStore from '../../store/company.store';
import usePermissions from '../../hooks/usePermissions';

export default function CompanySelector() {
  const { isAdmin } = usePermissions();
  const { companies, selectedCompanyId, fetchCompanies, selectCompany } = useCompanyStore();

  useEffect(() => {
    if (isAdmin()) fetchCompanies();
  }, []);

  if (!isAdmin() || companies.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-white">
      <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
      <select
        value={selectedCompanyId || ''}
        onChange={(e) => selectCompany(e.target.value)}
        className="text-sm bg-transparent border-none outline-none text-[var(--color-text)]"
      >
        <option value="">Todas las empresas</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
