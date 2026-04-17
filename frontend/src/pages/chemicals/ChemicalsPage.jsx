import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Upload, Trash2, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const GHS_CLASSES = ['Explosivo', 'Inflamable', 'Oxidante', 'Gas a presión', 'Corrosivo', 'Tóxico', 'Nocivo', 'Peligro ambiental', 'Peligro salud grave'];

const WASTE_STATES = ['SOLID', 'LIQUID', 'SLUDGE', 'GAS'];

const EMPTY_PRODUCT = { tradeName: '', chemicalName: '', casNumber: '', manufacturer: '', supplierId: '', physicalState: '', storageLocation: '', maxStockKg: '', notes: '', ghsHazardClasses: [] };
const EMPTY_DISPOSAL = { disposalDate: '', wasteType: '', wasteState: 'SOLID', quantityKg: '', manifestNumber: '', transportCompany: '', disposalMethod: '', notes: '', supplierId: '', productId: '' };

export default function ChemicalsPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);

  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [editDisposal, setEditDisposal] = useState(null);
  const [disposalForm, setDisposalForm] = useState(EMPTY_DISPOSAL);

  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null); // { productId, fileType }
  const fileInputRef = useRef(null);

  const loadAll = useCallback(async () => {
    try {
      const [pRes, dRes, sRes] = await Promise.all([
        api.get('/chemicals'),
        api.get('/hazmat'),
        api.get('/suppliers', { params: { status: 'ACTIVE' } }),
      ]);
      setProducts(pRes.data);
      setDisposals(dRes.data);
      setSuppliers(sRes.data);
    } catch { toast.error(t('common.loadError')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        await api.put(`/chemicals/${editProduct.id}`, productForm);
        toast.success(t('chemicals.productUpdated'));
      } else {
        await api.post('/chemicals', productForm);
        toast.success(t('chemicals.productCreated'));
      }
      setShowProductModal(false);
      setEditProduct(null);
      setProductForm(EMPTY_PRODUCT);
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const handleSaveDisposal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editDisposal) {
        await api.put(`/hazmat/${editDisposal.id}`, disposalForm);
        toast.success(t('chemicals.disposalUpdated'));
      } else {
        await api.post('/hazmat', disposalForm);
        toast.success(t('chemicals.disposalCreated'));
      }
      setShowDisposalModal(false);
      setEditDisposal(null);
      setDisposalForm(EMPTY_DISPOSAL);
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const triggerUpload = (productId, fileType) => {
    setUploadingFile({ productId, fileType });
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingFile) return;
    const { productId, fileType } = uploadingFile;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    try {
      await api.post(`/chemicals/${productId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('chemicals.fileUploaded'));
      loadAll();
    } catch { toast.error(t('common.saveError')); }
    setUploadingFile(null);
    e.target.value = '';
  };

  const deleteFile = async (productId, fileType) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await api.delete(`/chemicals/${productId}/files/${fileType}`);
      toast.success(t('common.deleted'));
      loadAll();
    } catch { toast.error(t('common.saveError')); }
  };

  const toggleGhs = (cls) => {
    setProductForm(p => ({
      ...p,
      ghsHazardClasses: p.ghsHazardClasses.includes(cls)
        ? p.ghsHazardClasses.filter(c => c !== cls)
        : [...p.ghsHazardClasses, cls],
    }));
  };

  const fp = (k, v) => setProductForm(p => ({ ...p, [k]: v }));
  const fd = (k, v) => setDisposalForm(p => ({ ...p, [k]: v }));

  const noSdsCount = products.filter(p => !p.hasSds).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('chemicals.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('chemicals.subtitle')}</p>
        </div>
        {canWrite() && (
          <Button
            onClick={() => tab === 'products'
              ? (setEditProduct(null), setProductForm(EMPTY_PRODUCT), setShowProductModal(true))
              : (setEditDisposal(null), setDisposalForm(EMPTY_DISPOSAL), setShowDisposalModal(true))
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />{tab === 'products' ? t('chemicals.newProduct') : t('chemicals.newDisposal')}
          </Button>
        )}
      </div>

      {noSdsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle size={18} className="text-orange-600 shrink-0" />
          <span className="text-sm text-orange-800">{t('chemicals.noSdsAlert', { count: noSdsCount })}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['products', 'hazmat'].map(t2 => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t(`chemicals.tabs.${t2}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>
      ) : tab === 'products' ? (
        /* Products */
        <div className="space-y-3">
          {products.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">{t('chemicals.emptyProducts')}</Card>
          ) : products.map(p => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{p.tradeName}</span>
                    {p.chemicalName && <span className="text-sm text-gray-500">({p.chemicalName})</span>}
                    {!p.hasSds && <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">{t('chemicals.noSds')}</span>}
                  </div>
                  {p.casNumber && <div className="text-xs text-gray-500 mt-0.5">CAS: {p.casNumber}</div>}
                  {p.ghsHazardClasses?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.ghsHazardClasses.map(c => <span key={c} className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">{c}</span>)}
                    </div>
                  )}
                  {p.storageLocation && <div className="text-xs text-gray-500 mt-1">{t('chemicals.fields.storageLocation')}: {p.storageLocation}</div>}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {/* SDS file */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">SDS</div>
                    {p.files?.find(f => f.fileType === 'SDS') ? (
                      <div className="flex items-center gap-1">
                        <a href={p.files.find(f => f.fileType === 'SDS').fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <FileText size={16} />
                        </a>
                        {canWrite() && <button onClick={() => deleteFile(p.id, 'SDS')} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                      </div>
                    ) : canWrite() ? (
                      <button onClick={() => triggerUpload(p.id, 'SDS')} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Upload size={16} />
                      </button>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </div>

                  {/* Label file */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{t('chemicals.label')}</div>
                    {p.files?.find(f => f.fileType === 'LABEL') ? (
                      <div className="flex items-center gap-1">
                        <a href={p.files.find(f => f.fileType === 'LABEL').fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <FileText size={16} />
                        </a>
                        {canWrite() && <button onClick={() => deleteFile(p.id, 'LABEL')} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                      </div>
                    ) : canWrite() ? (
                      <button onClick={() => triggerUpload(p.id, 'LABEL')} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Upload size={16} />
                      </button>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </div>

                  {canWrite() && (
                    <Button size="sm" variant="ghost" onClick={() => { setEditProduct(p); setProductForm({ tradeName: p.tradeName, chemicalName: p.chemicalName || '', casNumber: p.casNumber || '', manufacturer: p.manufacturer || '', supplierId: p.supplierId || '', physicalState: p.physicalState || '', storageLocation: p.storageLocation || '', maxStockKg: p.maxStockKg || '', notes: p.notes || '', ghsHazardClasses: p.ghsHazardClasses || [] }); setShowProductModal(true); }}>
                      {t('common.edit')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Hazmat Disposals */
        <div className="space-y-3">
          {disposals.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">{t('chemicals.emptyDisposals')}</Card>
          ) : disposals.map(d => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{d.folio}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">{d.wasteState}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-0.5">{d.wasteType} — {d.quantityKg} kg</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDate(d.disposalDate)}
                    {d.transportCompany && ` · ${d.transportCompany}`}
                    {d.product && ` · ${d.product.tradeName}`}
                  </div>
                </div>
                {canWrite() && (
                  <Button size="sm" variant="ghost" onClick={() => { setEditDisposal(d); setDisposalForm({ disposalDate: d.disposalDate?.slice(0, 10) || '', wasteType: d.wasteType, wasteState: d.wasteState, quantityKg: d.quantityKg, manifestNumber: d.manifestNumber || '', transportCompany: d.transportCompany || '', disposalMethod: d.disposalMethod || '', notes: d.notes || '', supplierId: d.supplierId || '', productId: d.productId || '' }); setShowDisposalModal(true); }}>
                    {t('common.edit')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">{editProduct ? t('chemicals.editProduct') : t('chemicals.newProductTitle')}</h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.tradeName')} *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.tradeName} onChange={e => fp('tradeName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.chemicalName')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.chemicalName} onChange={e => fp('chemicalName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.casNumber')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.casNumber} onChange={e => fp('casNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.manufacturer')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.manufacturer} onChange={e => fp('manufacturer', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.physicalState')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.physicalState} onChange={e => fp('physicalState', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.storageLocation')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.storageLocation} onChange={e => fp('storageLocation', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.maxStockKg')}</label>
                  <input type="number" min="0" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productForm.maxStockKg} onChange={e => fp('maxStockKg', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('chemicals.fields.ghsHazardClasses')}</label>
                  <div className="flex flex-wrap gap-2">
                    {GHS_CLASSES.map(c => (
                      <button key={c} type="button" onClick={() => toggleGhs(c)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${productForm.ghsHazardClasses.includes(c) ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disposal Modal */}
      {showDisposalModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editDisposal ? t('chemicals.editDisposal') : t('chemicals.newDisposalTitle')}</h2>
              <button onClick={() => setShowDisposalModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveDisposal} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.disposalDate')} *</label>
                  <input required type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.disposalDate} onChange={e => fd('disposalDate', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.wasteState')} *</label>
                  <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.wasteState} onChange={e => fd('wasteState', e.target.value)}>
                    {WASTE_STATES.map(s => <option key={s} value={s}>{t(`chemicals.wasteStates.${s}`)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.wasteType')} *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.wasteType} onChange={e => fd('wasteType', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.quantityKg')} *</label>
                  <input required type="number" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.quantityKg} onChange={e => fd('quantityKg', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.manifestNumber')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.manifestNumber} onChange={e => fd('manifestNumber', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.transportCompany')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.transportCompany} onChange={e => fd('transportCompany', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.disposalMethod')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.disposalMethod} onChange={e => fd('disposalMethod', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.product')}</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.productId} onChange={e => fd('productId', e.target.value)}>
                    <option value="">{t('common.none')}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.tradeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('chemicals.fields.disposalSupplier')}</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={disposalForm.supplierId} onChange={e => fd('supplierId', e.target.value)}>
                    <option value="">{t('common.none')}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={disposalForm.notes} onChange={e => fd('notes', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowDisposalModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
