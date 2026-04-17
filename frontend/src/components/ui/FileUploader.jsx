import { useState, useRef } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import api from '../../api/axios.config';
import toast from 'react-hot-toast';

export default function FileUploader({ onUpload, entityField, entityId, existingFiles = [] }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFiles = async (files) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} excede el límite de 10MB`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);
      if (entityField && entityId) formData.append(entityField, entityId);

      setUploading(true);
      setProgress(0);

      try {
        const res = await api.post('/requirements/evidences/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
        });
        onUpload?.(res.data);
        toast.success('Archivo subido correctamente');
      } catch {
        toast.error('Error al subir el archivo');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] p-8 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors"
      >
        <Upload className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Arrastra archivos aquí o <span className="text-[var(--color-primary)] font-medium">selecciona</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">JPG, PNG, PDF, DOCX, XLSX — máx. 10MB</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(Array.from(e.target.files))} />
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Subiendo...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {existingFiles.map((f) => (
            <EvidenceThumb key={f.id} evidence={f} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceThumb({ evidence, onDelete }) {
  const isImage = evidence.fileType === 'PHOTO';

  return (
    <div className="relative group border border-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden bg-gray-50">
      {isImage ? (
        <img src={evidence.fileUrl} alt={evidence.fileName} className="w-full h-24 object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center h-24 gap-1">
          <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-muted)] px-2 text-center truncate w-full text-center">{evidence.fileName}</span>
        </div>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(evidence)}
          className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export { EvidenceThumb };
