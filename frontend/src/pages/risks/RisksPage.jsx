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
import api from '../../api/axios.config';

const LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const EMPTY = { area: '', hazard: '', riskDescription: '', probability: 3, severity: 3, currentControls: '', proposedControls: '', responsible: '', targetDate: '', isControlled: false };

export default function RisksPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filterLevel, setFilterLevel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/risks', { params: { page, limit: 20, riskLevel: filterLevel || undefined } });
      setData(res.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [page, filterLevel]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...row, targetDate: row.targetDate?.slice(0, 10) || '' });
    setEditId(row.id); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/risks/${editId}`, form);
      else await api.post('/risks', form);
      toast.success(t('common.save')); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const calcScore = () => form.probability * form.severity;

  const LEVEL_COLORS = { LOW: 'bg-green-50 border-green-200', MEDIUM: 'bg-yellow-50 border-yellow-200', HIGH: 'bg-orange-50 border-orange-200', CRITICAL: 'bg-red-50 border-red-200' };

  const columns = [
    { header: t('common.area'), accessor: 'area' },
    { header: t('risks.hazard'), accessor: 'hazard' },
    { header: t('risks.probability').charAt(0), accessor: 'probability', render: (v) => <span className="font-mono">{v}</span> },
    { header: t('risks.severity').charAt(0), accessor: 'severity', render: (v) => <span className="font-mono">{v}</span> },
    { header: 'Score', accessor: 'riskLevel', render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold">{row.probability * row.severity}</span>
        <StatusPill status={v} />
      </div>
    )},
    { header: t('common.responsible'), accessor: 'responsible' },
    { header: t('risks.targetDate'), accessor: 'targetDate', render: (v) => formatDate(v) },
    { header: t('risks.isControlled'), accessor: 'isControlled', render: (v) => v ? <span className="text-green-600 text-xs font-medium">{t('common.yes')}</span> : <span className="text-red-500 text-xs font-medium">{t('common.no')}</span> },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/risks/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t('risks.title')}</h1>
        {canWrite() && <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('risks.new')}</Button>}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[{ level: 'LOW', label: `${t('risks.levels.LOW')} 1–4`, color: 'bg-green-100 text-green-800' }, { level: 'MEDIUM', label: `${t('risks.levels.MEDIUM')} 5–9`, color: 'bg-yellow-100 text-yellow-800' }, { level: 'HIGH', label: `${t('risks.levels.HIGH')} 10–16`, color: 'bg-orange-100 text-orange-800' }, { level: 'CRITICAL', label: `${t('risks.levels.CRITICAL')} 17–25`, color: 'bg-red-100 text-red-800' }].map(item => (
          <button key={item.level} onClick={() => setFilterLevel(filterLevel === item.level ? '' : item.level)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${item.color} ${filterLevel === item.level ? 'border-current' : 'border-transparent'}`}>
            {item.label}
          </button>
        ))}
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('risks.title') : t('risks.new')} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.area')} required value={form.area} onChange={(e) => f('area', e.target.value)} />
            <Input label={t('risks.hazard')} required value={form.hazard} onChange={(e) => f('hazard', e.target.value)} />
          </div>
          <Textarea label={t('common.description')} required value={form.riskDescription} onChange={(e) => f('riskDescription', e.target.value)} />
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium block">{t('risks.probability')} ({form.probability})</label>
              <input type="range" min="1" max="5" step="1" value={form.probability} onChange={(e) => f('probability', parseInt(e.target.value))} className="w-full accent-[#1a4a6b]" />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]"><span>Muy baja</span><span>Muy alta</span></div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium block">{t('risks.severity')} ({form.severity})</label>
              <input type="range" min="1" max="5" step="1" value={form.severity} onChange={(e) => f('severity', parseInt(e.target.value))} className="w-full accent-[#e8622a]" />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]"><span>Insignificante</span><span>Catastrófico</span></div>
            </div>
          </div>
          <div className={`p-3 rounded-lg border text-center ${LEVEL_COLORS[['LOW','LOW','LOW','LOW','MEDIUM','MEDIUM','MEDIUM','MEDIUM','MEDIUM','HIGH','HIGH','HIGH','HIGH','HIGH','HIGH','HIGH','CRITICAL','CRITICAL','CRITICAL','CRITICAL','CRITICAL','CRITICAL','CRITICAL','CRITICAL','CRITICAL'][calcScore()-1]] || 'bg-gray-50 border-gray-200'}`}>
            <span className="text-sm font-semibold">Score: {calcScore()} / 25</span>
          </div>
          <Textarea label={t('risks.currentControls')} value={form.currentControls} onChange={(e) => f('currentControls', e.target.value)} rows={2} />
          <Textarea label={t('risks.proposedControls')} value={form.proposedControls} onChange={(e) => f('proposedControls', e.target.value)} rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.responsible')} value={form.responsible} onChange={(e) => f('responsible', e.target.value)} />
            <div className="space-y-1"><label className="text-sm font-medium block">{t('risks.targetDate')}</label>
              <input type="date" value={form.targetDate} onChange={(e) => f('targetDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="controlled" checked={form.isControlled} onChange={(e) => f('isControlled', e.target.checked)} className="w-4 h-4" />
            <label htmlFor="controlled" className="text-sm">{t('risks.isControlled')}</label>
          </div>
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
