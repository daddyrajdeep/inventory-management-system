import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Badge from '../components/Badge';
import useFetch from '../hooks/useFetch';
import { getUsers } from '../services/userService';

// OWNER: Leader
// TODO: add user, change role, deactivate user (admin only)
const roleTone = { admin: 'red', manager: 'blue', staff: 'gray' };

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (r) => <Badge tone={roleTone[r.role]}>{r.role}</Badge> },
];

export default function Users() {
  const { data, loading } = useFetch(getUsers);

  return (
    <>
      <PageHeader title="Users" subtitle="Manage who can access the system" />
      <DataTable columns={columns} rows={data ?? []} loading={loading} />
    </>
  );
}
