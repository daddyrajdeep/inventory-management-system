import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import {
  getCategories,
  createCategory,
  deleteCategory as removeCategory,
} from '../services/categoryService';


export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
const refresh = async () => {
  try {
    const list = await getCategories();
    setCategories(list);
  } catch (err) {
    toast.error(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  let active = true;
  getCategories()
    .then((list) => {
      if (!active) return;
      setCategories(list);
    })
    .catch((err) => toast.error(err.message))
    .finally(() => {
      if (active) setLoading(false);
    });
  return () => {
    active = false;
  };
}, []);

  const addCategory = async (e) => {
  e.preventDefault();
  const name = newCategory.trim();

  if (!name) {
    setError('Category name is required');
    return;
  }
  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    setError('This category already exists');
    return;
  }

  try {
    await createCategory({ name });
    await refresh();
    setNewCategory('');
    setError('');
    toast.success(`"${name}" added`);
  } catch (err) {
    toast.error(err.message);
  }
};
 const deleteCategory = async (category) => {
  if (!window.confirm(`Delete "${category.name}"?`)) return;
  try {
    await removeCategory(category.id);
    await refresh();
    toast.success(`"${category.name}" deleted`);
  } catch (err) {
    toast.error(err.message);
  }
};

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const columns = [
    {
      key: 'name',
      label: 'Category name',
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end">
          <button
            onClick={() => deleteCategory(row)}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Categories" subtitle={`${categories.length} categories in your catalogue`} />

      {/* Quick add */}
      <form onSubmit={addCategory} className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">New category</label>
        <div className="flex flex-wrap gap-3">
          <input
            value={newCategory}
            onChange={(e) => {
              setNewCategory(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter category name"
            className={`min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 ${
              error ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filteredCategories}
        loading={loading}
        emptyText={search ? 'No categories match your search' : 'No categories yet. Add your first one above.'}
      />
    </>
  );
}