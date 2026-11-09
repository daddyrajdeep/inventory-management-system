import { useEffect, useState } from 'react';
import { getSuppliers } from '../services/supplierService';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  const handleChange = (e) => {
    setNewSupplier({
      ...newSupplier,
      [e.target.name]: e.target.value
    });
  };

  const addSupplier = () => {
    if (!newSupplier.name.trim()) {
      alert('Please enter supplier name');
      return;
    }

    const supplier = {
      ...newSupplier,
      id: Date.now().toString()
    };

    setSuppliers([...suppliers, supplier]);

    setNewSupplier({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const deleteSupplier = (id) => {
    setSuppliers(
      suppliers.filter(supplier => supplier.id !== id)
    );
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Suppliers Management</h2>

      <h3>Add New Supplier</h3>

      <input
        name="name"
        placeholder="Supplier Name"
        value={newSupplier.name}
        onChange={handleChange}
      />

      <input
        name="email"
        placeholder="Email"
        value={newSupplier.email}
        onChange={handleChange}
      />

      <input
        name="phone"
        placeholder="Phone"
        value={newSupplier.phone}
        onChange={handleChange}
      />

      <input
        name="address"
        placeholder="Address"
        value={newSupplier.address}
        onChange={handleChange}
      />

      <button onClick={addSupplier}>Add Supplier</button>

      <br /><br />

      <input
        placeholder="Search suppliers"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredSuppliers.map(supplier => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.email}</td>
              <td>{supplier.phone}</td>
              <td>{supplier.address}</td>
              <td>
                <button
                  onClick={() => deleteSupplier(supplier.id)}
                >
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

export default Suppliers;