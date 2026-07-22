import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Pencil, UserMinus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import InlineEditField from '../../components/ui/InlineEditField';
import ResponsibleSelector from '../../components/ui/ResponsibleSelector';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

// ── Constantes ────────────────────────────────────────────────────────────────

const BRIGADE_ORDER = ['FIRST_AID', 'EVACUATION', 'FIRE_FIGHTING'];

const BRIGADE_ICONS = {
  FIRST_AID:     '🚑',
  EVACUATION:    '🚶',
  FIRE_FIGHTING: '🔥',
};

const MEMBER_ROLE_ORDER = { COORDINATOR: 0, DEPUTY: 1, MEMBER: 2 };

const EMPTY_MEMBER_FORM = {
  employeeName: '', memberRole: 'MEMBER',
  certificationDate: '', certificationExpiry: '', notes: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCertificationStatus(expiryDate) {
  if (!expiryDate) return 'none';
  const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0)   return 'expired';
  if (days <= 30) return 'expiring';
  return 'valid';
}

function CertBadge({ expiryDate, t }) {
  const status = getCertificationStatus(expiryDate);
  const configs = {
    valid:    { cls: 'bg-green-100 text-green-800',   icon: <CheckCircle size={11} />, label: t('brigades.certStatus.valid') },
    expiring: { cls: 'bg-yellow-100 text-yellow-800', icon: <Clock size={11} />,       label: t('brigades.certStatus.expiring') },
    expired:  { cls: 'bg-red-100 text-red-800',       icon: <AlertCircle size={11} />, label: t('brigades.certStatus.expired') },
    none:     { cls: 'bg-gray-100 text-gray-500',     icon: null,                      label: t('brigades.certStatus.none') },
  };
  const { cls, icon, label } = configs[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {icon}{label}{status !== 'none' && expiryDate && ` · ${formatDate(expiryDate)}`}
    </span>
  );
}

