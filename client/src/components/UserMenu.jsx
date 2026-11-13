import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LogOut, Moon, Settings, Sun } from 'lucide-react';
import Badge from './ui/Badge';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

export default function UserMenu({ onClose, align = 'right' }) {
  const { user, logout } = useAuth();
  const { prefs, setPref } = usePreferences();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('button')?.focus();
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      ref={ref}
      role="menu"
      className={`absolute z-50 mt-2 w-56 rounded-md border border-line bg-surface p-1.5 shadow-float ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
      style={{ animation: 'rise 160ms var(--ease) both' }}
    >
      <div className="px-2.5 py-2">
        <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
        <p className="truncate text-xs text-ink-soft">{user.email}</p>
        <div className="mt-1.5">
          <Badge tone="neutral">{user.role[0].toUpperCase() + user.role.slice(1)}</Badge>
        </div>
      </div>
      <div className="my-1 border-t border-line" />
      <MenuItem icon={Settings} onClick={() => go('/settings')}>
        Settings
      </MenuItem>
      <MenuItem icon={prefs.darkMode ? Sun : Moon} onClick={() => setPref('darkMode', !prefs.darkMode)}>
        Toggle dark mode
        {prefs.darkMode && <Check size={14} className="ml-auto text-ok" />}
      </MenuItem>
      <div className="my-1 border-t border-line" />
      <MenuItem
        icon={LogOut}
        danger
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Log out
      </MenuItem>
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-paper ${
        danger ? 'text-out' : 'text-ink'
      }`}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}
