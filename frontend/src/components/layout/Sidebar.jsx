import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FileText, AlertTriangle, Users2, GraduationCap,
  Siren, FlaskConical, Wrench, ShieldAlert, ClipboardCheck, BookOpen,
  Users, Building2, Shield, HelpCircle, CalendarDays,
  PanelLeftClose, PanelLeftOpen, UsersRound, Truck, HardHat, Beaker,
} from 'lucide-react';
import usePermissions from '../../hooks/usePermissions';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { path: '/calendar', icon: CalendarDays, key: 'calendar' },
  { path: '/requirements', icon: FileText, key: 'requirements' },
  { path: '/incidents', icon: AlertTriangle, key: 'incidents' },
  { path: '/cmsh', icon: Users2, key: 'cmsh' },
  { path: '/brigades', icon: UsersRound, key: 'brigades' },
  { path: '/training', icon: GraduationCap, key: 'training' },
  { path: '/drills', icon: Siren, key: 'drills' },
  { path: '/five-s', icon: FlaskConical, key: 'fiveS' },
  { path: '/maintenance', icon: Wrench, key: 'maintenance' },
  { path: '/risks', icon: ShieldAlert, key: 'risks' },
  { path: '/audits', icon: ClipboardCheck, key: 'audits' },
  { path: '/program', icon: BookOpen, key: 'program' },
  { path: '/suppliers', icon: Truck, key: 'suppliers' },
  { path: '/epp', icon: HardHat, key: 'epp' },
  { path: '/chemicals', icon: Beaker, key: 'chemicals' },
  { path: '/guide', icon: HelpCircle, key: 'guide' },
];

const ADMIN_ITEMS = [
  { path: '/admin/users', icon: Users, key: 'users' },
  { path: '/admin/companies', icon: Building2, key: 'companies' },
];

export default function Sidebar({ collapsed, onToggle, onNavClick }) {
  const { t } = useTranslation();
  const { isAdmin } = usePermissions();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 py-2.5 mx-2 rounded-lg transition-colors relative ${
      collapsed ? 'px-0 justify-center' : 'px-4'
    } ${
      isActive
        ? 'bg-[var(--color-primary-light)] text-white border-l-2 border-[var(--color-accent)]'
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`;

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 overflow-hidden"
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'var(--color-primary-dark)',
        transition: 'width 200ms ease-in-out',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex-shrink-0 w-9 h-9 bg-[var(--color-accent)] rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm font-display leading-tight whitespace-nowrap">SH México</p>
            <p className="text-white/50 text-xs whitespace-nowrap">Seguridad e Higiene</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ path, icon: Icon, key }) => (
          <NavLink
            key={path}
            to={path}
            className={navLinkClass}
            title={collapsed ? t(`nav.${key}`) : undefined}
            onClick={onNavClick}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{t(`nav.${key}`)}</span>}
          </NavLink>
        ))}

        {isAdmin() && (
          <>
            <div className={`mt-4 mb-2 ${collapsed ? 'mx-3 border-t border-white/10' : 'px-4 text-white/40 text-xs uppercase tracking-wider'}`}>
              {!collapsed && 'Administración'}
            </div>
            {ADMIN_ITEMS.map(({ path, icon: Icon, key }) => (
              <NavLink
                key={path}
                to={path}
                className={navLinkClass}
                title={collapsed ? t(`nav.${key}`) : undefined}
                onClick={onNavClick}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{t(`nav.${key}`)}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className={`flex items-center py-3 border-t border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors ${
          collapsed ? 'justify-center px-0' : 'justify-start px-4 gap-2'
        }`}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed
          ? <PanelLeftOpen className="w-4 h-4" />
          : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span className="text-sm whitespace-nowrap">Colapsar menú</span>
            </>
          )
        }
      </button>
    </aside>
  );
}
