import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">This page does not exist.</p>
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
