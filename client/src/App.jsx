import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Inventory = lazy(() => import('./pages/Inventory'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const Sales = lazy(() => import('./pages/Sales'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UIKit = lazy(() => import('./pages/UIKit'));

const toastStyle = {
  background: 'var(--surface)',
  color: 'var(--ink)',
  border: '1px solid var(--line)',
  boxShadow: 'var(--shadow-float)',
  fontSize: '13px',
  borderRadius: '10px',
};

// OWNER: Leader. To add a page: create it in /pages, add a <Route> here, and add it to config/navigation.js
export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: toastStyle,
          success: { iconTheme: { primary: 'var(--ok)', secondary: 'var(--surface)' } },
          error: { iconTheme: { primary: 'var(--out)', secondary: 'var(--surface)' } },
        }}
      />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-soft">Loading…</div>}>
        <Routes>
          <Route path="/welcome" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          {import.meta.env.DEV && <Route path="/ui-kit" element={<UIKit />} />}

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<Sales />} />
              <Route path="settings" element={<Settings />} />

              <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
                <Route path="orders" element={<PurchaseOrders />} />
                <Route path="expenses" element={<Expenses />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="users" element={<Users />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
