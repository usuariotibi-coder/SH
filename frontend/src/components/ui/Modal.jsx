import { X } from 'lucide-react';
import { useEffect } from 'react';

const SIZES = {
  sm:   'max-w-md',
  md:   'max-w-xl',
  lg:   'max-w-3xl',
  xl:   'max-w-5xl',
  full: 'max-w-7xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/50">
      <div
        className={`relative bg-white rounded-[var(--radius-lg)] shadow-xl w-full my-8 flex flex-col ${SIZES[size] || SIZES.md}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] sticky top-0 bg-white rounded-t-[var(--radius-lg)] z-10">
          <h2 className="text-lg font-semibold text-[var(--color-text)] font-display">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-[var(--color-text-muted)]">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body con scroll */}
        <div className="overflow-y-auto flex-1 p-6 max-h-[calc(100vh-200px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
