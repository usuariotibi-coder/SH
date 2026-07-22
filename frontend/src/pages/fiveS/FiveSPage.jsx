import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import InlineEditField from '../../components/ui/InlineEditField';
import { Input, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const EMPTY = { area: '', auditDate: '', seiriScore: 3, seitonScore: 3, seisoScore: 3, seiketsuScore: 3, shitsuke: 3, seiriFinding: '', seiriImmediate: '', seiriImprovement: '', seitonFinding: '', seitonImmediate: '', seitonImprovement: '', seisoFinding: '', seisoImmediate: '', seisoImprovement: '', seiketsuFinding: '', seiketsuImmediate: '', seiketsuImprovement: '', shitsukeFinding: '', shitsukeImmediate: '', shitsukeImprovement: '', observations: '', actionPlan: '', auditorName: '' };
const S_LABELS = ['seiriScore', 'seitonScore', 'seisoScore', 'seiketsuScore', 'shitsuke'];
const S_KEYS = { seiriScore: 'seiri', seitonScore: 'seiton', seisoScore: 'seiso', seiketsuScore: 'seiketsu', shitsuke: 'shitsuke' };

const S_FIELDS = [
  { scoreKey: 'seiriScore', findingKey: 'seiriFinding', immediateKey: 'seiriImmediate', improvementKey: 'seiriImprovement', labelKey: 'seiri' },
  { scoreKey: 'seitonScore', findingKey: 'seitonFinding', immediateKey: 'seitonImmediate', improvementKey: 'seitonImprovement', labelKey: 'seiton' },
  { scoreKey: 'seisoScore', findingKey: 'seisoFinding', immediateKey: 'seisoImmediate', improvementKey: 'seisoImprovement', labelKey: 'seiso' },
  { scoreKey: 'seiketsuScore', findingKey: 'seiketsuFinding', immediateKey: 'seiketsuImmediate', improvementKey: 'seiketsuImprovement', labelKey: 'seiketsu' },
  { scoreKey: 'shitsuke', findingKey: 'shitsukeFinding', immediateKey: 'shitsukeImmediate', improvementKey: 'shitsukeImprovement', labelKey: 'shitsuke' },
];

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
    setForm({ ...EMPTY, ...row, auditDate: row.auditDate?.slice(0, 10) || '' });
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

  const patchItem = async (id, field, value) => {
    try {
      await api.patch(`/fives/${id}`, { [field]: value });
      setSelected(p => p ? { ...p, [field]: value } : p);
      load();
    } catch { toast.error(t('errors.saveError')); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const radarData = S_LABELS.map(k => ({ subject: t(`fiveS.${S_KEYS[k]}`).split(' ')[0], value: selected ? (selected[k] ?? 0) : 0, fullMark: 5 }));

  const columns = [
    { header: t('common.area'), accessor: 'area' },
    { header: t('common.date'), accessor: 'auditDate', render: (v) => formatDate(v) },
    { header: t('fiveS.auditorName'), accessor: 'auditorName' },
    { header: t('fiveS.totalScore'), accessor: 'totalScore', render: (v) => <span className={`font-semibold ${v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(v)}%</span> },
    { header: '', accessor: 'id', render: (v, row) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {canWrite() && <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/fives/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>}
      </div>
    )},
  ];

  usePageHeader(t('fiveS.title'), canWrite() && (
    <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> {t('fiveS.new')}</Button>
  ));

  return (
    <div className="space-y-5">
      <div className="flex gap-6 items-start">
        {/* Left: Table + Radar below */}
        <div className="w-1/2 min-w-0 space-y-5">
          <Card padding={false}>
            <Table columns={columns} data={data.data} isLoading={loading} emptyMessage={t('common.noData')} onRowClick={setSelected} />
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

          {selected && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold font-display text-sm">
                  Radar 5S — {selected.area} ({formatDate(selected.auditDate)})
                </h3>
                <button onClick={() => setSelected(null)} className="text-xs text-[var(--color-text-muted)] hover:underline">{t('common.close')}</button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#1a4a6b" fill="#1a4a6b" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>

        {/* Right: Action plan — 5S, finding, immediate actions & improvement */}
        <div className="w-1/2 min-w-0">
          {selected ? (
            <Card>
              <h3 className="font-semibold font-display text-sm mb-4">{t('fiveS.actionPlan')}</h3>
              <div className="space-y-4">
                {S_FIELDS.map(s => (
                  <div key={s.labelKey} className="border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{t(`fiveS.${s.labelKey}`)}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${selected[s.scoreKey] === 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{selected[s.scoreKey] ?? '—'}/5</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('fiveS.finding')}</p>
                        <InlineEditField
                          value={selected[s.findingKey] || ''}
                          onSave={val => patchItem(selected.id, s.findingKey, val)}
                          canEdit={canWrite() && selected[s.scoreKey] !== 5}
                          multiline
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('fiveS.immediate')}</p>
                        <InlineEditField
                          value={selected[s.immediateKey] || ''}
                          onSave={val => patchItem(selected.id, s.immediateKey, val)}
                          canEdit={canWrite() && selected[s.scoreKey] !== 5}
                          multiline
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{t('fiveS.improvement')}</p>
                        <InlineEditField
                          value={selected[s.improvementKey] || ''}
                          onSave={val => patchItem(selected.id, s.improvementKey, val)}
                          canEdit={canWrite() && selected[s.scoreKey] !== 5}
                          multiline
                          placeholder="—"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <p className="text-sm text-[var(--color-text-muted)] text-center">
                {t('fiveS.selectToView')}
              </p>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('fiveS.title') : t('fiveS.new')} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.area')} required value={form.area} onChange={(e) => f('area', e.target.value)} />
            <Input label={t('fiveS.auditorName')} required value={form.auditorName} onChange={(e) => f('auditorName', e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-sm font-medium block">{t('audits.auditDate')} <span className="text-red-500">*</span></label>
            <input type="date" value={form.auditDate} onChange={(e) => f('auditDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-[var(--color-border)] rounded-[var(--radius-sm)]">
              <thead>
                <tr className="bg-[var(--color-bg-muted)]">
                  <th className="text-left px-2 py-2 font-semibold text-[var(--color-text-muted)] w-32">5S</th>
                  <th className="text-center px-2 py-2 font-semibold text-[var(--color-text-muted)] w-16">{t('fiveS.score')}</th>
                  <th className="text-left px-2 py-2 font-semibold text-[var(--color-text-muted)]">{t('fiveS.finding')}</th>
                </tr>
              </thead>
              <tbody>
                {S_LABELS.map(k => {
                  const scoreKey = k;
                  const findingKey = k.endsWith('Score') ? k.replace('Score', 'Finding') : k + 'Finding';
                  const isMax = form[scoreKey] === 5;
                  return (
                    <tr key={k} className="border-t border-[var(--color-border)]">
                      <td className="px-2 py-2 font-medium text-[var(--color-text)] whitespace-nowrap">{t(`fiveS.${S_KEYS[k]}`)}</td>
                      <td className="px-2 py-2 text-center">
                        <select value={form[scoreKey]} onChange={(e) => f(scoreKey, parseInt(e.target.value))}
                          className="w-full px-1 py-1 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs text-center">
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <textarea value={form[findingKey] || ''} onChange={(e) => f(findingKey, e.target.value)}
                          disabled={isMax} rows={3}
                          className={`w-full px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs resize-none ${isMax ? 'bg-gray-100 text-[var(--color-text-muted)] cursor-not-allowed' : ''}`}
                          placeholder={isMax ? '—' : ''} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
