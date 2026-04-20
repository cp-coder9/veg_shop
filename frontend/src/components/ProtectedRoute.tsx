import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role to appropriate portal
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'driver') {
    return <Navigate to="/driver" replace />;
  }
  if (user.role === 'packer') {
    return <Navigate to="/packer" replace />;
  }
  
  // Only allow customer role to access customer routes
  if (user.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
