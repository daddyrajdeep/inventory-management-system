import { useEffect, useState } from 'react';
import { getCategories } from '../services/categoryService';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const addCategory = () => {
    if (!newCategory.trim()) return;

    const category = {
      id: Date.now().toString(),
      name: newCategory
    };

    setCategories([...categories, category]);
    setNewCategory('');
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(category => category.id !== id));
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Categories Management</h2>

      <input
        placeholder="Enter category name"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />

      <button onClick={addCategory}>Add Category</button>

      <br /><br />

      <input
        placeholder="Search categories"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredCategories.map(category => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>
                <button onClick={() => deleteCategory(category.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Categories;