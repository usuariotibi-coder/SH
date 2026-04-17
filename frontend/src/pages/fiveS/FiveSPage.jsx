import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const EMPTY = { area: '', auditDate: '', seiriScore: 3, seitonScore: 3, seisoScore: 3, seiketsuScore: 3, shitsuke: 3, observations: '', actionPlan: '', auditorName: '' };
const S_LABELS = ['seiriScore', 'seitonScore', 'seisoScore', 'seiketsuScore', 'shitsuke'];
const S_KEYS = { seiriScore: 'seiri', seitonScore: 'seiton', seisoScore: 'seiso', seiketsuScore: 'seiketsu', shitsuke: 'shitsuke' };

export default function FiveSPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/fives', { params: { page, limit: 20 } }); setData(res.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => {
    setForm({ ...row, auditDate: row.auditDate?.slice(0, 10) || '' });
    setEditId(row.id); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/fives/${editId}`, form);
      else await api.post('/fives', form);
      toast.success(t('common.save')); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const radarData = selected ? S_LABELS.map(k => ({ subject: t(`fiveS.${S_KEYS[k]}`).split(' ')[0], value: selected[k], fullMark: 5 })) : [];

  const columns = [
    { header: t('common.area'), accessor: 'area' },
    { header: t('common.date'), accessor: 'auditDate', render: (v) => formatDate(v) },
    { header: t('fiveS.auditorName'), accessor: 'auditorName' },
    { header: t('fiveS.seiri'), accessor: 'seiriScore' },
    { header: t('fiveS.seiton'), accessor: 'seitonScore' },
    { header: t('fiveS.seiso'), accessor: 'seisoScore' },
    { header: t('fiveS.seiketsu'), accessor: 'seiketsuScore' },
    { header: t('fiveS.shitsuke'), accessor: 'shitsuke' },
    { header: t('fiveS.totalScore'), accessor: 'totalScore', render: (v) => <span className={`font-semibold ${v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(v)}%</span> },
    { header: '', accessor: 'id', render: (v, row) => (
      <div className="flex gap-2">
        <button onClick={() => setSelected(row)} className="text-xs text-purple-600 hover:underline">Radar</button>
        {canWrite() && <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>}
        {canWrite() && <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/fives/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t('fiveS.title')}</h1>
        {canWrite() && <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('fiveS.new')}</Button>}
      </div>

      {selected && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold font-display">Radar 5S — {selected.area} ({formatDate(selected.auditDate)})</h3>
            <button onClick={() => setSelected(null)} className="text-xs text-[var(--color-text-muted)] hover:underline">{t('common.close')}</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar dataKey="value" stroke="#1a4a6b" fill="#1a4a6b" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('fiveS.title') : t('fiveS.new')} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.area')} required value={form.area} onChange={(e) => f('area', e.target.value)} />
            <Input label={t('fiveS.auditorName')} required value={form.auditorName} onChange={(e) => f('auditorName', e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-sm font-medium block">{t('audits.auditDate')} <span className="text-red-500">*</span></label>
            <input type="date" value={form.auditDate} onChange={(e) => f('auditDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {S_LABELS.map(k => (
              <div key={k} className="space-y-1">
                <label className="text-sm font-medium block">{t(`fiveS.${S_KEYS[k]}`)} <span className="text-[var(--color-text-muted)] font-normal">(1–5)</span></label>
                <input type="range" min="1" max="5" step="1" value={form[k]} onChange={(e) => f(k, parseInt(e.target.value))}
                  className="w-full accent-[#1a4a6b]" />
                <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                  <span>1</span><span className="font-semibold text-[var(--color-primary)]">{form[k]}</span><span>5</span>
                </div>
              </div>
            ))}
          </div>
          <Textarea label={t('drills.observations')} value={form.observations} onChange={(e) => f('observations', e.target.value)} />
          <Textarea label={t('fiveS.actionPlan')} value={form.actionPlan} onChange={(e) => f('actionPlan', e.target.value)} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
