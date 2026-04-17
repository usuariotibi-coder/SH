import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-800',
};

const DOC_STATUS_COLORS = {
  PENDING: 'bg-gray-100 text-gray-600',
  UPLOADED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const REQUIRED_DOCS = ['SUA', 'REPSE', 'OPINION_SAT'];

function DocStatusBadge({ documents, t }) {
  const required = REQUIRED_DOCS.map(dt => {
    const doc = documents?.find(d => d.docType === dt);
    return { type: dt, status: doc?.status || 'PENDING' };
  });
  const allOk = required.every(d => d.status === 'APPROVED');
  const anyExpired = required.some(d => d.status === 'EXPIRED');
  const anyRejected = required.some(d => d.status === 'REJECTED');

  let label = t('suppliers.docs.partial');
  let cls = 'bg-yellow-100 text-yellow-800';
  if (allOk) { label = t('suppliers.docs.complete'); cls = 'bg-green-100 text-green-800'; }
  else if (anyExpired) { label = t('suppliers.docs.expired'); cls = 'bg-orange-100 text-orange-800'; }
  else if (anyRejected) { label = t('suppliers.docs.rejected'); cls = 'bg-red-100 text-red-800'; }

  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{label}</span>;
}

export default function SuppliersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canWrite } = usePermissions();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', rfc: '', contactName: '', phone: '', email: '', city: '', state: '', productsServices: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { search: search || undefined, status: statusFilter || undefined } });
      setSuppliers(res.data);
    } catch { toast.error(t('common.loadError')); }
    finally { setLoading(false); }
  }, [search, statusFilter, t]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/suppliers', form);
      toast.success(t('suppliers.created'));
      setShowModal(false);
      setForm({ name: '', rfc: '', contactName: '', phone: '', email: '', city: '', state: '', productsServices: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('suppliers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('suppliers.subtitle')}</p>
        </div>
        {canWrite() && (
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus size={16} />{t('suppliers.new')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('suppliers.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">{t('suppliers.allStatuses')}</option>
          <option value="ACTIVE">{t('suppliers.status.ACTIVE')}</option>
          <option value="INACTIVE">{t('suppliers.status.INACTIVE')}</option>
          <option value="SUSPENDED">{t('suppliers.status.SUSPENDED')}</option>
        </select>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t('suppliers.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('suppliers.table.name')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('suppliers.table.rfc')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('suppliers.table.contact')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('suppliers.table.documents')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('suppliers.table.status')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/suppliers/${s.id}`)}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      {s.city && <div className="text-xs text-gray-500">{s.city}{s.state ? `, ${s.state}` : ''}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.rfc}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{s.contactName}</div>
                      {s.email && <div className="text-xs text-gray-500">{s.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <DocStatusBadge documents={s.documents} t={t} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`suppliers.status.${s.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ExternalLink size={16} className="text-gray-400 hover:text-blue-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{t('suppliers.newTitle')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.name')} *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => f('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.rfc')} *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.rfc} onChange={e => f('rfc', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.contactName')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.contactName} onChange={e => f('contactName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.phone')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.phone} onChange={e => f('phone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.email')}</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => f('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.city')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.city} onChange={e => f('city', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.state')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.state} onChange={e => f('state', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.productsServices')}</label>
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={form.productsServices} onChange={e => f('productsServices', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
