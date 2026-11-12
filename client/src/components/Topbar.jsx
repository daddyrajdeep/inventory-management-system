import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { navItems, settingsItem } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import AlertBell from './AlertBell';
import UserMenu from './UserMenu';
import IconButton from './ui/IconButton';
import Kbd from './ui/Kbd';

const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function Topbar({ onMenu, onOpenPalette }) {
  const { user } = useAuth();
  const { prefs, setPref } = usePreferences();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const current = [...navItems, settingsItem].find((i) => (i.path === '/' ? pathname === '/' : pathname.startsWith(i.path)));

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 md:px-6">
      <IconButton label="Open menu" className="md:hidden" onClick={onMenu}>
        <Menu size={20} />
      </IconButton>

      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-[13px] sm:flex">
        {current?.group && <span className="text-ink-soft">{current.group}</span>}
        {current?.group && <span className="text-ink-soft">›</span>}
        <span className="font-medium text-ink">{current?.label || 'StockFlow'}</span>
      </nav>

      <button
        type="button"
        onClick={onOpenPalette}
        className="ml-auto flex h-9 w-9 items-center justify-center rounded-sm border border-line text-ink-soft transition-colors hover:border-ink-soft hover:text-ink sm:w-72 sm:justify-start sm:gap-2 sm:px-3"
        aria-label="Search products and pages"
      >
        <Search size={16} />
        <span className="hidden flex-1 text-left text-[13px] sm:block">Search products, pages…</span>
        <span className="hidden sm:block"><Kbd>⌘K</Kbd></span>
      </button>

      <div className="flex items-center gap-1">
        <IconButton label="Toggle dark mode" onClick={() => setPref('darkMode', !prefs.darkMode)}>
          {prefs.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
        <AlertBell />
        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-xs font-semibold text-ink transition-colors hover:bg-line"
          >
            {initials(user.name)}
          </button>
          {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} align="right" />}
        </div>
      </div>
    </header>
  );
}
