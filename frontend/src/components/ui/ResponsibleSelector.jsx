import { useState } from 'react';

export default function ResponsibleSelector({ value, onChange, users = [], disabled }) {
  const [mode, setMode] = useState(() =>
    users.length > 0 && users.some(u => u.name === value) ? 'select' : 'free'
  );

  const handleToggle = () => {
    setMode(m => m === 'select' ? 'free' : 'select');
    onChange('');
  };

  return (
    <div className="flex gap-1.5 items-center">
      {mode === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 text-xs px-2 py-1.5 border rounded"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">— Seleccionar —</option>
          {users.map(u => (
            <option key={u.id} value={u.name}>
              {u.name}{u.area ? ` (${u.area})` : ''}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Responsable"
          className="flex-1 text-xs px-2 py-1.5 border rounded"
          style={{ borderColor: 'var(--color-border)' }}
        />
      )}
      {!disabled && (
        <button
          type="button"
          onClick={handleToggle}
          className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap px-1"
          title={mode === 'select' ? 'Escribir nombre libre' : 'Seleccionar de la lista'}
        >
          {mode === 'select' ? '✎' : '☰'}
        </button>
      )}
    </div>
  );
}
