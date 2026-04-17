import { useState, useEffect } from 'react';
import { BookOpen, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const EMPTY = { year: new Date().getFullYear(), objectives: '', scope: '', budget: '', responsible: '', approvedBy: '', approvedAt: '', notes: '' };

export default function ProgramPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const res = await api.get('/program'); setProgram(res.data); }
    catch (err) { if (err.response?.status !== 404) toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = () => {
    setForm(program ? { ...program, approvedAt: program.approvedAt?.slice(0, 10) || '', budget: program.budget || '' } : EMPTY);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put('/program', form);
      toast.success(t('common.save'));
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="py-12 text-center text-[var(--color-text-muted)]">{t('common.loading')}</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">{t('program.title')}</h1>
        {canWrite() && <Button onClick={openEdit}><Edit3 className="w-4 h-4" /> {program ? t('common.edit') : t('common.new')}</Button>}
      </div>

      {!program ? (
        <Card>
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)]">{t('common.noData')}</p>
            {canWrite() && <Button className="mt-4" onClick={openEdit}>{t('common.new')}</Button>}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-[var(--color-text-muted)]">{t('program.year')}</p><p className="text-2xl font-bold font-display text-[var(--color-primary)]">{program.year}</p></div>
              <div><p className="text-xs text-[var(--color-text-muted)]">{t('program.responsible')}</p><p className="font-medium">{program.responsible}</p></div>
              <div><p className="text-xs text-[var(--color-text-muted)]">{t('program.budget')}</p><p className="font-medium">{program.budget ? `$${Number(program.budget).toLocaleString('es-MX')}` : '—'}</p></div>
              <div><p className="text-xs text-[var(--color-text-muted)]">{t('program.approvedBy')}</p><p className="font-medium">{program.approvedBy || '—'}</p></div>
              <div><p className="text-xs text-[var(--color-text-muted)]">{t('program.approvedAt')}</p><p className="font-medium">{formatDate(program.approvedAt)}</p></div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold font-display mb-2 text-sm">{t('program.objectives')}</h3>
            <p className="text-sm text-[var(--color-text)] whitespace-pre-line">{program.objectives}</p>
          </Card>

          {program.scope && (
            <Card>
              <h3 className="font-semibold font-display mb-2 text-sm">{t('program.scope')}</h3>
              <p className="text-sm text-[var(--color-text)] whitespace-pre-line">{program.scope}</p>
            </Card>
          )}

          {program.notes && (
            <Card>
              <h3 className="font-semibold font-display mb-2 text-sm">{t('common.notes')}</h3>
              <p className="text-sm text-[var(--color-text)] whitespace-pre-line">{program.notes}</p>
            </Card>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={program ? t('common.edit') + ' ' + t('program.title') : t('program.title')} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('program.year')} required type="number" value={form.year} onChange={(e) => f('year', e.target.value)} />
            <Input label={t('program.responsible')} required value={form.responsible} onChange={(e) => f('responsible', e.target.value)} />
          </div>
          <Textarea label={t('program.objectives')} required value={form.objectives} onChange={(e) => f('objectives', e.target.value)} rows={5} />
          <Textarea label={t('program.scope')} value={form.scope} onChange={(e) => f('scope', e.target.value)} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t('program.budget')} (MXN)`} type="number" value={form.budget} onChange={(e) => f('budget', e.target.value)} />
            <Input label={t('program.approvedBy')} value={form.approvedBy} onChange={(e) => f('approvedBy', e.target.value)} />
          </div>
          <div className="space-y-1"><label className="text-sm font-medium block">{t('program.approvedAt')}</label>
            <input type="date" value={form.approvedAt} onChange={(e) => f('approvedAt', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          <Textarea label={t('common.notes')} value={form.notes} onChange={(e) => f('notes', e.target.value)} rows={3} />
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
