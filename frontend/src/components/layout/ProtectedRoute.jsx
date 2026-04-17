import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}
