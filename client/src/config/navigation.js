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

// Change this to your own app name
export const APP_NAME = 'StockFlow';

// roles = who can see this page in the sidebar
export const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
  { label: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager', 'staff'] },
  { label: 'Categories', path: '/categories', icon: Layers3, roles: ['admin', 'manager', 'staff'] },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager', 'staff'] },
  { label: 'Inventory', path: '/inventory', icon: Archive, roles: ['admin', 'manager', 'staff'] },
  { label: 'Purchase Orders', path: '/orders', icon: ClipboardList, roles: ['admin', 'manager'] },
  { label: 'Sales', path: '/sales', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
  { label: 'Expenses', path: '/expenses', icon: Wallet, roles: ['admin', 'manager'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['admin'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'staff'] },
];
