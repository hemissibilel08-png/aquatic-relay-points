import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserCentre } from '@/hooks/useUserCentre';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'staff' | 'facilitateur' | 'rev';
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

export function RoleProtectedRoute({ 
  children, 
  requiredRole,
  requireAdmin = false,
  requireStaff = false
}: RoleProtectedRouteProps) {
  const { 
    loading, 
    isAdmin, 
    canAccessStaff, 
    canAccessAdmin, 
    isFacilitateur, 
    isRev,
    hasStaffAccess 
  } = useUserCentre();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-wave flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-primary"></div>
      </div>
    );
  }

  // Vérifications spécifiques
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireStaff && !hasStaffAccess) {
    return <Navigate to="/" replace />;
  }

  // Vérifications par rôle
  if (requiredRole) {
    switch (requiredRole) {
      case 'admin':
        if (!isAdmin) return <Navigate to="/" replace />;
        break;
      case 'staff':
        if (!canAccessStaff) return <Navigate to="/" replace />;
        break;
      case 'facilitateur':
        if (!isFacilitateur() && !isAdmin) return <Navigate to="/" replace />;
        break;
      case 'rev':
        if (!isRev() && !isAdmin) return <Navigate to="/" replace />;
        break;
    }
  }

  return <>{children}</>;
}