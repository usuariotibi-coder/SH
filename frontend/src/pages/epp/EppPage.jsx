import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, AlertTriangle, TrendingDown, Pencil, Trash2, ChevronDown, ChevronRight, ArrowDownToLine, ArrowUpFromLine, Download, Upload, CheckCircle, XCircle, PackageCheck, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatDate';
import usePermissions from '../../hooks/usePermissions';
import usePageHeader from '../../hooks/usePageHeader';
import api from '../../api/axios.config';

const FREQ_OPTIONS = [
  { value: '1',  label: '1 mes' },
  { value: '3',  label: '3 meses' },
  { value: '6',  label: '6 meses' },
  { value: '12', label: '12 meses' },
];

const MOVEMENT_TYPE_COLORS = {
  ENTRY:      'bg-green-100 text-green-800',
  EXIT:       'bg-red-100 text-red-800',
  ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
  RETURN:     'bg-blue-100 text-blue-800',
};

const EMPTY_ITEM   = { name: '', category: '', description: '', unit: 'pieza', minStock: 0, maxStock: 0, currentStock: 0, partNumber: '', brand: '' };
const EMPTY_ENTRY = { eppItemId: '', quantity: 1, supplier: '', price: '' };
const EMPTY_EXIT  = { eppItemId: '', quantity: 1, puesto: '', solicitante: '' };
const EMPTY_MATRIX = { eppItemId: '', areaName: '', mandatory: true, notes: '', userCount: 1, changeFrequency: '' };
const EMPTY_LOAN_ITEM = { eppItemId: '', quantity: 1 };

