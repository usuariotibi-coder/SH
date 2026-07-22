import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/DatePicker';
import { formatDate, formatEvacTime } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const TYPES = ['FIRE', 'EARTHQUAKE', 'CHEMICAL_SPILL', 'MEDICAL_EMERGENCY', 'EVACUATION', 'OTHER'];
const EMPTY = { type: 'EVACUATION', plannedDate: '', executedDate: '', participantCount: '', evacuationTime: '', observations: '', correctives: '' };

export default function DrillsPage() {
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
    try { const res = await api.get('/drills', { params: { page, limit: 20 } }); setData(res.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...row, plannedDate: row.plannedDate?.slice(0, 10) || '', executedDate: row.executedDate?.slice(0, 10) || '' });
    setEditId(row.id); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/drills/${editId}`, form);
      else await api.post('/drills', form);
      toast.success(t('common.save')); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const columns = [
    { header: t('incidents.type'), accessor: 'type', render: (v) => t(`drills.types.${v}`) },
    { header: t('drills.plannedDate'), accessor: 'plannedDate', render: (v) => formatDate(v) },
    { header: t('drills.executedDate'), accessor: 'executedDate', render: (v) => formatDate(v) },
    { header: t('drills.participantCount'), accessor: 'participantCount' },
    { header: t('drills.evacuationTime'), accessor: 'evacuationTime', render: (v) => formatEvacTime(v) },
    { header: t('drills.isCompleted'), accessor: 'isCompleted', render: (v) => v ? <span className="text-green-600 text-xs font-medium">{t('common.yes')}</span> : <span className="text-yellow-600 text-xs font-medium">{t('common.pending')}</span> },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/drills/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  usePageHeader(t('drills.title'), canWrite() && (
    <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> {t('drills.new')}</Button>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('drills.title') : t('drills.new')} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Select label={t('incidents.type')} required value={form.type} onChange={(e) => f('type', e.target.value)}>
            {TYPES.map(tp => <option key={tp} value={tp}>{t(`drills.types.${tp}`)}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium block">{t('drills.plannedDate')} <span className="text-red-500">*</span></label>
              <input type="date" value={form.plannedDate} onChange={(e) => f('plannedDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
            <div className="space-y-1"><label className="text-sm font-medium block">{t('drills.executedDate')}</label>
              <input type="date" value={form.executedDate} onChange={(e) => f('executedDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('drills.participantCount')} type="number" min="0" value={form.participantCount} onChange={(e) => f('participantCount', e.target.value)} />
            <Input label={`${t('drills.evacuationTime')} (seg)`} type="number" min="0" value={form.evacuationTime} onChange={(e) => f('evacuationTime', e.target.value)} />
          </div>
          <Textarea label={t('drills.observations')} value={form.observations} onChange={(e) => f('observations', e.target.value)} />
          <Textarea label={t('drills.correctives')} value={form.correctives} onChange={(e) => f('correctives', e.target.value)} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
