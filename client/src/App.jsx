import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import PurchaseOrders from './pages/PurchaseOrders';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Users from './pages/Users';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

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
      <Routes>
        <Route path="/login" element={<Login />} />
        {import.meta.env.DEV && (
          <Route
            path="/ui-kit"
            element={
              <Suspense fallback={null}>
                <UIKit />
              </Suspense>
            }
          />
        )}

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
    </>
  );
}