function RoleBadge({ role, t }) {
  const styles = {
    COORDINATOR: 'bg-blue-100 text-blue-800',
    DEPUTY:      'bg-purple-100 text-purple-800',
    MEMBER:      'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[role] || styles.MEMBER}`}>
      {t(`brigades.memberRoles.${role}`)}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function BrigadesPage() {
  const { t } = useTranslation();
  const { canDelete } = usePermissions();
  const canEdit = canDelete(); // ADMIN y SH_SPECIALIST

  const [brigades, setBrigades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState('FIRST_AID');
  const [users, setUsers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalBrigadeType, setModalBrigadeType] = useState(null);
  const [editMemberId, setEditMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);
  const [saving, setSaving] = useState(false);

  const sectionRefs = useRef({});

  const load = async () => {
    try {
      const res = await api.get('/brigades');
      const sorted = BRIGADE_ORDER
        .map(type => res.data.find(b => b.type === type))
        .filter(Boolean);
      setBrigades(sorted);
    } catch { toast.error('Error al cargar brigadas'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (canEdit) api.get('/users/select').then(r => setUsers(r.data || [])).catch(() => {});
  }, []);

  const patchBrigade = async (type, fields) => {
    await api.put(`/brigades/${type}`, fields);
    setBrigades(prev => prev.map(b => b.type === type ? { ...b, ...fields } : b));
    toast.success(t('common.save'));
  };

  const openAddMember = (type) => {
    setModalBrigadeType(type);
    setEditMemberId(null);
    setMemberForm(EMPTY_MEMBER_FORM);
    setShowModal(true);
  };

  const openEditMember = (type, member) => {
    setModalBrigadeType(type);
    setEditMemberId(member.id);
    setMemberForm({
      employeeName:        member.employeeName || '',
      memberRole:          member.memberRole || 'MEMBER',
      certificationDate:   member.certificationDate ? member.certificationDate.slice(0, 10) : '',
      certificationExpiry: member.certificationExpiry ? member.certificationExpiry.slice(0, 10) : '',
      notes:               member.notes || '',
    });
    setShowModal(true);
  };

  const saveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.employeeName) return toast.error('Nombre del integrante requerido');
    setSaving(true);
    try {
      if (editMemberId) {
        await api.put(`/brigades/${modalBrigadeType}/members/${editMemberId}`, memberForm);
        toast.success('Integrante actualizado');
      } else {
        await api.post(`/brigades/${modalBrigadeType}/members`, memberForm);
        toast.success('Integrante agregado');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const deactivateMember = async (type, memberId) => {
    if (!confirm('¿Desactivar este integrante de la brigada?')) return;
    try {
      await api.delete(`/brigades/${type}/members/${memberId}`);
      toast.success('Integrante desactivado');
      load();
    } catch { toast.error('Error al desactivar'); }
  };

  const getBrigadeAlert = (brigade) => {
    if (!brigade?.members?.length) return null;
    const statuses = brigade.members.map(m => getCertificationStatus(m.certificationExpiry));
    if (statuses.some(s => s === 'expired'))  return 'expired';
    if (statuses.some(s => s === 'expiring')) return 'expiring';
    return null;
  };

  usePageHeader(t('brigades.title'));

  if (loading) return <div className="py-12 text-center text-[var(--color-text-muted)]">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {brigades.map(brigade => {
          const alert = getBrigadeAlert(brigade);
          return (
            <button
              key={brigade.type}
              onClick={() => {
                setExpanded(brigade.type);
                setTimeout(() => sectionRefs.current[brigade.type]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              className={`text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                expanded === brigade.type
                  ? 'border-[var(--color-primary)] bg-blue-50'
                  : 'border-[var(--color-border)] bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-2xl mb-2">{BRIGADE_ICONS[brigade.type]}</div>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {t(`brigades.types.${brigade.type}`)}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {brigade.members.length} {t('brigades.membersCount')}
                </span>
                {alert === 'expired'  && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Certificación vencida" />}
                {alert === 'expiring' && <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" title="Por vencer" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Acordeones */}
      {brigades.map(brigade => {
        const isExpanded = expanded === brigade.type;
        const sortedMembers = [...brigade.members].sort(
          (a, b) => (MEMBER_ROLE_ORDER[a.memberRole] ?? 2) - (MEMBER_ROLE_ORDER[b.memberRole] ?? 2)
        );
        const alert = getBrigadeAlert(brigade);

        return (
          <div
            key={brigade.type}
            ref={el => sectionRefs.current[brigade.type] = el}
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {/* Header acordeón */}
            <button
              onClick={() => setExpanded(isExpanded ? null : brigade.type)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              style={{ background: 'var(--color-bg)' }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl">{BRIGADE_ICONS[brigade.type]}</span>
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {t(`brigades.types.${brigade.type}`)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {brigade.members.length} {t('brigades.membersCount')}
                </span>
                {alert === 'expired'  && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Cert. vencida</span>}
                {alert === 'expiring' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Cert. por vencer</span>}
              </div>
              <ChevronDown
                size={16}
                className="flex-shrink-0 transition-transform"
                style={{ color: 'var(--color-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {isExpanded && (
              <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                {/* Punto de reunión + descripción */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      {t('brigades.meetingPoint')}
                    </p>
                    <InlineEditField
                      value={brigade.meetingPoint}
                      onSave={val => patchBrigade(brigade.type, { meetingPoint: val })}
                      canEdit={canEdit}
                      label={t('brigades.meetingPoint')}
                      multiline={false}
                      placeholder={t('brigades.noMeetingPoint')}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      {t('common.description')}
                    </p>
                    <InlineEditField
                      value={brigade.description}
                      onSave={val => patchBrigade(brigade.type, { description: val })}
                      canEdit={canEdit}
                      label={t('brigades.descriptionLabel')}
                      multiline={true}
                      placeholder={t('brigades.noDescription')}
                    />
                  </div>
                </div>

                {/* Tabla integrantes */}
                {sortedMembers.length === 0 ? (
                  <p className="text-sm text-center py-6 border border-dashed rounded-lg"
                     style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                    {t('brigades.noMembers')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                    <table className="w-full text-sm" style={{ background: 'var(--color-surface)' }}>
                      <thead>
                        <tr className="border-b text-xs font-semibold"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                          <th className="px-3 py-2 text-left">{t('brigades.memberRole')}</th>
                          <th className="px-3 py-2 text-left">{t('common.name')}</th>
                          <th className="px-3 py-2 text-left">Fecha del curso</th>
                          <th className="px-3 py-2 text-left">Vigencia</th>
                          {canEdit && <th className="px-3 py-2 w-20" />}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMembers.map(member => (
                          <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                              style={{ borderColor: 'var(--color-border)' }}>
                            <td className="px-3 py-2.5"><RoleBadge role={member.memberRole} t={t} /></td>
                            <td className="px-3 py-2.5 font-medium">{member.employeeName}</td>
                            <td className="px-3 py-2.5 text-[var(--color-text-muted)]">
                              {member.certificationDate ? formatDate(member.certificationDate) : '—'}
                            </td>
                            <td className="px-3 py-2.5"><CertBadge expiryDate={member.certificationExpiry} t={t} /></td>
                            {canEdit && (
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditMember(brigade.type, member)}
                                    className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title={t('common.edit')}>
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => deactivateMember(brigade.type, member.id)}
                                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Desactivar">
                                    <UserMinus size={13} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {canEdit && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => openAddMember(brigade.type)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                    >
                      <Plus size={13} /> {t('brigades.addMember')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal agregar/editar */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editMemberId ? t('brigades.editMember') : t('brigades.addMember')}
        size="md"
      >
        <form onSubmit={saveMember} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {t('common.name')} <span className="text-red-500">*</span>
            </label>
            <ResponsibleSelector
              value={memberForm.employeeName}
              onChange={val => setMemberForm(f => ({ ...f, employeeName: val }))}
              users={users}
              disabled={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('brigades.memberRole')} <span className="text-red-500">*</span>
              </label>
              <select value={memberForm.memberRole}
                onChange={e => setMemberForm(f => ({ ...f, memberRole: e.target.value }))}
                className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm"
                style={{ borderColor: 'var(--color-border)' }}>
                {['COORDINATOR', 'DEPUTY', 'MEMBER'].map(r => (
                  <option key={r} value={r}>{t(`brigades.memberRoles.${r}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('brigades.certificationDate')}</label>
              <input type="date" value={memberForm.certificationDate}
                onChange={e => setMemberForm(f => ({ ...f, certificationDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm"
                style={{ borderColor: 'var(--color-border)' }} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('brigades.certificationExpiry')}</label>
              <input type="date" value={memberForm.certificationExpiry}
                onChange={e => setMemberForm(f => ({ ...f, certificationExpiry: e.target.value }))}
                className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm"
                style={{ borderColor: 'var(--color-border)' }} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('common.notes')}</label>
            <textarea value={memberForm.notes}
              onChange={e => setMemberForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full px-3 py-2 border rounded-[var(--radius-sm)] text-sm resize-y"
              style={{ borderColor: 'var(--color-border)' }} />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
