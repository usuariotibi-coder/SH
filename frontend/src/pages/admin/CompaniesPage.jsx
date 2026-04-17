import { useState, useEffect, useCallback } from 'react';
import { Plus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/DatePicker';
import api from '../../api/axios.config';

const EMPTY = { name: '', rfc: '', address: '', industry: '' };

export default function CompaniesPage() {
  const { t } = useTranslation();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/companies', { params: { page, limit: 20 } }); setData(res.data); }
    catch { toast.error('Error al cargar empresas'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => { setForm(row); setEditId(row.id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/companies/${editId}`, form);
      else await api.post('/companies', form);
      toast.success(editId ? t('common.save') : t('companies.new'));
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta empresa y todos sus datos?')) return;
    try { await api.delete(`/companies/${id}`); toast.success(t('common.delete')); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const columns = [
    { header: t('common.name'), accessor: 'name', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-[var(--color-primary)]/10 rounded-md flex items-center justify-center">
          <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <span className="font-medium">{v}</span>
      </div>
    )},
    { header: t('companies.rfc'), accessor: 'rfc' },
    { header: t('companies.industry'), accessor: 'industry' },
    { header: t('companies.isActive'), accessor: 'isActive', render: (v) => v ? <span className="text-green-600 text-xs font-medium">{t('common.yes')}</span> : <span className="text-red-500 text-xs font-medium">{t('common.no')}</span> },
    { header: '', accessor: 'id', render: (v, row) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={() => handleDelete(v)} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t('companies.title')}</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('companies.new')}</Button>
      </div>

      <Card padding={false}>
        <Table columns={columns} data={data.data} isLoading={loading} emptyMessage={t('common.noData')} />
        {data.totalPages > 1 && (
          <div className="p-4 flex items-center justify-between text-sm border-t border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)]">{t('common.page')} {data.page} {t('common.of')} {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('common.previous')}</Button>
              <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>{t('common.next')}</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('companies.title') : t('companies.new')} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('common.name')} required value={form.name} onChange={(e) => f('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('companies.rfc')} value={form.rfc} onChange={(e) => f('rfc', e.target.value)} />
            <Input label={t('companies.industry')} value={form.industry} onChange={(e) => f('industry', e.target.value)} />
          </div>
          <Input label={t('companies.address')} value={form.address} onChange={(e) => f('address', e.target.value)} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