const INP = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function EppPage() {
  const { t } = useTranslation();
  const { canWrite } = usePermissions();

  const [tab, setTab]       = useState('inventory');
  const [items, setItems]   = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loans, setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Loan modal
  const [showLoanModal, setShowLoanModal]   = useState(false);
  const [loanForm, setLoanForm]             = useState({ employeeName: '', employeeArea: '', notes: '', items: [{ ...EMPTY_LOAN_ITEM }] });
  const [loanSaving, setLoanSaving]         = useState(false);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem]           = useState(null);
  const [itemForm, setItemForm]           = useState(EMPTY_ITEM);

  // Entradas / Salidas modal  (movModalType = 'ENTRY' | 'EXIT' | null)
  const [movModalType, setMovModalType] = useState(null);
  const [movTab, setMovTab]             = useState('manual'); // 'manual' | 'csv'
  const [entryForm, setEntryForm]       = useState(EMPTY_ENTRY);
  const [exitForm,  setExitForm]        = useState(EMPTY_EXIT);
  const [csvRows,   setCsvRows]         = useState([]);   // parsed rows preview
  const [csvErrors, setCsvErrors]       = useState([]);   // import result errors
  const [csvSuccess, setCsvSuccess]     = useState(null); // import result count
  const fileInputRef = useRef(null);

  // Matrix modal
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [editMatrixEntry, setEditMatrixEntry] = useState(null);
  const [matrixForm, setMatrixForm]           = useState(EMPTY_MATRIX);

  const [saving, setSaving]           = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);

  // ── Data loaders ─────────────────────────────────────────────────────────────

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

  const loadLoans = useCallback(async () => {
    try {
      const res = await api.get('/epp/loans?active=true');
      setLoans(res.data);
    } catch { toast.error(t('common.loadError')); }
  }, [t]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadItems(), loadMatrix(), loadLoans()]).finally(() => setLoading(false));
  }, [loadItems, loadMatrix, loadLoans]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

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

  const openMovModal = (type) => {
    setMovModalType(type);
    setMovTab('manual');
    setEntryForm(EMPTY_ENTRY);
    setExitForm(EMPTY_EXIT);
    setCsvRows([]);
    setCsvErrors([]);
    setCsvSuccess(null);
  };

  const closeMovModal = () => {
    setMovModalType(null);
    setCsvRows([]);
    setCsvErrors([]);
    setCsvSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualMovement = async (e) => {
    e.preventDefault();
    const form = movModalType === 'ENTRY' ? entryForm : exitForm;
    if (!form.eppItemId) return toast.error('Selecciona un artículo EPP');
    setSaving(true);
    try {
      const payload = movModalType === 'ENTRY'
        ? { type: 'ENTRY', quantity: form.quantity, supplier: form.supplier, price: form.price || undefined }
        : { type: 'EXIT',  quantity: form.quantity, employeeName: form.solicitante, employeeArea: form.puesto };
      await api.post(`/epp/${form.eppItemId}/movements`, payload);
      toast.success(movModalType === 'ENTRY' ? 'Entrada registrada' : 'Salida registrada');
      closeMovModal();
      loadItems();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  // ── CSV helpers ──────────────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const isEntry = movModalType === 'ENTRY';
    const headers = isEntry
      ? 'Articulo,Cantidad,Proveedor,Precio'
      : 'Articulo,Cantidad,Puesto,Solicitante';
    const example = isEntry
      ? `${items[0]?.name || 'Casco de seguridad'},10,Proveedor Ejemplo,250.00`
      : `${items[0]?.name || 'Casco de seguridad'},2,Operador,Juan Pérez`;
    const csv  = `${headers}\n${example}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = isEntry ? 'plantilla_entradas_epp.csv' : 'plantilla_salidas_epp.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = line.split(',').map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      setCsvRows(rows);
      setCsvErrors([]);
      setCsvSuccess(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleBulkImport = async () => {
    if (!csvRows.length) return toast.error('Carga un archivo CSV primero');
    setSaving(true);
    setCsvErrors([]);
    setCsvSuccess(null);
    try {
      const res = await api.post('/epp/bulk-movements', { type: movModalType, movements: csvRows });
      setCsvSuccess(res.data.success);
      setCsvErrors(res.data.errors || []);
      if (res.data.success > 0) {
        toast.success(`${res.data.success} movimiento(s) registrado(s)`);
        loadItems();
      }
      if (res.data.errors?.length) toast.error(`${res.data.errors.length} fila(s) con error`);
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
      setEditMatrixEntry(null);
      setMatrixForm(EMPTY_MATRIX);
      loadMatrix();
      loadItems();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setSaving(false); }
  };

  const deleteMatrixEntry = async (entryId) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await api.delete(`/epp/matrix/${entryId}`);
      toast.success(t('common.deleted'));
      loadMatrix();
      loadItems();
    } catch { toast.error(t('common.saveError')); }
  };

  // ── Loan handlers ────────────────────────────────────────────────────────

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const validItems = loanForm.items.filter(i => i.eppItemId && Number(i.quantity) > 0);
    if (!loanForm.employeeName) return toast.error('Nombre del solicitante requerido');
    if (!validItems.length) return toast.error('Agrega al menos un artículo');
    setLoanSaving(true);
    try {
      await api.post('/epp/loans', { ...loanForm, items: validItems });
      toast.success('Préstamo registrado y alerta generada');
      setShowLoanModal(false);
      setLoanForm({ employeeName: '', employeeArea: '', notes: '', items: [{ ...EMPTY_LOAN_ITEM }] });
      loadLoans();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
    finally { setLoanSaving(false); }
  };

  const handleReturnLoan = async (loanId, personName) => {
    if (!confirm(`¿Marcar como devuelto el préstamo de ${personName}?`)) return;
    try {
      await api.put(`/epp/loans/${loanId}/return`);
      toast.success('Préstamo marcado como devuelto');
      loadLoans();
    } catch (err) { toast.error(err.response?.data?.message || t('common.saveError')); }
  };

  const addLoanItem = () =>
    setLoanForm(p => ({ ...p, items: [...p.items, { ...EMPTY_LOAN_ITEM }] }));

  const removeLoanItem = (idx) =>
    setLoanForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const updateLoanItem = (idx, field, val) =>
    setLoanForm(p => ({
      ...p,
      items: p.items.map((item, i) => i === idx ? { ...item, [field]: val } : item),
    }));

  const openAddMatrix = () => {
    setEditMatrixEntry(null);
    setMatrixForm(EMPTY_MATRIX);
    setShowMatrixModal(true);
  };

  const openEditMatrix = (entry) => {
    setEditMatrixEntry(entry);
    setMatrixForm({
      eppItemId:       entry.eppItem?.id || '',
      areaName:        entry.areaName,
      mandatory:       entry.mandatory,
      notes:           entry.notes || '',
      userCount:       entry.userCount ?? 1,
      changeFrequency: entry.changeFrequency || '',
    });
    setShowMatrixModal(true);
  };

  const openEditItem = (item) => {
    setEditItem(item);
    setItemForm({
      name:        item.name,
      category:    item.category,
      description: item.description || '',
      unit:        item.unit,
      minStock:    item.minStock,
      maxStock:    item.maxStock || 0,
      partNumber:  item.partNumber || '',
      brand:       item.brand || '',
    });
    setShowItemModal(true);
  };

  const lowStockCount = items.filter(i => i.isLowStock).length;

  const headerAction =
    (canWrite() && tab === 'inventory') ? (
      <Button size="sm" onClick={() => { setEditItem(null); setItemForm(EMPTY_ITEM); setShowItemModal(true); }} className="flex items-center gap-2">
        <Plus size={16} />{t('epp.newItem')}
      </Button>
    ) : (canWrite() && tab === 'matrix') ? (
      <Button size="sm" onClick={openAddMatrix} className="flex items-center gap-2">
        <Plus size={16} />{t('epp.addMatrixEntry')}
      </Button>
    ) : (tab === 'loans') ? (
      <Button size="sm" onClick={() => setShowLoanModal(true)} className="flex items-center gap-2">
        <Plus size={16} /> Nuevo préstamo
      </Button>
    ) : null;

  usePageHeader(t('epp.title'), headerAction);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertTriangle size={18} className="text-orange-600 shrink-0" />
          <span className="text-sm text-orange-800">{t('epp.lowStockAlert', { count: lowStockCount })}</span>
        </div>
      )}

      {/* Tabs + Entradas / Salidas */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex">
          {[
            { key: 'inventory', label: t('epp.tabs.inventory') },
            { key: 'matrix',    label: t('epp.tabs.matrix') },
            { key: 'loans',     label: 'Préstamo' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {key === 'loans' && loans.length > 0 && (
                <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  {loans.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => openMovModal('ENTRY')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowDownToLine size={14} /> Entradas
          </button>
          <button
            onClick={() => openMovModal('EXIT')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowUpFromLine size={14} /> Salidas
          </button>
        </div>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">{t('common.loading')}</div>

      ) : tab === 'inventory' ? (

        /* ── Inventario ── */
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">{t('epp.emptyInventory')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuarios</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Máx</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Mín</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor FIFO</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <>
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.isLowStock ? 'bg-orange-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          {item.isLowStock && (
                            <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                              <TrendingDown size={10} /> Bajo stock
                            </span>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.totalUsers ?? 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.maxStock ?? 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{item.minStock}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${item.isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.inventoryValue > 0
                          ? <span className="font-medium text-gray-800">${item.inventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canWrite() && (
                            <button
                              onClick={() => openEditItem(item)}
                              className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title={t('common.edit')}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Historial de movimientos"
                          >
                            {expandedItem === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedItem === item.id && (
                      <tr key={`${item.id}-hist`}>
                        <td colSpan={7} className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Historial de movimientos</p>
                          {!item.movements?.length ? (
                            <p className="text-xs text-gray-400">{t('epp.noMovements')}</p>
                          ) : (
                            <div className="space-y-1.5">
                              {item.movements.map(mov => (
                                <div key={mov.id} className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                                  <span className={`px-1.5 py-0.5 rounded font-medium ${MOVEMENT_TYPE_COLORS[mov.type]}`}>{mov.type}</span>
                                  <span>{mov.quantity} {item.unit}</span>
                                  <span className="text-gray-400">→ saldo: {mov.balanceAfter}</span>
                                  {mov.employeeName && <span className="font-medium">{mov.employeeName}</span>}
                                  {mov.employeeArea  && <span className="text-gray-500">{mov.employeeArea}</span>}
                                  {mov.supplier      && <span className="text-gray-500">Prov: {mov.supplier}</span>}
                                  {mov.price         && <span className="text-green-700 font-medium">${Number(mov.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}/u</span>}
                                  <span className="text-gray-400 ml-auto">{formatDate(mov.date)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

      ) : tab === 'matrix' ? (

        /* ── Matriz EPP ── */
        <div className="space-y-4">
          {Object.keys(matrix).length === 0 ? (
            <div className="p-8 text-center text-gray-400 border border-dashed border-gray-300 rounded-xl">
              {t('epp.emptyMatrix')}
            </div>
          ) : Object.entries(matrix).map(([area, entries]) => (
            <div key={area} className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{area}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wider bg-white">
                    <th className="px-4 py-2 text-left">EPP</th>
                    <th className="px-4 py-2 text-center">Usuarios</th>
                    <th className="px-4 py-2 text-center">Frecuencia cambio</th>
                    <th className="px-4 py-2 text-center">Obligatorio</th>
                    <th className="px-4 py-2 text-left">Notas</th>
                    {canWrite() && <th className="px-4 py-2 w-20" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{entry.eppItem?.name}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">{entry.userCount ?? 1}</td>
                      <td className="px-4 py-2.5 text-center text-gray-600">
                        {entry.changeFrequency
                          ? `${entry.changeFrequency} mes${entry.changeFrequency !== '1' ? 'es' : ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {entry.mandatory
                          ? <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">{t('epp.mandatory')}</span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{entry.notes || '—'}</td>
                      {canWrite() && (
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEditMatrix(entry)}
                              className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title={t('common.edit')}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteMatrixEntry(entry.id)}
                              className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title={t('common.delete')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

      ) : tab === 'loans' ? (

        /* ── Préstamo tab ── */
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border border-dashed border-gray-300 rounded-xl gap-3">
              <PackageCheck size={40} className="text-gray-300" />
              <p className="text-sm">No hay préstamos activos</p>
            </div>
          ) : loans.map(loan => (
            <div key={loan.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
              {/* Loan header */}
              <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <PackageCheck size={18} className="text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{loan.employeeName}</p>
                    {loan.employeeArea && <p className="text-xs text-gray-500">{loan.employeeArea}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Fecha de préstamo</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(loan.loanDate)}</p>
                  </div>
                  <button
                    onClick={() => handleReturnLoan(loan.id, loan.employeeName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Undo2 size={13} /> Devolver
                  </button>
                </div>
              </div>
              {/* Items */}
              <div className="px-5 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-2 text-left">Artículo</th>
                      <th className="pb-2 text-center w-24">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loan.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-2 text-gray-800">{item.eppItem.name}</td>
                        <td className="py-2 text-center text-gray-600">
                          {item.quantity} <span className="text-gray-400">{item.eppItem.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loan.notes && (
                  <p className="mt-2 text-xs text-gray-500 italic">Nota: {loan.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>

      ) : null }

      {/* ── Modal: Artículo EPP ── */}
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
                  <input required className={INP} value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.category')} *</label>
                  <input required className={INP} value={itemForm.category} onChange={e => setItemForm(p => ({ ...p, category: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.unit')}</label>
                  <input className={INP} value={itemForm.unit} onChange={e => setItemForm(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input type="number" min="0" className={INP} value={itemForm.minStock} onChange={e => setItemForm(p => ({ ...p, minStock: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock máximo</label>
                  <input type="number" min="0" className={INP} value={itemForm.maxStock} onChange={e => setItemForm(p => ({ ...p, maxStock: e.target.value }))} />
                </div>
                {!editItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.currentStock')}</label>
                    <input type="number" min="0" className={INP} value={itemForm.currentStock} onChange={e => setItemForm(p => ({ ...p, currentStock: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.brand')}</label>
                  <input className={INP} value={itemForm.brand} onChange={e => setItemForm(p => ({ ...p, brand: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.partNumber')}</label>
                  <input className={INP} value={itemForm.partNumber} onChange={e => setItemForm(p => ({ ...p, partNumber: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Entradas / Salidas ── */}
      {movModalType && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">

            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b rounded-t-xl ${movModalType === 'ENTRY' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {movModalType === 'ENTRY'
                  ? <ArrowDownToLine size={18} className="text-green-700" />
                  : <ArrowUpFromLine size={18} className="text-red-700" />}
                <h2 className="text-lg font-semibold">
                  {movModalType === 'ENTRY' ? 'Registrar entrada de EPP' : 'Registrar salida de EPP'}
                </h2>
              </div>
              <button onClick={closeMovModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-gray-200 px-5 pt-3">
              {['manual', 'csv'].map(tb => (
                <button
                  key={tb}
                  onClick={() => { setMovTab(tb); setCsvRows([]); setCsvErrors([]); setCsvSuccess(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px mr-2 transition-colors ${movTab === tb ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tb === 'manual' ? 'Registro manual' : 'Importar CSV'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {movTab === 'manual' ? (

                /* ── Manual form ── */
                <form onSubmit={handleManualMovement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Artículo EPP *</label>
                    <select
                      required className={INP}
                      value={movModalType === 'ENTRY' ? entryForm.eppItemId : exitForm.eppItemId}
                      onChange={e => movModalType === 'ENTRY'
                        ? setEntryForm(p => ({ ...p, eppItemId: e.target.value }))
                        : setExitForm(p => ({ ...p, eppItemId: e.target.value }))}
                    >
                      <option value="">Selecciona un artículo...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} — stock: {i.currentStock} {i.unit}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                      <input required type="number" min="1" className={INP}
                        value={movModalType === 'ENTRY' ? entryForm.quantity : exitForm.quantity}
                        onChange={e => movModalType === 'ENTRY'
                          ? setEntryForm(p => ({ ...p, quantity: e.target.value }))
                          : setExitForm(p => ({ ...p, quantity: e.target.value }))} />
                    </div>

                    {movModalType === 'ENTRY' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                          <input className={INP} value={entryForm.supplier} onChange={e => setEntryForm(p => ({ ...p, supplier: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario</label>
                          <input type="number" min="0" step="0.01" className={INP} value={entryForm.price} onChange={e => setEntryForm(p => ({ ...p, price: e.target.value }))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Puesto</label>
                          <input className={INP} value={exitForm.puesto} onChange={e => setExitForm(p => ({ ...p, puesto: e.target.value }))} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                          <input className={INP} value={exitForm.solicitante} onChange={e => setExitForm(p => ({ ...p, solicitante: e.target.value }))} />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t">
                    <button type="button" onClick={closeMovModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                    <button type="submit" disabled={saving}
                      className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${movModalType === 'ENTRY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                      {saving ? t('common.saving') : movModalType === 'ENTRY' ? t('epp.registerEntry') : t('epp.registerExit')}
                    </button>
                  </div>
                </form>

              ) : (

                /* ── CSV import ── */
                <div className="space-y-4">
                  {/* Download template */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Plantilla CSV</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Columnas: {movModalType === 'ENTRY'
                          ? 'Articulo, Cantidad, Proveedor, Precio'
                          : 'Articulo, Cantidad, Puesto, Solicitante'}
                        <span className="ml-1 text-blue-400">(fecha automática)</span>
                      </p>
                    </div>
                    <button onClick={downloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                      <Download size={14} /> Descargar
                    </button>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo CSV</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <Upload size={14} />
                        Cargar archivo
                        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                      </label>
                      {csvRows.length > 0 && (
                        <span className="text-sm text-gray-600">{csvRows.length} fila(s) detectada(s)</span>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {csvRows.length > 0 && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vista previa</div>
                      <div className="overflow-x-auto max-h-40 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>{Object.keys(csvRows[0]).map(h => <th key={h} className="px-3 py-1.5 text-left text-gray-500 font-medium">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {csvRows.slice(0, 5).map((row, i) => (
                              <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="px-3 py-1.5 text-gray-700">{v}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                        {csvRows.length > 5 && <p className="text-xs text-gray-400 px-3 py-1.5">… y {csvRows.length - 5} fila(s) más</p>}
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {(csvSuccess !== null || csvErrors.length > 0) && (
                    <div className="space-y-2">
                      {csvSuccess > 0 && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <CheckCircle size={14} /> {csvSuccess} movimiento(s) registrado(s) correctamente
                        </div>
                      )}
                      {csvErrors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <XCircle size={14} className="mt-0.5 shrink-0" /> {err}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2 border-t">
                    <button type="button" onClick={closeMovModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                    <button
                      onClick={handleBulkImport}
                      disabled={saving || csvRows.length === 0}
                      className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${movModalType === 'ENTRY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {saving ? 'Importando...' : `Importar ${csvRows.length} fila(s)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Matriz EPP ── */}
      {showMatrixModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                {editMatrixEntry ? 'Editar requerimiento' : t('epp.addMatrixEntryTitle')}
              </h2>
              <button onClick={() => setShowMatrixModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleMatrixEntry} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.fields.eppItem')} *</label>
                <select
                  required
                  className={INP}
                  value={matrixForm.eppItemId}
                  onChange={e => setMatrixForm(p => ({ ...p, eppItemId: e.target.value }))}
                  disabled={!!editMatrixEntry}
                >
                  <option value="">{t('common.select')}</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.areaName')} / Puesto *</label>
                <input
                  required
                  className={INP}
                  value={matrixForm.areaName}
                  onChange={e => setMatrixForm(p => ({ ...p, areaName: e.target.value }))}
                  disabled={!!editMatrixEntry}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuarios (personal)</label>
                  <input
                    type="number" min="1"
                    className={INP}
                    value={matrixForm.userCount}
                    onChange={e => setMatrixForm(p => ({ ...p, userCount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de cambio</label>
                  <select
                    className={INP}
                    value={matrixForm.changeFrequency}
                    onChange={e => setMatrixForm(p => ({ ...p, changeFrequency: e.target.value }))}
                  >
                    <option value="">Sin especificar</option>
                    {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="mandatory"
                  checked={matrixForm.mandatory}
                  onChange={e => setMatrixForm(p => ({ ...p, mandatory: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="mandatory" className="text-sm text-gray-700">{t('epp.mandatoryLabel')}</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
                <input
                  className={INP}
                  value={matrixForm.notes}
                  onChange={e => setMatrixForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowMatrixModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Nuevo Préstamo ── */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-blue-600" />
                <h2 className="text-lg font-semibold">{t('epp.loan.title')}</h2>
              </div>
              <button onClick={() => setShowLoanModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Solicitante */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.loan.employeeName')} *</label>
                  <input
                    required className={INP} placeholder={t('epp.loan.employeeNamePlaceholder')}
                    value={loanForm.employeeName}
                    onChange={e => setLoanForm(p => ({ ...p, employeeName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.loan.area')}</label>
                  <input
                    className={INP} placeholder={t('epp.loan.areaPlaceholder')}
                    value={loanForm.employeeArea}
                    onChange={e => setLoanForm(p => ({ ...p, employeeArea: e.target.value }))}
                  />
                </div>
              </div>

              {/* Artículos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">{t('epp.loan.itemsLabel')} *</label>
                  <button
                    type="button" onClick={addLoanItem}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> {t('epp.loan.addItem')}
                  </button>
                </div>
                <div className="space-y-2">
                  {loanForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className={`${INP} flex-1 min-w-0`}
                        value={item.eppItemId}
                        onChange={e => updateLoanItem(idx, 'eppItemId', e.target.value)}
                      >
                        <option value="">{t('epp.loan.selectItem')}</option>
                        {items.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                      <input
                        type="number" min="1"
                        className={`${INP} !w-16 flex-shrink-0`}
                        value={item.quantity}
                        onChange={e => updateLoanItem(idx, 'quantity', e.target.value)}
                      />
                      {loanForm.items.length > 1 && (
                        <button
                          type="button" onClick={() => removeLoanItem(idx)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('epp.loan.notes')}</label>
                <input
                  className={INP} placeholder={t('epp.loan.notesPlaceholder')}
                  value={loanForm.notes}
                  onChange={e => setLoanForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>

              {/* Info alerta */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                {t('epp.loan.alertMessage')}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button" onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit" disabled={loanSaving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loanSaving ? t('epp.loan.saving') : t('epp.loan.register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
