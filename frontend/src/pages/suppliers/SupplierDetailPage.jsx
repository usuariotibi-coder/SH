import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2, RefreshCw, XCircle, Upload, CheckCircle, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const DOC_TYPES = ['SUA', 'REPSE', 'DC3', 'IMSS_ALTA', 'ACTA_CONSTITUTIVA', 'POLIZA_SEGURO', 'CONTRATO_SERVICIOS', 'OPINION_SAT', 'OTHER'];

const DOC_STATUS_CONFIG = {
  PENDING:  { cls: 'bg-gray-100 text-gray-600',    label: 'Pendiente' },
  UPLOADED: { cls: 'bg-blue-100 text-blue-800',    label: 'Subido' },
  APPROVED: { cls: 'bg-green-100 text-green-800',  label: 'Aprobado' },
  REJECTED: { cls: 'bg-red-100 text-red-800',      label: 'Rechazado' },
  EXPIRED:  { cls: 'bg-orange-100 text-orange-800', label: 'Expirado' },
};

function DocStatusBadge({ status }) {
  const cfg = DOC_STATUS_CONFIG[status] || DOC_STATUS_CONFIG.PENDING;
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cfg.cls}`}>{cfg.label}</span>;
}

export default function SupplierDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { canWrite } = usePermissions();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalUrl, setPortalUrl] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [reviewModal, setReviewModal] = useState(null); // { docId, action }
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/suppliers/${id}`);
      setSupplier(res.data);
      if (res.data.accessToken?.isActive) {
        const origin = window.location.origin;
        setPortalUrl(`${origin}/portal/${res.data.accessToken.token}`);
      } else {
        setPortalUrl('');
      }
    } catch { toast.error(t('common.loadError')); }
    finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const generateToken = async () => {
    setGeneratingToken(true);
    try {
      await api.post(`/suppliers/${id}/token`);
      toast.success(t('suppliers.portal.generated'));
      load();
    } catch { toast.error(t('common.saveError')); }
    finally { setGeneratingToken(false); }
  };

  const revokeToken = async () => {
    if (!confirm(t('suppliers.portal.revokeConfirm'))) return;
    try {
      await api.delete(`/suppliers/${id}/token`);
      toast.success(t('suppliers.portal.revoked'));
      load();
    } catch { toast.error(t('common.saveError')); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success(t('suppliers.portal.copied'));
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    setSaving(true);
    try {
      await api.put(`/suppliers/documents/${reviewModal.docId}/review`, {
        status: reviewModal.action,
        reviewNotes,
      });
      toast.success(reviewModal.action === 'APPROVED' ? t('suppliers.docs.approved') : t('suppliers.docs.rejected'));
      setReviewModal(null);
      setReviewNotes('');
      load();
    } catch { toast.error(t('common.saveError')); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/suppliers/${id}`, editForm);
      toast.success(t('suppliers.updated'));
      setEditForm(null);
      load();
    } catch { toast.error(t('common.saveError')); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>;
  if (!supplier) return <div className="p-8 text-center text-gray-400">{t('suppliers.notFound')}</div>;

  const STATUS_COLORS = { ACTIVE: 'bg-green-100 text-green-800', INACTIVE: 'bg-gray-100 text-gray-600', SUSPENDED: 'bg-red-100 text-red-800' };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/suppliers')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{supplier.rfc}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[supplier.status]}`}>
              {t(`suppliers.status.${supplier.status}`)}
            </span>
          </div>
        </div>
        {canWrite() && (
          <Button variant="secondary" onClick={() => setEditForm({ ...supplier })}>
            {t('common.edit')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">{t('suppliers.info.title')}</h2>
          {[
            ['contactName', t('suppliers.fields.contactName')],
            ['phone', t('suppliers.fields.phone')],
            ['email', t('suppliers.fields.email')],
            ['city', t('suppliers.fields.city')],
            ['state', t('suppliers.fields.state')],
            ['productsServices', t('suppliers.fields.productsServices')],
          ].map(([field, label]) => supplier[field] ? (
            <div key={field}>
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-sm text-gray-900">{supplier[field]}</div>
            </div>
          ) : null)}
        </Card>

        {/* Documents */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">{t('suppliers.docs.title')}</h2>
          <div className="space-y-2">
            {DOC_TYPES.map(dt => {
              const doc = supplier.documents?.find(d => d.docType === dt);
              return (
                <div key={dt} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 w-40">{dt}</span>
                    <DocStatusBadge status={doc?.status || 'PENDING'} />
                    {doc?.expiresAt && (
                      <span className="text-xs text-gray-500">vence {formatDate(doc.expiresAt)}</span>
                    )}
                  </div>
                  {doc && doc.status === 'UPLOADED' && canWrite() && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewModal({ docId: doc.id, action: 'APPROVED' })}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title={t('suppliers.docs.approve')}
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => setReviewModal({ docId: doc.id, action: 'REJECTED' })}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title={t('suppliers.docs.reject')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {doc?.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-2">
                      {t('common.view')}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Portal Access */}
      {canWrite() && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{t('suppliers.portal.title')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('suppliers.portal.description')}</p>
          {portalUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Link2 size={16} className="text-blue-600 shrink-0" />
                <span className="text-sm text-gray-700 flex-1 break-all">{portalUrl}</span>
                <button onClick={copyLink} className="text-xs text-blue-600 hover:underline shrink-0">{t('suppliers.portal.copy')}</button>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={generateToken} disabled={generatingToken}>
                  <RefreshCw size={14} className="mr-1" />{t('suppliers.portal.regenerate')}
                </Button>
                <Button variant="danger" size="sm" onClick={revokeToken}>
                  <XCircle size={14} className="mr-1" />{t('suppliers.portal.revoke')}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={generateToken} disabled={generatingToken}>
              <Link2 size={16} className="mr-2" />{t('suppliers.portal.generate')}
            </Button>
          )}
        </Card>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {reviewModal.action === 'APPROVED' ? t('suppliers.docs.approve') : t('suppliers.docs.reject')}
            </h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.docs.reviewNotes')}</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setReviewModal(null); setReviewNotes(''); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
              <button
                onClick={handleReview}
                disabled={saving}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${reviewModal.action === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {saving ? t('common.saving') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{t('suppliers.editTitle')}</h2>
              <button onClick={() => setEditForm(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['name', t('suppliers.fields.name'), true], ['rfc', t('suppliers.fields.rfc'), true], ['contactName', t('suppliers.fields.contactName'), false], ['phone', t('suppliers.fields.phone'), false], ['email', t('suppliers.fields.email'), false], ['city', t('suppliers.fields.city'), false], ['state', t('suppliers.fields.state'), false]].map(([k, label, req]) => (
                  <div key={k} className={k === 'name' || k === 'rfc' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input required={req} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm[k] || ''} onChange={e => setEditForm(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('suppliers.fields.status')}</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                    {['ACTIVE', 'INACTIVE', 'SUSPENDED'].map(s => <option key={s} value={s}>{t(`suppliers.status.${s}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setEditForm(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
