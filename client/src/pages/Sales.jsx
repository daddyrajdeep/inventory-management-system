import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';
import { getSales } from '../services/saleService';
import { formatCurrency, formatDate } from '../utils/format';

// OWNER: Member 4 (Sales, dashboard, expenses)
// TODO: "New Sale" screen (pick products, quantities, discount), invoice view
const columns = [
  { key: 'id', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'itemCount', label: 'Items' },
  { key: 'total', label: 'Total', render: (r) => formatCurrency(r.total) },
  { key: 'method', label: 'Payment', render: (r) => <Badge tone="blue">{r.method}</Badge> },
  { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
];

export default function Sales() {
  const { data, loading } = useFetch(getSales);

  return (
    <>
      <PageHeader title="Sales" subtitle="Recent invoices" />
      <DataTable columns={columns} rows={data ?? []} loading={loading} />
    </>
  );
}
