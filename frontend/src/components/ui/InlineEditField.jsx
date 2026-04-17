import { useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

export default function InlineEditField({ value, onSave, canEdit, label, multiline = false, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setDraft(value || '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (draft === (value || '')) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') handleCancel();
  };

  if (!editing) {
    return (
      <div className="group relative">
        <p className={`text-sm leading-relaxed pr-6 ${!value ? 'italic' : ''}`} style={{ color: value ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
          {value || placeholder || 'No especificado'}
        </p>
        {canEdit && (
          <button
            onClick={handleEdit}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            title={`Editar ${label || ''}`}
            type="button"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          autoFocus
          className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
        />
      ) : (
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full border border-blue-400 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Guardar
        </button>
        <button
          onClick={handleCancel}
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <X size={12} /> Cancelar
        </button>
      </div>
    </div>
  );
}
