import PageHeader from '../components/PageHeader';
import ComingSoon from '../components/ComingSoon';
import useFetch from '../hooks/useFetch';
import { getProducts } from '../services/productService';
import { getSales } from '../services/saleService';
import { formatCurrency } from '../utils/format';

// OWNER: Member 4 (Dashboard, charts)
// The stat cards below show how to use services. Add Recharts charts under them.
export default function Dashboard() {
  const { data: products } = useFetch(getProducts);
  const { data: sales } = useFetch(getSales);

  const list = products ?? [];
  const stats = [
    { label: 'Total products', value: list.length },
    { label: 'Low or out of stock', value: list.filter((p) => p.quantity <= p.reorderLevel).length },
    { label: 'Stock value', value: formatCurrency(list.reduce((s, p) => s + p.price * p.quantity, 0)) },
    { label: 'Recent sales', value: formatCurrency((sales ?? []).reduce((s, x) => s + x.total, 0)) },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your stock and sales" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
      <ComingSoon text="Member 4: add the sales chart, purchase chart and expense donut here (Recharts)." />
    </>
  );
}
