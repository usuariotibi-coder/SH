import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { formatDate } from '../../utils/formatDate';

const DOC_TYPES = ['SUA', 'REPSE', 'DC3', 'IMSS_ALTA', 'ACTA_CONSTITUTIVA', 'POLIZA_SEGURO', 'CONTRATO_SERVICIOS', 'OPINION_SAT', 'OTHER'];

const DOC_LABELS = {
  SUA: 'SUA (Comprobante IMSS)',
  REPSE: 'REPSE',
  DC3: 'DC-3 (Capacitación)',
  IMSS_ALTA: 'Alta IMSS',
  ACTA_CONSTITUTIVA: 'Acta Constitutiva',
  POLIZA_SEGURO: 'Póliza de Seguro',
  CONTRATO_SERVICIOS: 'Contrato de Servicios',
  OPINION_SAT: 'Opinión SAT',
  OTHER: 'Otro documento',
};

const DOC_STATUS_CONFIG = {
  PENDING:  { cls: 'bg-gray-100 text-gray-600',    icon: null, label: 'Pendiente' },
  UPLOADED: { cls: 'bg-blue-100 text-blue-800',    icon: null, label: 'En revisión' },
  APPROVED: { cls: 'bg-green-100 text-green-800',  icon: <CheckCircle size={12} />, label: 'Aprobado' },
  REJECTED: { cls: 'bg-red-100 text-red-800',      icon: <AlertCircle size={12} />, label: 'Rechazado' },
  EXPIRED:  { cls: 'bg-orange-100 text-orange-800', icon: <AlertCircle size={12} />, label: 'Expirado' },
};

export default function SupplierPortalPage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(null);
  const fileRefs = useRef({});

  useEffect(() => {
    axios.get(`/api/portal/${token}`)
      .then(r => setInfo(r.data))
      .catch(e => setError(e.response?.data?.message || 'Enlace inválido o expirado'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpload = async (docType, file) => {
    if (!file) return;
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const res = await axios.post(`/api/portal/${token}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setInfo(prev => {
        const docs = prev.documents.filter(d => d.docType !== docType || d.id === res.data.id);
        const existing = docs.find(d => d.id === res.data.id);
        if (existing) return { ...prev, documents: docs.map(d => d.id === res.data.id ? res.data : d) };
        return { ...prev, documents: [...docs, res.data] };
      });

      toast.success(`${DOC_LABELS[docType]} enviado correctamente`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir archivo');
    } finally {
      setUploading(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Cargando...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Enlace inválido</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-xl font-bold text-gray-900">Portal de Documentos</h1>
          <p className="text-sm text-gray-500 mt-1">{info.supplierName}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>Instrucciones:</strong> Por favor sube los documentos requeridos en formato PDF. Los documentos serán revisados por nuestro equipo.
        </div>

        {DOC_TYPES.map(dt => {
          const doc = info.documents?.find(d => d.docType === dt);
          const status = doc?.status || 'PENDING';
          const cfg = DOC_STATUS_CONFIG[status];

          return (
            <div key={dt} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{DOC_LABELS[dt]}</div>
                    {doc?.fileName && <div className="text-xs text-gray-500 mt-0.5">{doc.fileName}</div>}
                    {doc?.uploadedAt && <div className="text-xs text-gray-500">Subido el {formatDate(doc.uploadedAt)}</div>}
                    {doc?.expiresAt && <div className="text-xs text-gray-500">Vence el {formatDate(doc.expiresAt)}</div>}
                    {doc?.reviewNotes && status === 'REJECTED' && (
                      <div className="text-xs text-red-600 mt-1">Observación: {doc.reviewNotes}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.cls}`}>
                    {cfg.icon}{cfg.label}
                  </span>
                  {status !== 'APPROVED' && (
                    <>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        ref={el => fileRefs.current[dt] = el}
                        className="hidden"
                        onChange={e => handleUpload(dt, e.target.files[0])}
                      />
                      <button
                        onClick={() => fileRefs.current[dt]?.click()}
                        disabled={uploading === dt}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Upload size={14} />
                        {uploading === dt ? 'Subiendo...' : doc ? 'Actualizar' : 'Subir'}
                      </button>
                    </>
                  )}
                  {doc?.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Ver
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
