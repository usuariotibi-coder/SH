import { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/auth.store';
import usePageHeaderStore from '../../store/pageHeader.store';
import { roleLabels } from '../../utils/statusColors';

export default function Topbar({ onMenuToggle, alertCount = 0 }) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const title = usePageHeaderStore((s) => s.title);
  const actions = usePageHeaderStore((s) => s.actions);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleLang = () => {
    const next = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(next);
    localStorage.setItem('sh_language', next);
  };

  return (
    <header className="h-14 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-4 gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuToggle} className="p-2 rounded-md hover:bg-gray-100 text-[var(--color-text-muted)] md:hidden">
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-base font-semibold font-display text-[var(--color-text)] truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        {actions && <div className="w-px h-6 bg-[var(--color-border)] mx-1" />}

        {/* Language */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium text-[var(--color-text-muted)] transition-colors"
          title={i18n.language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          {i18n.language === 'es' ? '🇲🇽 ES' : '🇺🇸 EN'}
        </button>

        {/* Alerts bell */}
        <button className="relative p-2 rounded-md hover:bg-gray-100 text-[var(--color-text-muted)] transition-colors">
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[var(--color-text)] leading-none">{user?.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{roleLabels[user?.role] || user?.role}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] py-1">
              <div className="px-3 py-2 border-b border-[var(--color-border)]">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
