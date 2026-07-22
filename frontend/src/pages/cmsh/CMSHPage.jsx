import { useState, useEffect } from 'react';
import { Plus, Users2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/DatePicker';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const ROLES = ['PRESIDENT', 'SECRETARY', 'WORKER_REP', 'EMPLOYER_REP'];

const EMPTY_MEMBER = { name: '', position: '', cmshRole: 'WORKER_REP', email: '', phone: '', startDate: '', endDate: '' };
const EMPTY_MEETING = { meetingDate: '', location: '', agenda: '', agreements: '', attendees: '', nextMeeting: '' };

export default function CMSHPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tab, setTab] = useState('members');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER);
  const [meetingForm, setMeetingForm] = useState(EMPTY_MEETING);
  const [saving, setSaving] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);
  const [editMeetingId, setEditMeetingId] = useState(null);

  const loadMembers = () => api.get('/cmsh/members').then(r => setMembers(r.data)).catch(() => toast.error('Error al cargar integrantes'));
  const loadMeetings = () => api.get('/cmsh/meetings').then(r => setMeetings(r.data)).catch(() => toast.error('Error al cargar actas'));

  useEffect(() => { loadMembers(); loadMeetings(); }, []);

  const saveMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMemberId) await api.put(`/cmsh/members/${editMemberId}`, memberForm);
      else await api.post('/cmsh/members', memberForm);
      toast.success(t('common.save'));
      setShowMemberModal(false);
      loadMembers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const saveMeeting = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMeetingId) await api.put(`/cmsh/meetings/${editMeetingId}`, meetingForm);
      else await api.post('/cmsh/meetings', meetingForm);
      toast.success(t('common.save'));
      setShowMeetingModal(false);
      loadMeetings();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const memberColumns = [
    { header: t('common.name'), accessor: 'name' },
    { header: t('cmsh.position'), accessor: 'position' },
    { header: t('cmsh.roleLabel'), accessor: 'cmshRole', render: (v) => t(`cmsh.roles.${v}`) },
    { header: t('cmsh.validity'), accessor: 'startDate', render: (v, row) => `${formatDate(v)} — ${row.endDate ? formatDate(row.endDate) : t('cmsh.active')}` },
    { header: t('users.isActive'), accessor: 'isActive', render: (v) => v ? <span className="text-green-600 text-xs font-medium">{t('common.yes')}</span> : <span className="text-gray-400 text-xs">{t('common.no')}</span> },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => { setMemberForm({ ...row, startDate: row.startDate?.slice(0, 10), endDate: row.endDate?.slice(0, 10) || '' }); setEditMemberId(v); setShowMemberModal(true); }} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={async () => { await api.delete(`/cmsh/members/${v}`); loadMembers(); }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  const meetingColumns = [
    { header: t('common.date'), accessor: 'meetingDate', render: (v) => formatDate(v) },
    { header: t('cmsh.location'), accessor: 'location' },
    { header: t('cmsh.nextMeeting'), accessor: 'nextMeeting', render: (v) => formatDate(v) },
    { header: '', accessor: 'id', render: (v, row) => canWrite() && (
      <div className="flex gap-2">
        <button onClick={() => { setMeetingForm({ ...row, meetingDate: row.meetingDate?.slice(0, 10), nextMeeting: row.nextMeeting?.slice(0, 10) || '' }); setEditMeetingId(v); setShowMeetingModal(true); }} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={async () => { await api.delete(`/cmsh/meetings/${v}`); loadMeetings(); }} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
      </div>
    )},
  ];

  const mf = (k, v) => setMemberForm(p => ({ ...p, [k]: v }));
  const mef = (k, v) => setMeetingForm(p => ({ ...p, [k]: v }));

  usePageHeader(t('cmsh.title'), canWrite() && (
    tab === 'members' ? (
      <Button size="sm" onClick={() => { setMemberForm(EMPTY_MEMBER); setEditMemberId(null); setShowMemberModal(true); }}><Plus className="w-3.5 h-3.5" /> {t('cmsh.newMember')}</Button>
    ) : (
      <Button size="sm" onClick={() => { setMeetingForm(EMPTY_MEETING); setEditMeetingId(null); setShowMeetingModal(true); }}><Plus className="w-3.5 h-3.5" /> {t('cmsh.newMeeting')}</Button>
    )
  ));

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {[{ key: 'members', label: t('cmsh.members'), icon: Users2 }, { key: 'meetings', label: t('cmsh.meetings'), icon: FileText }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <Card padding={false}>
          <Table columns={memberColumns} data={members} emptyMessage={t('common.noData')} />
        </Card>
      )}

      {tab === 'meetings' && (
        <Card padding={false}>
          <Table columns={meetingColumns} data={meetings} emptyMessage={t('common.noData')} />
        </Card>
      )}

      {/* Member modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title={editMemberId ? t('common.edit') : t('cmsh.newMember')} size="md">
        <form onSubmit={saveMember} className="space-y-4">
          <Input label={t('common.name')} required value={memberForm.name} onChange={(e) => mf('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('cmsh.position')} required value={memberForm.position} onChange={(e) => mf('position', e.target.value)} />
            <Select label={t('cmsh.roleLabel')} required value={memberForm.cmshRole} onChange={(e) => mf('cmshRole', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{t(`cmsh.roles.${r}`)}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('users.email')} type="email" value={memberForm.email} onChange={(e) => mf('email', e.target.value)} />
            <Input label={t('cmsh.phone')} value={memberForm.phone} onChange={(e) => mf('phone', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium block">{t('cmsh.startDate')} <span className="text-red-500">*</span></label>
              <input type="date" value={memberForm.startDate} onChange={(e) => mf('startDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
            <div className="space-y-1"><label className="text-sm font-medium block">{t('cmsh.endDate')}</label>
              <input type="date" value={memberForm.endDate} onChange={(e) => mf('endDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowMemberModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>

      {/* Meeting modal */}
      <Modal isOpen={showMeetingModal} onClose={() => setShowMeetingModal(false)} title={editMeetingId ? t('common.edit') : t('cmsh.newMeeting')} size="lg">
        <form onSubmit={saveMeeting} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium block">{t('common.date')} <span className="text-red-500">*</span></label>
              <input type="date" value={meetingForm.meetingDate} onChange={(e) => mef('meetingDate', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
            <Input label={t('cmsh.location')} required value={meetingForm.location} onChange={(e) => mef('location', e.target.value)} />
          </div>
          <Textarea label={t('cmsh.agenda')} required value={meetingForm.agenda} onChange={(e) => mef('agenda', e.target.value)} rows={4} />
          <Textarea label={t('cmsh.agreements')} value={meetingForm.agreements} onChange={(e) => mef('agreements', e.target.value)} rows={3} />
          <Textarea label={t('cmsh.attendees')} value={meetingForm.attendees} onChange={(e) => mef('attendees', e.target.value)} rows={2} />
          <div className="space-y-1"><label className="text-sm font-medium block">{t('cmsh.nextMeeting')}</label>
            <input type="date" value={meetingForm.nextMeeting} onChange={(e) => mef('nextMeeting', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm" /></div>
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowMeetingModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
