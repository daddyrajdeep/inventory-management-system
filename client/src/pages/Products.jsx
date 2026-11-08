import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';
import { getProducts } from '../services/productService';
import { formatCurrency } from '../utils/format';

// OWNER: Member 2 (Products, categories, suppliers)
// TODO: create/edit form, delete, image upload, category and supplier filters
export default function Products() {
  const { data, loading } = useFetch(getProducts);
  const [query, setQuery] = useState('');

  const products = useMemo(() => {
    const q = query.toLowerCase();
    return (data ?? []).filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Browse and manage your product catalogue"
        action={
          <button
            onClick={() => toast('Member 2: build the Create Product form here')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Create Product
          </button>
        }
      />

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gray-100 text-3xl font-semibold text-gray-400">
                {p.name[0]}
              </div>
              <h3 className="font-medium text-gray-900">{p.name}</h3>
              <p className="text-xs text-gray-500">{p.sku}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{formatCurrency(p.price)}</span>
                {p.quantity === 0 ? (
                  <Badge tone="red">Out of stock</Badge>
                ) : p.quantity <= p.reorderLevel ? (
                  <Badge tone="amber">Low: {p.quantity}</Badge>
                ) : (
                  <Badge tone="green">Stock: {p.quantity}</Badge>
                )}
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-gray-500">No products match your search.</p>}
        </div>
      )}
    </>
  );
}
