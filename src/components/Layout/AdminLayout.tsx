import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Hexagon, Users, BookOpen, Settings, LogOut } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('xiaoyu_user');
    navigate('/');
  };

  const navItems = [
    { path: '/admin', icon: Users, label: '学员管理' },
    { path: '/admin/schedule', icon: BookOpen, label: '课程排期' },
    { path: '/admin/settings', icon: Settings, label: '系统设置' },
  ];

  return (
    <div className="min-h-screen flex bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-hidden">
      {/* 背景光效 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[100px]"></div>
      </div>

      {/* 左侧边栏 - 固定宽度 */}
      <aside className="relative z-10 w-[240px] bg-black/40 border-r border-white/5 backdrop-blur-2xl flex flex-col shrink-0">
        <div className="p-8 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
            <Hexagon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-widest text-white">小鱼思维</h1>
            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-[inset_4px_0_0_rgba(34,211,238,1)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest">退出系统</span>
          </button>
        </div>
      </aside>

      {/* 右侧主内容区 - flex-1 撑满 */}
      <main className="relative z-10 flex-1 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;