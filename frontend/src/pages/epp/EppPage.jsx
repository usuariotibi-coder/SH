import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import api from '../../api/axios.config';

const MOVEMENT_TYPE_COLORS = {
  ENTRY:      'bg-green-100 text-green-800',
  EXIT:       'bg-red-100 text-red-800',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
  RETURN:     'bg-blue-100 text-blue-800',
};

const EMPTY_ITEM = { name: '', category: '', description: '', unit: 'pieza', minStock: 0, currentStock: 0, partNumber: '', brand: '' };
const EMPTY_MOV = { type: 'EXIT', quantity: 1, employeeName: '', employeeArea: '', reason: '' };
const EMPTY_MATRIX = { areaName: '', mandatory: true, notes: '' };

export default function EppPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();
  const [tab, setTab] = useState('inventory');
  const [items, setItems] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);

  const [showMovModal, setShowMovModal] = useState(null); // item id
  const [movForm, setMovForm] = useState(EMPTY_MOV);

  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixItems, setMatrixItems] = useState([]);
  const [matrixForm, setMatrixForm] = useState({ eppItemId: '', ...EMPTY_MATRIX });

  const [saving, setSaving] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/epp');
      setItems(res.data);
    } catch { toast.error(t('common.loadError')); }
  }, [t]);

  const loadMatrix = useCallback(async () => {
    try {
      const res = await api.get('/epp/matrix');
      setMatrix(res.data);
    } catch { toast.error(t('common.loadError')); }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadItems(), loadMatrix()]).finally(() => setLoading(false));
  }, [loadItems, loadMatrix]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/epp/${editItem.id}`, itemForm);
        toast.success(t('epp.itemUpdated'));
      } else {
        await api.post('/epp', itemForm);
        toast.success(t('epp.itemCreated'));
      }
      setShowItemModal(false);
      setEditItem(null);
      setItemForm(EMPTY_ITEM);
      loadItems();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/epp/${showMovModal}/movements`, movForm);
      toast.success(t('epp.movementRegistered'));
      setShowMovModal(null);
      setMovForm(EMPTY_MOV);
      loadItems();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const handleMatrixEntry = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/epp/matrix', matrixForm);
      toast.success(t('epp.matrixUpdated'));
      setShowMatrixModal(false);
      setMatrixForm({ eppItemId: '', ...EMPTY_MATRIX });
      loadMatrix();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const deleteMatrixEntry = async (entryId) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await api.delete(`/epp/matrix/${entryId}`);
      toast.success(t('common.deleted'));
      loadMatrix();
    } catch { toast.error(t('common.saveError')); }
  };

  const f = (setter) => (k, v) => setter(p => ({ ...p, [k]: v }));
  const fi = f(setItemForm);
  const fm = f(setMovForm);
  const fmx = f(setMatrixForm);

  const lowStockCount = items.filter(i => i.isLowStock).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('epp.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('epp.subtitle')}</p>
        </div>
        {canWrite() && (
          <div className="flex gap-2">
            {tab === 'inventory' && (
              <Button onClick={() => { setEditItem(null); setItemForm(EMPTY_ITEM); setShowItemModal(true); }} className="flex items-center gap-2">
                <Plus size={16} />{t('epp.newItem')}
              </Button>
            )}
            {tab === 'matrix' && (
              <Button onClick={() => { setMatrixItems(items); setShowMatrixModal(true); }} className="flex items-center gap-2">
                <Plus size={16} />{t('epp.addMatrixEntry')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle size={18} className="text-orange-600 shrink-0" />
          <span className="text-sm text-orange-800">{t('epp.lowStockAlert', { count: lowStockCount })}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['inventory', 'matrix'].map(t2 => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t(`epp.tabs.${t2}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>
      ) : tab === 'inventory' ? (
        /* Inventory tab */
        <div className="space-y-3">
          {items.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">{t('epp.emptyInventory')}</Card>
          ) : items.map(item => (
            <Card key={item.id} className={`p-4 ${item.isLowStock ? 'border-l-4 border-l-orange-400' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{item.category}</span>
                    {item.isLowStock && <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full"><TrendingDown size={11} />{t('epp.lowStock')}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>{t('epp.stock')}: <strong className={item.isLowStock ? 'text-orange-600' : 'text-gray-900'}>{item.currentStock}</strong> / min: {item.minStock} {item.unit}</span>
                    {item.brand && <span>{item.brand}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canWrite() && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setShowMovModal(item.id)}>{t('epp.movement')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditItem(item); setItemForm({ name: item.name, category: item.category, description: item.description || '', unit: item.unit, minStock: item.minStock, partNumber: item.partNumber || '', brand: item.brand || '' }); setShowItemModal(true); }}>{t('common.edit')}</Button>
                    </>
                  )}
                  <button onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)} className="text-xs text-blue-600 hover:underline">
                    {expandedItem === item.id ? t('common.hide') : t('epp.history')}
                  </button>
                </div>
              </div>

              {/* Movement history */}
              {expandedItem === item.id && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {item.movements?.length === 0 ? (
                    <p className="text-xs text-gray-400">{t('epp.noMovements')}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {item.movements?.map(mov => (
                        <div key={mov.id} className="flex items-center gap-3 text-xs text-gray-600">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${MOVEMENT_TYPE_COLORS[mov.type]}`}>{mov.type}</span>
                          <span>{mov.quantity} {item.unit}</span>
                          <span className="text-gray-400">→ saldo: {mov.balanceAfter}</span>
                          {mov.employeeName && <span>{mov.employeeName}</span>}
                          <span className="text-gray-400 ml-auto">{formatDate(mov.date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        /* Matrix tab */
        <div className="space-y-4">
          {Object.keys(matrix).length === 0 ? (
            <Card className="p-8 text-center text-gray-400">{t('epp.emptyMatrix')}</Card>
          ) : Object.entries(matrix).map(([area, entries]) => (
            <Card key={area} className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{area}</h3>
              <div className="space-y-2">
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{entry.eppItem?.name}</span>
                      {entry.mandatory && <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">{t('epp.mandatory')}</span>}
                      {entry.notes && <span className="text-xs text-gray-500">{entry.notes}</span>}
                    </div>
                    {canWrite() && (
                      <button onClick={() => deleteMatrixEntry(entry.id)} className="text-xs text-red-600 hover:underline">{t('common.delete')}</button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editItem ? t('epp.editItem') : t('epp.newItemTitle')}</h2>
              <button onClick={() => setShowItemModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.name')} *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.name} onChange={e => fi('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.category')} *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.category} onChange={e => fi('category', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.unit')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.unit} onChange={e => fi('unit', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.minStock')}</label>
                  <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.minStock} onChange={e => fi('minStock', e.target.value)} />
                </div>
                {!editItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.currentStock')}</label>
                    <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.currentStock} onChange={e => fi('currentStock', e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.brand')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.brand} onChange={e => fi('brand', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.partNumber')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={itemForm.partNumber} onChange={e => fi('partNumber', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{t('epp.registerMovement')}</h2>
              <button onClick={() => setShowMovModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleMovement} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.movType')} *</label>
                  <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={movForm.type} onChange={e => fm('type', e.target.value)}>
                    {['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'].map(v => <option key={v} value={v}>{t(`epp.movTypes.${v}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.quantity')} *</label>
                  <input required type="number" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={movForm.quantity} onChange={e => fm('quantity', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.employeeName')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={movForm.employeeName} onChange={e => fm('employeeName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.employeeArea')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={movForm.employeeArea} onChange={e => fm('employeeArea', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.reason')}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={movForm.reason} onChange={e => fm('reason', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowMovModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matrix Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{t('epp.addMatrixEntryTitle')}</h2>
              <button onClick={() => setShowMatrixModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleMatrixEntry} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.eppItem')} *</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={matrixForm.eppItemId} onChange={e => fmx('eppItemId', e.target.value)}>
                  <option value="">{t('common.select')}</option>
                  {matrixItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.areaName')} *</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={matrixForm.areaName} onChange={e => fmx('areaName', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="mandatory" checked={matrixForm.mandatory} onChange={e => fmx('mandatory', e.target.checked)} className="rounded" />
                <label htmlFor="mandatory" className="text-sm text-gray-700">{t('epp.mandatoryLabel')}</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={matrixForm.notes} onChange={e => fmx('notes', e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowMatrixModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? t('common.saving') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
