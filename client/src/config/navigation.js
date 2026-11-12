import {
  LayoutDashboard,
  Package,
  Layers3,
  Truck,
  Archive,
  ClipboardList,
  ShoppingCart,
  Wallet,
  Users,
  Settings,
} from 'lucide-react';

export const APP_NAME = 'StockFlow';

// group = sidebar section; roles = who can see this page (server-enforced too).
export const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'Overview', roles: ['admin', 'manager', 'staff'] },
  { label: 'Products', path: '/products', icon: Package, group: 'Catalog', roles: ['admin', 'manager', 'staff'] },
  { label: 'Categories', path: '/categories', icon: Layers3, group: 'Catalog', roles: ['admin', 'manager', 'staff'] },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, group: 'Catalog', roles: ['admin', 'manager', 'staff'] },
  { label: 'Inventory', path: '/inventory', icon: Archive, group: 'Operations', roles: ['admin', 'manager', 'staff'] },
  { label: 'Purchase Orders', path: '/orders', icon: ClipboardList, group: 'Operations', roles: ['admin', 'manager'] },
  { label: 'Sales', path: '/sales', icon: ShoppingCart, group: 'Operations', roles: ['admin', 'manager', 'staff'] },
  { label: 'Expenses', path: '/expenses', icon: Wallet, group: 'Money', roles: ['admin', 'manager'] },
  { label: 'Users', path: '/users', icon: Users, group: 'Admin', roles: ['admin'] },
];

export const settingsItem = { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'staff'] };

export const navGroups = ['Overview', 'Catalog', 'Operations', 'Money', 'Admin'];
