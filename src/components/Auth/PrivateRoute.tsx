import React, { useEffect, useRef } from 'react';
import { message } from 'antd';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { Role } from '../../constants/rbac';
import { useAuth } from './AuthProvider';

export default function PrivateRoute({ allowedRoles, children }: { allowedRoles?: Role[]; children?: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasDeniedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!allowedRoles) return;
    if (allowedRoles.includes(user.role)) return;
    if (hasDeniedRef.current) return;
    hasDeniedRef.current = true;
    message.error('无权访问该页面');
    navigate('/403', { replace: true, state: { from: location.pathname } });
  }, [allowedRoles, location.pathname, navigate, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  if (children) return <>{children}</>;
  return <Outlet />;
}

