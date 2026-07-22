import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const EMPTY = { name: '', description: '', instructor: '', trainingDate: '', durationHours: '', location: '', normReference: '', participants: '', expirationDate: '' };

export default function TrainingPage() {
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
    try {
      const res = await api.get('/trainings', { params: { page, limit: 20 } });
      setData(res.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({
      ...row,
      participants: Array.isArray(row.participants) ? row.participants.join(', ') : row.participants,
      trainingDate: row.trainingDate?.slice(0, 10) || '',
      expirationDate: row.expirationDate?.slice(0, 10) || '',
    });
    setEditId(row.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await api.put(`/trainings/${editId}`, form);
      else await api.post('/trainings', form);
      toast.success(t('common.save'));
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const columns = [
    { header: t('common.name'), accessor: 'name' },
    { header: t('training.instructor'), accessor: 'instructor' },
    { header: t('common.date'), accessor: 'trainingDate', render: (v) => formatDate(v) },
    { header: t('training.durationHours'), accessor: 'durationHours' },
    { header: t('training.participantCount'), accessor: 'participantCount' },
    { header: t('training.normReference'), accessor: 'normReference' },
    { header: t('training.expirationDate'), accessor: 'expirationDate', render: (v) => formatDate(v) },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/trainings/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  usePageHeader(t('training.title'), canWrite() && (
    <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> {t('training.new')}</Button>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('training.title') : t('training.new')} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('training.name')} required value={form.name} onChange={(e) => f('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('training.instructor')} required value={form.instructor} onChange={(e) => f('instructor', e.target.value)} />
            <Input label={t('training.location')} value={form.location} onChange={(e) => f('location', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium block">{t('common.date')} <span className="text-red-500">*</span></label>
              <input type="date" value={form.trainingDate} onChange={(e) => f('trainingDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
            <Input label={t('training.durationHours')} required type="number" min="0.5" step="0.5" value={form.durationHours} onChange={(e) => f('durationHours', e.target.value)} />
            <Input label={t('training.normReference')} value={form.normReference} onChange={(e) => f('normReference', e.target.value)} placeholder="NOM-019-STPS" />
          </div>
          <Textarea label={t('training.participants')} value={form.participants} onChange={(e) => f('participants', e.target.value)} placeholder="Juan Pérez, María García, ..." rows={3} />
          <div className="space-y-1"><label className="text-sm font-medium block">{t('training.expirationDate')}</label>
            <input type="date" value={form.expirationDate} onChange={(e) => f('expirationDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          <Textarea label={t('common.description')} value={form.description} onChange={(e) => f('description', e.target.value)} rows={2} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
