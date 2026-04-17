import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, AlertCircle, BookOpen, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import ResponsibleSelector from '../../components/ui/ResponsibleSelector';
import ActivityStatusSelect from '../../components/ui/ActivityStatusSelect';
import { Input, Select, Textarea } from '../../components/ui/DatePicker';
import { formatDate, daysUntil } from '../../utils/formatDate';
import { computeRequirementStatus } from '../../utils/computeRequirementStatus';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'NOT_APPLICABLE'];
const SOURCES  = ['NOM', 'IMSS', 'STPS', 'SEMARNAT', 'CIVIL_PROTECTION', 'MUNICIPAL', 'OTHER'];

const EMPTY_FORM = {
  code: '', name: '', specificRequirement: '', legalSource: 'NOM',
  legalBasis: '', area: '', status: 'PENDING', dueDate: '', responsibleArea: '', notes: '',
  normName: '', normObjective: '', applicabilityJustification: '', applicabilityScope: '',
};

let newIdCounter = 0;
const newId = () => `new-${++newIdCounter}`;

/* ── Componente tabla de actividades ──────────────────── */
function ActivityRow({ act, idx, onChange, onDelete, canWrite, users }) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); return; }
    onDelete(act.id);
  };

  return (
    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <td className="px-2 py-2 text-xs text-center" style={{ color: 'var(--color-text-muted)', width: '32px' }}>
        {idx + 1}
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={act.description}
          onChange={e => onChange(act.id, 'description', e.target.value)}
          disabled={!canWrite}
          placeholder={t('requirements.activities.description')}
          className="w-full text-xs px-2 py-1.5 border rounded"
          style={{ borderColor: 'var(--color-border)' }}
          required
          minLength={10}
        />
      </td>
      <td className="px-2 py-1.5" style={{ minWidth: '150px' }}>
        <ResponsibleSelector
          value={act.responsible}
          onChange={val => onChange(act.id, 'responsible', val)}
          users={users}
          disabled={!canWrite}
        />
      </td>
      <td className="px-2 py-1.5" style={{ minWidth: '130px' }}>
        <input
          type="date"
          value={act.dueDate ? act.dueDate.slice(0, 10) : ''}
          onChange={e => onChange(act.id, 'dueDate', e.target.value)}
          disabled={!canWrite}
          className="w-full text-xs px-2 py-1.5 border rounded"
          style={{ borderColor: 'var(--color-border)' }}
          required
        />
      </td>
      <td className="px-2 py-1.5 text-center" style={{ width: '110px' }}>
        <ActivityStatusSelect
          value={act.activityStatus || 'PENDING'}
          onChange={val => onChange(act.id, 'activityStatus', val)}
          disabled={!canWrite}
        />
      </td>
      {canWrite && (
        <td className="px-2 py-1.5 text-center" style={{ width: '48px' }}>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded transition-colors"
            style={{ color: confirmDelete ? '#dc2626' : 'var(--color-text-muted)' }}
            title={confirmDelete ? t('requirements.activities.deleteConfirm') : t('common.delete')}
          >
            {confirmDelete
              ? <AlertCircle className="w-4 h-4" />
              : <Trash2 className="w-4 h-4" />
            }
          </button>
        </td>
      )}
    </tr>
  );
}

/* ── Barra de progreso ───────────────────────────────── */
function ActivityProgress({ activities }) {
  const { t } = useTranslation();
  if (!activities.length) return null;
  const completed = activities.filter(a => a.activityStatus === 'COMPLETED').length;
  const total = activities.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
        <span>{t('requirements.activities.progress')}</span>
        <span>{completed} {t('requirements.activities.progressOf')} {total} {t('requirements.activities.completedLabel')}</span>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: allDone ? '#16a34a' : '#2563a8' }}
        />
      </div>
    </div>
  );
}

