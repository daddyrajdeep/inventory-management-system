import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import FormField, { inputClass } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../services/productService';
import { formatCurrency } from '../utils/format';

// OWNER: Rudra (Products)
const emptyForm = {
  name: '',
  sku: '',
  category: '',
  price: '',
  costPrice: '',
  reorderLevel: '',
  unit: '',
  description: '',
  isActive: true,
};

function getStockStatus(product) {
  if (product.quantity === 0) return 'out';
  if (product.quantity <= product.reorderLevel) return 'low';
  return 'in';
}

function validate(form) {
  const errors = {};
  const price = Number(form.price);
  const costPrice = Number(form.costPrice);
  const reorderLevel = Number(form.reorderLevel);

  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.sku.trim()) errors.sku = 'SKU is required';
  else if (!/^[A-Za-z0-9-]+$/.test(form.sku.trim())) errors.sku = 'Use letters, numbers, and hyphens only';
  if (!form.category.trim()) errors.category = 'Category is required';

  if (!form.price.trim()) errors.price = 'Price is required';
  else if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a number greater than or equal to 0';

  if (form.costPrice.trim() && (!Number.isFinite(costPrice) || costPrice < 0)) {
    errors.costPrice = 'Enter a number greater than or equal to 0';
  }
  if (form.reorderLevel.trim() && (!Number.isFinite(reorderLevel) || reorderLevel < 0)) {
    errors.reorderLevel = 'Enter a number greater than or equal to 0';
  }
  if (form.costPrice.trim() && Number.isFinite(costPrice) && Number.isFinite(price) && costPrice > price) {
    errors.costPrice = 'Cost price must not exceed price';
  }

  return errors;
}

export default function Products() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') ?? '';
  const [query, setQuery] = useState(urlSearch);
  const [seenUrlSearch, setSeenUrlSearch] = useState(urlSearch);
  if (urlSearch !== seenUrlSearch) {
    // a new search from the top bar while already on this page
    setSeenUrlSearch(urlSearch);
    setQuery(urlSearch);
  }
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const list = await getProducts(showInactive ? { includeInactive: true } : undefined);
        if (active) {
          setProducts(list);
          setLoadError('');
        }
      } catch (err) {
        if (active) setLoadError(err.message || 'Unable to load products');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      active = false;
    };
  }, [showInactive]);

  const refresh = async () => {
    try {
      const list = await getProducts(showInactive ? { includeInactive: true } : undefined);
      setProducts(list);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Unable to load products');
      throw err;
    }
  };

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStock = stockFilter === 'all' || getStockStatus(product) === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const openForm = (product = null) => {
    setEditingProduct(product);
    setForm(
      product
        ? {
            name: product.name ?? '',
            sku: product.sku ?? '',
            category: product.category ?? '',
            price: String(product.price ?? ''),
            costPrice: product.costPrice == null ? '' : String(product.costPrice),
            reorderLevel: product.reorderLevel == null ? '' : String(product.reorderLevel),
            unit: product.unit ?? '',
            description: product.description ?? '',
            isActive: product.isActive !== false,
          }
        : { ...emptyForm }
    );
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      price: Number(form.price),
      costPrice: form.costPrice.trim() ? Number(form.costPrice) : 0,
      reorderLevel: form.reorderLevel.trim() ? Number(form.reorderLevel) : 10,
      unit: form.unit.trim() || 'pcs',
      description: form.description.trim(),
      ...(editingProduct ? { isActive: form.isActive } : {}),
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        await refresh();
        toast.success(`${payload.name} was updated`);
      } else {
        await createProduct(payload);
        await refresh();
        toast.success(`${payload.name} was added`);
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This action cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      await refresh();
      toast.success(`${product.name} was deleted`);
    } catch (err) {
      toast.error(err.message || 'Unable to delete product');
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Browse and manage your product catalogue"
        action={
          canManage ? (
            <button
              onClick={() => openForm()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> Create Product
            </button>
          ) : null
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-50 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="all">All stock statuses</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">Unable to load products: {loadError}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((product) => (
            <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gray-100 text-3xl font-semibold text-gray-400">
                {product.name[0]}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openForm(product)}
                      aria-label={`Edit ${product.name}`}
                      className="text-gray-500 hover:text-gray-800"
                    >
                      <Pencil size={16} />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        aria-label={`Delete ${product.name}`}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">{product.category}</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                {getStockStatus(product) === 'out' ? (
                  <Badge tone="red">Out of stock</Badge>
                ) : getStockStatus(product) === 'low' ? (
                  <Badge tone="amber">Low: {product.quantity}</Badge>
                ) : (
                  <Badge tone="green">Stock: {product.quantity}</Badge>
                )}
              </div>
              {product.isActive === false && (
                <div className="mt-2">
                  <Badge tone="gray">Inactive</Badge>
                </div>
              )}
            </div>
          ))}
          {visible.length === 0 && (
            <p className="text-sm text-gray-500">No products match your filters.</p>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingProduct ? 'Edit product' : 'Create product'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto" noValidate>
          <FormField label="Name *" error={errors.name}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="SKU *" error={errors.sku}>
            <input
              className={inputClass}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </FormField>
          <FormField label="Category *" error={errors.category}>
            <input
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </FormField>
          <FormField label="Price *" error={errors.price}>
            <input
              type="number"
              min="0"
              step="any"
              className={inputClass}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </FormField>
          <FormField label="Cost price" error={errors.costPrice}>
            <input
              type="number"
              min="0"
              step="any"
              className={inputClass}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </FormField>
          <FormField label="Reorder level" error={errors.reorderLevel}>
            <input
              type="number"
              min="0"
              step="any"
              className={inputClass}
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
            />
          </FormField>
          <FormField label="Unit">
            <input
              className={inputClass}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className={inputClass}
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          {editingProduct && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active (inactive products are hidden from lists but keep their history)
            </label>
          )}
          {editingProduct && (
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
              Current stock: {editingProduct.quantity}. Stock is changed from the Inventory page.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingProduct ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
