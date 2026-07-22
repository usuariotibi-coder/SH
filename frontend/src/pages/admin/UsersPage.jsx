import { useState, useEffect, useCallback } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/DatePicker';
import Badge from '../../components/ui/Badge';
import { roleLabels } from '../../utils/statusColors';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const ROLES = ['ADMIN', 'SH_SPECIALIST', 'AREA_MANAGER', 'AUDITOR', 'EXECUTIVE'];
const EMPTY = { email: '', name: '', password: '', role: 'AREA_MANAGER', area: '' };

export default function UsersPage() {
  const { t } = useTranslation();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/users', { params: { page, limit: 20 } }); setData(res.data); }
    catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (row) => { setForm({ ...row, password: '' }); setEditId(row.id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/users/${editId}`, form);
      else await api.post('/users', form);
      toast.success(editId ? t('users.edit') : t('users.new'));
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const toggleUser = async (id, current) => {
    try { await api.patch(`/users/${id}/toggle`); toast.success(current ? t('users.deactivate') : t('users.activate')); load(); }
    catch { toast.error('Error'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try { await api.delete(`/users/${id}`); toast.success(t('common.delete')); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const ROLE_COLORS = { ADMIN: 'bg-purple-100 text-purple-800', SH_SPECIALIST: 'bg-blue-100 text-blue-800', AREA_MANAGER: 'bg-green-100 text-green-800', AUDITOR: 'bg-yellow-100 text-yellow-800', EXECUTIVE: 'bg-gray-100 text-gray-800' };

  const columns = [
    { header: t('users.name'), accessor: 'name' },
    { header: t('users.email'), accessor: 'email', render: (v) => <span className="text-xs font-mono">{v}</span> },
    { header: t('users.role'), accessor: 'role', render: (v) => <Badge className={ROLE_COLORS[v]}>{t(`users.roles.${v}`) || v}</Badge> },
    { header: t('common.area'), accessor: 'area' },
    { header: t('common.status'), accessor: 'isActive', render: (v) => v ? <span className="text-green-600 text-xs font-medium">{t('common.activate')}</span> : <span className="text-red-500 text-xs font-medium">{t('common.deactivate')}</span> },
    { header: '', accessor: 'id', render: (v, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(row)} className="text-xs text-blue-600 hover:underline">{t('common.edit')}</button>
        <button onClick={() => toggleUser(v, row.isActive)} title={row.isActive ? t('common.deactivate') : t('common.activate')} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          {row.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
        </button>
        <button onClick={() => deleteUser(v)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  usePageHeader(t('users.title'), (
    <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> {t('users.new')}</Button>
  ));

  return (
    <div className="space-y-5">
      <Card padding={false}>
        <Table columns={columns} data={data.data} isLoading={loading} emptyMessage={t('common.noData')} />
        {data.totalPages > 1 && (
          <div className="p-4 flex items-center justify-between text-sm border-t border-[var(--color-border)]">
            <span className="text-[var(--color-text-muted)]">{t('common.page')} {data.page} {t('common.of')} {data.totalPages} — {data.total} {t('users.title').toLowerCase()}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('common.previous')}</Button>
              <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>{t('common.next')}</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? t('users.edit') : t('users.new')} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label={t('users.name')} required value={form.name} onChange={(e) => f('name', e.target.value)} />
          <Input label={t('users.email')} required type="email" value={form.email} onChange={(e) => f('email', e.target.value)} disabled={!!editId} />
          {!editId && <Input label={t('auth.password')} required type="password" value={form.password} onChange={(e) => f('password', e.target.value)} placeholder={t('users.passwordPlaceholder')} />}
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('users.role')} value={form.role} onChange={(e) => f('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
            </Select>
            <Input label={t('common.area')} value={form.area} onChange={(e) => f('area', e.target.value)} placeholder={t('users.areaPlaceholder')} />
          </div>
          <div className="flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving}>{t('common.save')}</Button></div>
        </form>
      </Modal>
    </div>
  );
}
