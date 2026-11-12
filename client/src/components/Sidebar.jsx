import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Boxes, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { navItems, navGroups, settingsItem, APP_NAME } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import IconButton from './ui/IconButton';
import UserMenu from './UserMenu';

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sf.sidebar') === 'collapsed');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sf.sidebar', collapsed ? 'collapsed' : 'open');
  }, [collapsed]);

  // Mobile drawer: lock scroll + Escape while open
  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const items = navItems.filter((i) => i.roles.includes(user.role));
  const width = collapsed ? 'md:w-16' : 'md:w-60';

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-[120ms] ${
      isActive ? 'bg-paper text-ink shadow-[inset_2px_0_0_0_var(--ink)]' : 'text-ink-soft hover:bg-paper hover:text-ink'
    } ${collapsed ? 'md:justify-center md:px-0' : ''}`;

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-line bg-surface transition-[width,transform] duration-200 md:static md:translate-x-0 ${width} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex h-14 items-center gap-2.5 border-b border-line px-4 ${collapsed ? 'md:justify-center md:px-0' : ''}`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-ink text-on-ink">
            <Boxes size={16} />
          </span>
          {!collapsed && <span className="text-base font-semibold text-ink">{APP_NAME}</span>}
          <button className="ml-auto text-ink-soft hover:text-ink md:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
          {!collapsed && (
            <IconButton label="Collapse sidebar" className="ml-auto hidden xl:inline-flex" onClick={() => setCollapsed(true)}>
              <PanelLeftClose size={16} />
            </IconButton>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {navGroups.map((group) => {
            const groupItems = items.filter((i) => i.group === group);
            if (!groupItems.length) return null;
            return (
              <div key={group} className="mb-4">
                {!collapsed && <p className="mb-1 px-3 text-xs font-medium text-ink-soft">{group}</p>}
                <div className="space-y-0.5">
                  {groupItems.map(({ label, path, icon: Icon }) => (
                    <NavLink key={path} to={path} end={path === '/'} onClick={onClose} className={linkClass} title={collapsed ? label : undefined}>
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          {collapsed && (
            <IconButton label="Expand sidebar" className="mb-1 hidden w-full xl:inline-flex" onClick={() => setCollapsed(false)}>
              <PanelLeftOpen size={16} />
            </IconButton>
          )}
          <NavLink to={settingsItem.path} onClick={onClose} className={linkClass} title={collapsed ? 'Settings' : undefined}>
            <settingsItem.icon size={18} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors hover:bg-paper ${
                collapsed ? 'md:justify-center md:px-0' : ''
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-semibold text-ink">
                {initials(user.name)}
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
                  <span className="block text-xs text-ink-soft">{user.role[0].toUpperCase() + user.role.slice(1)}</span>
                </span>
              )}
            </button>
            {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} align="left" />}
          </div>
        </div>
      </aside>
    </>
  );
}
