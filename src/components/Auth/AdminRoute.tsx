import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Hexagon } from 'lucide-react';

const AdminRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const sessionStr = localStorage.getItem('xiaoyu_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session && session.role === 'admin') {
            setIsAuthenticated(true);
            return;
          }
        } catch (e) {
          // Ignore
        }
      }
      setIsAuthenticated(false);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    // 认证检查中的全屏 Loading
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center flex-col space-y-6 selection:bg-cyan-500/30">
        <div className="relative">
          <div className="absolute inset-0 w-16 h-16 bg-cyan-500/20 rounded-full blur-[20px] animate-pulse"></div>
          <div className="w-16 h-16 border-2 border-white/10 border-t-cyan-400 rounded-full animate-spin flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            <Hexagon className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          Authenticating...
        </span>
      </div>
    );
  }

  // 如果未认证，重定向到 /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 认证通过，渲染子路由内容
  return <Outlet />;
};

export default AdminRoute;