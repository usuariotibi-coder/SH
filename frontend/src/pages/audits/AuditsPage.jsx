import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

const DEFAULT_CHECKLIST = [
  { question: 'El área está limpia y ordenada', answer: '', weight: 1, observations: '' },
  { question: 'Se cuenta con señalización de seguridad vigente', answer: '', weight: 1, observations: '' },
  { question: 'Los extintores están vigentes y accesibles', answer: '', weight: 2, observations: '' },
  { question: 'Los EPP están disponibles y en buen estado', answer: '', weight: 2, observations: '' },
  { question: 'Las salidas de emergencia están despejadas', answer: '', weight: 2, observations: '' },
  { question: 'El personal conoce los procedimientos de emergencia', answer: '', weight: 1, observations: '' },
];

const EMPTY = { title: '', auditDate: '', area: '', auditorName: '', status: 'PLANNED', checklist: DEFAULT_CHECKLIST, findings: '', correctives: '' };

export default function AuditsPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [auditDetail, setAuditDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/audits', { params: { page, limit: 20 } }); setData(res.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ ...EMPTY, checklist: DEFAULT_CHECKLIST.map(q => ({ ...q, answer: '', observations: '' })) }); setEditId(null); setShowModal(true); };
  const openEdit = async (row) => {
    try {
      const res = await api.get(`/audits/${row.id}`);
      setForm({ ...res.data, auditDate: res.data.auditDate?.slice(0, 10) || '' });
      setEditId(row.id); setShowModal(true);
    } catch { toast.error('Error al cargar auditoría'); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/audits/${editId}`, form);
      else await api.post('/audits', form);
      toast.success(t('common.save')); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateChecklist = (idx, field, value) => {
    const updated = [...form.checklist];
    updated[idx] = { ...updated[idx], [field]: value };
    f('checklist', updated);
  };

  const addQuestion = () => f('checklist', [...form.checklist, { question: '', answer: '', weight: 1, observations: '' }]);

  const loadDetail = async (id) => {
    if (expandedId === id) { setExpandedId(null); setAuditDetail(null); return; }
    try {
      const res = await api.get(`/audits/${id}`);
      setAuditDetail(res.data);
      setExpandedId(id);
    } catch { toast.error('Error'); }
  };

  const columns = [
    { header: t('audits.formTitle'), accessor: 'title' },
    { header: t('common.area'), accessor: 'area' },
    { header: t('audits.auditorName'), accessor: 'auditorName' },
    { header: t('common.date'), accessor: 'auditDate', render: (v) => formatDate(v) },
    { header: t('common.status'), accessor: 'status', render: (v) => <StatusPill status={v} /> },
    { header: t('audits.score'), accessor: 'score', render: (v) => v != null ? (
      <span className={`font-semibold ${v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(v)}%</span>
    ) : '—'},
    { header: '', accessor: 'id', render: (v, row) => (
      <div className="flex gap-2">
        <button onClick={() => loadDetail(v)} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
          {expandedId === v ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} {t('common.view')}
        </button>
        {canWrite() && <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>}
        {canWrite() && <button onClick={async () => { if (confirm('¿Eliminar?')) { await api.delete(`/audits/${v}`); load(); } }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>}
      </div>
    )},
  ];

  usePageHeader(t('audits.title'), canWrite() && (
    <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> {t('audits.new')}</Button>
  ));

  return (
    <div className="space-y-5">
      <Card padding={false}>
        <Table columns={columns} data={data.data} isLoading={loading} emptyMessage={t('common.noData')} />

        {/* Expanded detail */}
        {expandedId && auditDetail && (
          <div className="p-6 border-t border-[var(--color-border)] bg-gray-50">
            <h4 className="font-semibold mb-3 text-sm">{t('audits.checklist')} — {auditDetail.title}</h4>
            <div className="space-y-2">
              {(Array.isArray(auditDetail.checklist) ? auditDetail.checklist : []).map((q, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${q.answer === 'yes' ? 'bg-green-50 border-green-200' : q.answer === 'no' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <span className="flex-1">{q.question}</span>
                  <span className="font-medium capitalize">{q.answer === 'yes' ? t('common.yes') : q.answer === 'no' ? t('common.no') : q.answer === 'partial' ? t('audits.partial') : '—'}</span>
                </div>
              ))}
            </div>
            {auditDetail.findings && <div className="mt-4"><p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">{t('audits.findings')}</p><p className="text-sm">{auditDetail.findings}</p></div>}
            {auditDetail.correctives && <div className="mt-2"><p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">{t('audits.correctives')}</p><p className="text-sm">{auditDetail.correctives}</p></div>}
          </div>
        )}

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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('common.edit') + ' ' + t('audits.title') : t('audits.new')} size="xl">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('audits.formTitle')} required value={form.title} onChange={(e) => f('title', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.area')} required value={form.area} onChange={(e) => f('area', e.target.value)} />
            <Input label={t('audits.auditorName')} required value={form.auditorName} onChange={(e) => f('auditorName', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium block">{t('audits.auditDate')} <span className="text-red-500">*</span></label>
              <input type="date" value={form.auditDate} onChange={(e) => f('auditDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
            <Select label={t('common.status')} value={form.status} onChange={(e) => f('status', e.target.value)}>
              <option value="PLANNED">{t('audits.statuses.PLANNED')}</option>
              <option value="IN_PROGRESS">{t('audits.statuses.IN_PROGRESS')}</option>
              <option value="COMPLETED">{t('audits.statuses.COMPLETED')}</option>
            </Select>
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{t('audits.checklist')}</label>
              <Button type="button" size="sm" variant="secondary" onClick={addQuestion}><Plus className="w-3 h-3" /> {t('audits.addQuestion')}</Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {form.checklist.map((q, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-2 p-2 border border-[var(--color-border)] rounded-lg">
                  <input value={q.question} onChange={(e) => updateChecklist(i, 'question', e.target.value)}
                    placeholder={t('audits.questionPlaceholder')} className="text-sm px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
                  <select value={q.answer} onChange={(e) => updateChecklist(i, 'answer', e.target.value)}
                    className="text-sm px-2 py-1 border border-[var(--color-border)] rounded-[var(--radius-sm)]">
                    <option value="">—</option>
                    <option value="yes">{t('common.yes')}</option>
                    <option value="partial">{t('audits.partial')}</option>
                    <option value="no">{t('common.no')}</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <Textarea label={t('audits.findings')} value={form.findings} onChange={(e) => f('findings', e.target.value)} rows={3} />
          <Textarea label={t('audits.correctives')} value={form.correctives} onChange={(e) => f('correctives', e.target.value)} rows={3} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
