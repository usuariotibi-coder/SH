import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle, Circle, Trash2, BookOpen, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import FileUploader from '../../components/ui/FileUploader';
import InlineEditField from '../../components/ui/InlineEditField';
import { Input, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

export default function RequirementDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEditNormContent } = usePermissions();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [normExpanded, setNormExpanded] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityForm, setActivityForm] = useState({ description: '', dueDate: '', notes: '' });
  const [savingActivity, setSavingActivity] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/requirements/${id}`);
      setReq(res.data);
      const d = res.data;
      setNormExpanded(!!(d.normName || d.normObjective || d.applicabilityJustification || d.applicabilityScope));
    } catch { toast.error('Error al cargar requerimiento'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const patchRequirement = async (fields) => {
    await api.patch(`/requirements/${id}`, fields);
    setReq(prev => ({ ...prev, ...fields }));
    toast.success(t('common.save'));
  };

  const toggleActivity = async (activity) => {
    try {
      const next = activity.activityStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await api.put(`/requirements/${id}/activities/${activity.id}`, { activityStatus: next });
      load();
    } catch { toast.error('Error al actualizar actividad'); }
  };

  const deleteActivity = async (activityId) => {
    if (!confirm(t('requirements.activities.deleteConfirm'))) return;
    try {
      await api.delete(`/requirements/${id}/activities/${activityId}`);
      toast.success(t('common.delete'));
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const saveActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.description || !activityForm.dueDate) return toast.error('Descripción y fecha requeridas');
    setSavingActivity(true);
    try {
      await api.post(`/requirements/${id}/activities`, activityForm);
      toast.success(t('common.save'));
      setShowActivityModal(false);
      setActivityForm({ description: '', dueDate: '', notes: '' });
      load();
    } catch { toast.error('Error al crear actividad'); }
    finally { setSavingActivity(false); }
  };

  if (loading) return <div className="py-12 text-center text-[var(--color-text-muted)]">{t('common.loading')}</div>;
  if (!req) return <div className="py-12 text-center text-red-500">{t('errors.notFound')}</div>;

  const editAllowed = canEditNormContent();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/requirements')} className="p-2 rounded-md hover:bg-gray-100 text-[var(--color-text-muted)]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display">{req.code}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{req.name}</p>
        </div>
        <div className="ml-auto">
          <StatusPill status={req.status} />
        </div>
      </div>

      {/* Info */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-[var(--color-text-muted)] text-xs">{t('requirements.legalSource')}</p><p className="font-medium">{req.legalSource}</p></div>
          <div><p className="text-[var(--color-text-muted)] text-xs">{t('requirements.legalBasis')}</p><p className="font-medium">{req.legalBasis || '—'}</p></div>
          <div><p className="text-[var(--color-text-muted)] text-xs">{t('common.area')}</p><p className="font-medium">{req.area || '—'}</p></div>
          <div><p className="text-[var(--color-text-muted)] text-xs">{t('requirements.responsibleArea')}</p><p className="font-medium">{req.responsibleArea || '—'}</p></div>
          <div><p className="text-[var(--color-text-muted)] text-xs">{t('requirements.dueDate')}</p><p className="font-medium">{formatDate(req.dueDate)}</p></div>
          <div><p className="text-[var(--color-text-muted)] text-xs">{t('common.createdAt')}</p><p className="font-medium">{req.createdBy?.name}</p></div>
        </div>

        {/* Requerimiento específico — edición inline */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {t('requirements.specificRequirement')}
            </p>
            {!editAllowed && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('common.readOnly')}</span>
            )}
          </div>
          <InlineEditField
            value={req.specificRequirement}
            onSave={val => patchRequirement({ specificRequirement: val })}
            canEdit={editAllowed}
            label={t('requirements.specificRequirement')}
            multiline={true}
            placeholder={t('common.notSpecified')}
          />
        </div>

        {req.notes && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('common.notes')}</p>
            <InlineEditField
              value={req.notes}
              onSave={val => patchRequirement({ notes: val })}
              canEdit={editAllowed}
              label={t('common.notes')}
              multiline={true}
            />
          </div>
        )}
      </Card>

      {/* Información de la norma */}
      {(() => {
        const hasNormData = !!(req.normName || req.normObjective || req.applicabilityJustification || req.applicabilityScope);
        return (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
            <button
              onClick={() => setNormExpanded(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-50"
              style={{ background: 'var(--color-bg)' }}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {t('requirements.normInfo.sectionTitle')}
                </span>
                {hasNormData && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{t('requirements.normInfo.completed')}</span>
                )}
                {!editAllowed && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('common.readOnly')}</span>
                )}
              </div>
              <ChevronDown
                className="w-4 h-4 transition-transform"
                style={{ color: 'var(--color-text-muted)', transform: normExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {normExpanded && (
              <div className="px-5 py-4 border-t space-y-5" style={{ borderColor: 'var(--color-border)' }}>
                {[
                  { key: 'normName',                    label: t('requirements.normInfo.normName'),                    multiline: false },
                  { key: 'normObjective',               label: t('requirements.normInfo.normObjective'),               multiline: true  },
                  { key: 'applicabilityJustification',  label: t('requirements.normInfo.applicabilityJustification'),  multiline: true  },
                  { key: 'applicabilityScope',          label: t('requirements.normInfo.applicabilityScope'),          multiline: true  },
                ].map(({ key, label, multiline }) => (
                  <div key={key}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                    <InlineEditField
                      value={req[key]}
                      onSave={val => patchRequirement({ [key]: val })}
                      canEdit={editAllowed}
                      label={label}
                      multiline={multiline}
                      placeholder={t('common.notSpecified')}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Activities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold font-display">{t('requirements.activities.title')}</h2>
          <Button size="sm" onClick={() => setShowActivityModal(true)}><Plus className="w-3.5 h-3.5" /> {t('common.add')}</Button>
        </div>
        {req.activities.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">{t('requirements.activities.noActivities')}</p>
        ) : (
          <div className="space-y-3">
            {req.activities.map((act) => {
              const isCompleted = act.activityStatus === 'COMPLETED';
              return (
                <div key={act.id} className={`flex items-start gap-3 p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-[var(--color-border)]'}`}>
                  <button onClick={() => toggleActivity(act)} className="mt-0.5 flex-shrink-0" title={isCompleted ? t('common.pending') : t('common.completed')}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-gray-400" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${isCompleted ? 'line-through text-[var(--color-text-muted)]' : ''}`}>{act.description}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t('requirements.dueDate')}: {formatDate(act.dueDate)} · {act.user?.name}</p>
                    {act.notes && <p className="text-xs text-[var(--color-text-muted)] mt-1">{act.notes}</p>}
                  </div>
                  <button onClick={() => deleteActivity(act.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Evidences */}
      <Card>
        <h2 className="font-semibold font-display mb-4">Evidencias</h2>
        <FileUploader
          onUpload={load}
          entityField="requirementId"
          entityId={id}
          existingFiles={req.evidences}
        />
      </Card>

      {/* Activity modal */}
      <Modal isOpen={showActivityModal} onClose={() => setShowActivityModal(false)} title={t('requirements.activities.add')} size="sm">
        <form onSubmit={saveActivity} className="space-y-4">
          <Textarea label={t('requirements.activities.description')} required value={activityForm.description} onChange={(e) => setActivityForm(f => ({ ...f, description: e.target.value }))} />
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t('requirements.dueDate')} <span className="text-red-500">*</span></label>
            <input type="date" value={activityForm.dueDate} onChange={(e) => setActivityForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" />
          </div>
          <Textarea label={t('common.notes')} value={activityForm.notes} onChange={(e) => setActivityForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowActivityModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={savingActivity}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
