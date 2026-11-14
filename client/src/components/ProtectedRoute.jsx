import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// OWNER: Leader
// <ProtectedRoute />                      -> must be logged in
// <ProtectedRoute roles={['admin']} />    -> must be logged in AND have one of these roles
export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/welcome" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
