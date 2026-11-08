import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navItems, APP_NAME } from '../config/navigation';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 shrink-0 border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <span className="text-lg font-bold text-indigo-600">{APP_NAME}</span>
          <button className="md:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
