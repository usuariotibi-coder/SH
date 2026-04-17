import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage('sh_sidebar_collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">
      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </div>

      {/* Sidebar móvil — drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 flex-shrink-0 h-full">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onNavClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setMobileOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
