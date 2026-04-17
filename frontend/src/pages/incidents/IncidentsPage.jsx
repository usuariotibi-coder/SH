import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import api from '../../api/axios.config';

const TYPES = ['ACCIDENT', 'INCIDENT', 'NEAR_MISS', 'OCCUPATIONAL_DISEASE'];
const SEVERITIES = ['MINOR', 'MODERATE', 'SERIOUS', 'FATAL'];

const EMPTY = { type: 'INCIDENT', severity: 'MINOR', occurredAt: '', area: '', description: '', injuredName: '', injuredPosition: '', rootCause: '', correctiveAction: '', imssReportNo: '', lostDays: 0, isReportedIMSS: false };

export default function IncidentsPage() {
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
      const res = await api.get('/incidents', { params: { page, limit: 20 } });
      setData(res.data);
    } catch { toast.error('Error al cargar incidentes'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...row, occurredAt: row.occurredAt?.slice(0, 16) || '' });
    setEditId(row.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) await api.put(`/incidents/${editId}`, form);
      else await api.post('/incidents', form);
      toast.success(editId ? t('incidents.edit') : t('incidents.new'));
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este incidente?')) return;
    try { await api.delete(`/incidents/${id}`); toast.success(t('common.delete')); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const columns = [
    { header: t('incidents.folio'), accessor: 'folio', render: (v) => <span className="font-mono text-xs font-semibold">{v}</span> },
    { header: t('incidents.type'), accessor: 'type', render: (v) => t(`incidents.types.${v}`) || v },
    { header: t('incidents.severity'), accessor: 'severity', render: (v) => <StatusPill status={v} customLabel={t(`incidents.severities.${v}`)} /> },
    { header: t('common.area'), accessor: 'area' },
    { header: t('common.date'), accessor: 'occurredAt', render: (v) => formatDate(v) },
    { header: t('incidents.isClosed'), accessor: 'isClosed', render: (v) => v ? <span className="text-green-600 text-xs font-medium">{t('incidents.isClosed')}</span> : <span className="text-yellow-600 text-xs font-medium">{t('common.inProgress')}</span> },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={() => handleDelete(v)} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t('incidents.title')}</h1>
        {canWrite() && <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('incidents.new')}</Button>}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('incidents.edit') : t('incidents.new')} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('incidents.type')} required value={form.type} onChange={(e) => f('type', e.target.value)}>
              {TYPES.map(tp => <option key={tp} value={tp}>{t(`incidents.types.${tp}`)}</option>)}
            </Select>
            <Select label={t('incidents.severity')} required value={form.severity} onChange={(e) => f('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s} value={s}>{t(`incidents.severities.${s}`)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t('incidents.occurredAt')} <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.occurredAt} onChange={(e) => f('occurredAt', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" />
            </div>
            <Input label={t('common.area')} required value={form.area} onChange={(e) => f('area', e.target.value)} />
          </div>
          <Textarea label={t('common.description')} required value={form.description} onChange={(e) => f('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre del lesionado" value={form.injuredName} onChange={(e) => f('injuredName', e.target.value)} />
            <Input label="Puesto del lesionado" value={form.injuredPosition} onChange={(e) => f('injuredPosition', e.target.value)} />
          </div>
          <Textarea label={t('incidents.rootCause')} value={form.rootCause} onChange={(e) => f('rootCause', e.target.value)} />
          <Textarea label={t('incidents.correctiveAction')} value={form.correctiveAction} onChange={(e) => f('correctiveAction', e.target.value)} />
          <div className="grid grid-cols-3 gap-4">
            <Input label={`${t('common.register')} ${t('incidents.imssReport')}`} value={form.imssReportNo} onChange={(e) => f('imssReportNo', e.target.value)} />
            <Input label={t('incidents.lostDays')} type="number" min="0" value={form.lostDays} onChange={(e) => f('lostDays', parseInt(e.target.value))} />
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="imss" checked={form.isReportedIMSS} onChange={(e) => f('isReportedIMSS', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="imss" className="text-sm">{t('incidents.imssReport')}</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
