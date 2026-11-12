import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import AlertBell from './AlertBell';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { prefs, setPref } = usePreferences();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 md:px-6">
      <button className="md:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div className="relative max-w-md flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          onClick={() => setPref('darkMode', !prefs.darkMode)}
          aria-label="Toggle dark mode"
          className="text-gray-600 hover:text-gray-800"
        >
          {prefs.darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <AlertBell />

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-800">{user.name}</p>
          <p className="text-xs capitalize text-gray-500">{user.role}</p>
        </div>
        <button onClick={handleLogout} aria-label="Log out" className="text-gray-500 hover:text-gray-800">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