/* ── Página principal ────────────────────────────────── */
export default function RequirementsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canWrite } = usePermissions();

  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', legalSource: '', page: 1 });

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activities, setActivities] = useState([]);
  const [normExpanded, setNormExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [users, setUsers] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 20, ...filters };
      const res = await api.get('/requirements', { params });
      setData(res.data);
    } catch { toast.error('Error al cargar requerimientos'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const loadUsers = async () => {
    if (!canWrite()) return;
    try {
      const res = await api.get('/users/select');
      setUsers(res.data || []);
    } catch { /* no bloquear */ }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setActivities([]);
    setNormExpanded(false);
    setEditId(null);
    setShowModal(true);
    loadUsers();
  };

  const openEdit = async (row) => {
    setForm({ ...row, dueDate: row.dueDate ? row.dueDate.slice(0, 10) : '', specificRequirement: row.specificRequirement || '' });
    setEditId(row.id);
    setActivities([]);
    setNormExpanded(!!(row.normName || row.normObjective || row.applicabilityJustification || row.applicabilityScope));
    setShowModal(true);
    loadUsers();
    try {
      const res = await api.get(`/requirements/${row.id}`);
      setActivities(res.data.activities || []);
    } catch { /* no bloquear */ }
  };

  // Estado calculado en tiempo real
  const computedStatus = useMemo(
    () => computeRequirementStatus(activities, form.status),
    [activities, form.status]
  );

  const statusIsAutomatic = activities.length > 0 && form.status !== 'NOT_APPLICABLE';

  // Handlers de actividades
  const addActivity = () => {
    setActivities(prev => [...prev, {
      id: newId(), description: '', responsible: '', dueDate: '', isCompleted: false,
    }]);
  };

  const updateActivity = (id, field, value) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeActivity = (id) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.specificRequirement) {
      return toast.error('Código, nombre y requerimiento específico son requeridos');
    }
    // Validar actividades
    for (const act of activities) {
      if (!act.description || !act.responsible || !act.dueDate) {
        return toast.error('Todas las actividades deben tener descripción, responsable y fecha');
      }
    }

    setSaving(true);
    try {
      const payload = { ...form, activities };
      if (editId) await api.put(`/requirements/${editId}`, payload);
      else await api.post('/requirements', payload);
      toast.success(editId ? t('requirements.edit') : t('requirements.new'));
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este requerimiento?')) return;
    try {
      await api.delete(`/requirements/${id}`);
      toast.success(t('common.delete'));
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const dueDateColor = (date, status) => {
    if (!date || status === 'COMPLETED' || status === 'NOT_APPLICABLE') return '';
    const days = daysUntil(date);
    if (days < 0) return 'text-red-600 font-medium';
    if (days <= 15) return 'text-yellow-600 font-medium';
    return '';
  };

  const columns = [
    { header: t('requirements.code'), accessor: 'code', render: (v) => (
      <span className="font-mono text-xs font-semibold text-[var(--color-primary)]">{v}</span>
    )},
    { header: t('requirements.name'), accessor: 'name', render: (v, row) => (
      <button onClick={() => navigate(`/requirements/${row.id}`)} className="text-left hover:text-[var(--color-primary)] hover:underline">{v}</button>
    )},
    { header: t('requirements.legalSource'), accessor: 'legalSource' },
    { header: t('common.area'), accessor: 'area' },
    { header: t('common.status'), accessor: 'status', render: (v) => <StatusPill status={v} /> },
    { header: t('requirements.activities.title'), accessor: '_count', render: (v) => (
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{v?.activities ?? 0}</span>
    )},
    { header: t('requirements.dueDate'), accessor: 'dueDate', render: (v, row) => (
      <span className={dueDateColor(v, row.status)}>{formatDate(v)}</span>
    )},
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
        <h1 className="text-2xl font-bold font-display">{t('requirements.title')}</h1>
        {canWrite() && <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('requirements.new')}</Button>}
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="p-4 flex flex-wrap gap-3 items-center border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              placeholder={t('common.search')}
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1.5"
          >
            <option value="">{t('requirements.status')}</option>
            {STATUSES.map(s => <option key={s} value={s}>{t(`requirements.statuses.${s}`)}</option>)}
          </select>
          <select
            value={filters.legalSource}
            onChange={(e) => setFilters(f => ({ ...f, legalSource: e.target.value, page: 1 }))}
            className="text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1.5"
          >
            <option value="">{t('requirements.legalSource')}</option>
            {SOURCES.map(s => <option key={s} value={s}>{t(`requirements.legalSources.${s}`)}</option>)}
          </select>
        </div>

        <Table columns={columns} data={data.data} isLoading={loading} emptyMessage={t('common.noData')} />

        {data.totalPages > 1 && (
          <div className="p-4 flex items-center justify-between text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
            <span>{t('common.page')} {data.page} {t('common.of')} {data.totalPages} — {data.total} {t('common.records')}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={data.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>{t('common.previous')}</Button>
              <Button variant="secondary" size="sm" disabled={data.page >= data.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>{t('common.next')}</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Modal ───────────────────────────────────────────── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('requirements.edit') : t('requirements.new')} size="xl">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Datos principales */}
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('requirements.code')} required value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} placeholder="NOM-017-STPS-2008" />
            <Select label={t('requirements.legalSource')} required value={form.legalSource} onChange={(e) => setForm(f => ({ ...f, legalSource: e.target.value }))}>
              {SOURCES.map(s => <option key={s} value={s}>{t(`requirements.legalSources.${s}`)}</option>)}
            </Select>
          </div>
          <Input label={t('requirements.name')} required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea
            label={t('requirements.specificRequirement')}
            required
            value={form.specificRequirement}
            onChange={(e) => setForm(f => ({ ...f, specificRequirement: e.target.value }))}
            rows={3}
          />

          {/* ── Sección colapsable: Información de la norma ── */}
          {(() => {
            const hasNormData = !!(form.normName || form.normObjective || form.applicabilityJustification || form.applicabilityScope);
            return (
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  type="button"
                  onClick={() => setNormExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  style={{ background: 'var(--color-bg)' }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {t('requirements.normInfo.sectionTitle')}
                    </span>
                    {hasNormData && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {t('requirements.normInfo.completed')}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className="w-4 h-4 transition-transform"
                    style={{ color: 'var(--color-text-muted)', transform: normExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {normExpanded && (
                  <div className="px-4 py-4 space-y-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('requirements.normInfo.normName')}</label>
                      <input
                        type="text"
                        value={form.normName || ''}
                        onChange={e => setForm(f => ({ ...f, normName: e.target.value }))}
                        placeholder="Nombre oficial completo de la norma o disposición legal"
                        className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('requirements.normInfo.normObjective')}</label>
                      <textarea
                        rows={3}
                        value={form.normObjective || ''}
                        onChange={e => setForm(f => ({ ...f, normObjective: e.target.value }))}
                        placeholder="¿Qué busca prevenir o regular esta norma?"
                        className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm resize-y"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('requirements.normInfo.applicabilityJustification')}</label>
                      <textarea
                        rows={3}
                        value={form.applicabilityJustification || ''}
                        onChange={e => setForm(f => ({ ...f, applicabilityJustification: e.target.value }))}
                        placeholder="¿Por qué aplica esta norma a la empresa?"
                        className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm resize-y"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('requirements.normInfo.applicabilityScope')}</label>
                      <textarea
                        rows={3}
                        value={form.applicabilityScope || ''}
                        onChange={e => setForm(f => ({ ...f, applicabilityScope: e.target.value }))}
                        placeholder="Áreas, puestos o procesos a los que aplica"
                        className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm resize-y"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <Input label={t('requirements.legalBasis')} value={form.legalBasis} onChange={(e) => setForm(f => ({ ...f, legalBasis: e.target.value }))} placeholder="Art. 5, Fracc. II" />
            <Input label={t('common.area')} value={form.area} onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))} />
          </div>

          {/* Estado + preview calculado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('common.status')}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                disabled={statusIsAutomatic}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {STATUSES.map(s => <option key={s} value={s}>{t(`requirements.statuses.${s}`)}</option>)}
              </select>
              {statusIsAutomatic && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {t('requirements.activities.statusAutomatic')}
                </p>
              )}
              {activities.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('common.status')}:</span>
                  <StatusPill status={computedStatus} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('requirements.dueDate')}
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm"
              />
            </div>
          </div>
          <Input label={t('requirements.responsibleArea')} value={form.responsibleArea} onChange={(e) => setForm(f => ({ ...f, responsibleArea: e.target.value }))} />

          {/* ── Sección actividades ─────────────────────────── */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {t('requirements.activities.title')}
            </h3>

            <ActivityProgress activities={activities} />

            {activities.length === 0 ? (
              <p className="text-xs py-3 text-center rounded-lg border border-dashed" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                {t('requirements.activities.noActivities')}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-sm" style={{ background: 'var(--color-surface)' }}>
                  <thead>
                    <tr className="border-b text-xs font-semibold" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                      <th className="px-2 py-2 text-center">#</th>
                      <th className="px-2 py-2 text-left">{t('requirements.activities.description')}</th>
                      <th className="px-2 py-2 text-left">{t('requirements.activities.responsible')}</th>
                      <th className="px-2 py-2 text-left">{t('requirements.activities.dueDate')}</th>
                      <th className="px-2 py-2 text-center">{t('requirements.activities.status')}</th>
                      {canWrite() && <th className="px-2 py-2 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act, idx) => (
                      <ActivityRow
                        key={act.id}
                        act={act}
                        idx={idx}
                        onChange={updateActivity}
                        onDelete={removeActivity}
                        canWrite={canWrite()}
                        users={users}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {canWrite() && (
              <button
                type="button"
                onClick={addActivity}
                className="mt-3 text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                <Plus className="w-3.5 h-3.5" /> {t('requirements.activities.add')}
              </button>
            )}
          </div>

          <Textarea label={t('common.notes')} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
