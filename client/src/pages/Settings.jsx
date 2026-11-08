import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

// OWNER: Leader
// TODO: edit profile, notifications toggle, dark mode, language
export default function Settings() {
  const { user } = useAuth();

  const rows = [
    ['Name', user.name],
    ['Email', user.email],
    ['Role', user.role],
  ];

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account details" />
      <div className="max-w-xl divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between px-5 py-4 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium capitalize text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
