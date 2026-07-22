import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const TYPES = ['EPP', 'EXTINGUISHER', 'FIRST_AID_KIT', 'ELECTRICAL', 'EQUIPMENT', 'VEHICLE', 'OTHER'];
const STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'];
const EMPTY = { name: '', type: 'EXTINGUISHER', description: '', frequency: 'mensual', lastDate: '', nextDate: '', status: 'SCHEDULED', responsible: '', observations: '' };

export default function MaintenancePage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/maintenance', { params: { page, limit: 20 } }); setData(res.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...row, lastDate: row.lastDate?.slice(0, 10) || '', nextDate: row.nextDate?.slice(0, 10) || '' });
    setEditId(row.id); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/maintenance/${editId}`, form);
      else await api.post('/maintenance', form);
      toast.success(t('common.save')); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const columns = [
    { header: t('common.name'), accessor: 'name' },
    { header: t('incidents.type'), accessor: 'type', render: (v) => t(`maintenance.types.${v}`) || v },
    { header: t('maintenance.frequency'), accessor: 'frequency' },
    { header: t('maintenance.responsible'), accessor: 'responsible' },
    { header: t('maintenance.nextDate'), accessor: 'nextDate', render: (v) => formatDate(v) },
    { header: t('common.status'), accessor: 'status', render: (v) => <StatusPill status={v} /> },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/maintenance/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  usePageHeader(t('maintenance.title'), canWrite() && (
    <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> {t('maintenance.new')}</Button>
  ));

  return (
    <div className="space-y-5">
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('maintenance.title') : t('maintenance.new')} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('common.name')} required value={form.name} onChange={(e) => f('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('incidents.type')} required value={form.type} onChange={(e) => f('type', e.target.value)}>
              {TYPES.map(tp => <option key={tp} value={tp}>{t(`maintenance.types.${tp}`)}</option>)}
            </Select>
            <Input label={t('maintenance.responsible')} required value={form.responsible} onChange={(e) => f('responsible', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('maintenance.frequency')} value={form.frequency} onChange={(e) => f('frequency', e.target.value)}>
              {['semanal', 'mensual', 'trimestral', 'semestral', 'anual'].map(fr => <option key={fr} value={fr}>{t(`maintenance.frequencies.${fr}`)}</option>)}
            </Select>
            <Select label={t('common.status')} value={form.status} onChange={(e) => f('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{t(`maintenance.statuses.${s}`)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium block">{t('maintenance.lastDate')}</label>
              <input type="date" value={form.lastDate} onChange={(e) => f('lastDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
            <div className="space-y-1"><label className="text-sm font-medium block">{t('maintenance.nextDate')} <span className="text-red-500">*</span></label>
              <input type="date" value={form.nextDate} onChange={(e) => f('nextDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          </div>
          <Textarea label={t('common.description')} value={form.description} onChange={(e) => f('description', e.target.value)} rows={2} />
          <Textarea label={t('drills.observations')} value={form.observations} onChange={(e) => f('observations', e.target.value)} rows={2} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
