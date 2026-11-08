import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';
import { getProducts } from '../services/productService';
import { formatCurrency } from '../utils/format';

// OWNER: Member 3 (Stock in/out, stock history, purchase orders)
// TODO: Stock In / Stock Out / Adjust buttons with a form, and a stock history view
const columns = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', render: (r) => formatCurrency(r.price) },
  { key: 'quantity', label: 'In stock' },
  {
    key: 'status',
    label: 'Status',
    render: (r) =>
      r.quantity === 0 ? (
        <Badge tone="red">Out of stock</Badge>
      ) : r.quantity <= r.reorderLevel ? (
        <Badge tone="amber">Low stock</Badge>
      ) : (
        <Badge tone="green">In stock</Badge>
      ),
  },
];

export default function Inventory() {
  const { data, loading } = useFetch(getProducts);

  return (
    <>
      <PageHeader title="Inventory" subtitle="Current stock levels for every product" />
      <DataTable columns={columns} rows={data ?? []} loading={loading} />
    </>
  );
}
