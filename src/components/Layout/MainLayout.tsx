import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Hexagon, Users, BookOpen, Settings, LogOut, 
  Menu, ChevronLeft, ChevronRight, Activity, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<'sysadmin' | 'teacher' | 'parent' | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const sessionStr = localStorage.getItem('xiaoyu_user');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        // Map old 'admin' to 'sysadmin' for compatibility
        const role = session.role === 'admin' ? 'sysadmin' : session.role;
        setUserRole(role);
        setUserName(session.full_name || '用户');
      } catch (e) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('xiaoyu_user');
    navigate('/');
  };

  // Define navigation items based on role
  const getNavItems = () => {
    if (userRole === 'sysadmin' || userRole === 'teacher') {
      return [
        { path: '/dashboard/workbench', icon: Laptop, label: '消课工作台' },
        { path: '/dashboard/students', icon: Users, label: '学员管理' },
        { path: '/dashboard/schedule', icon: BookOpen, label: '课程排期' },
        ...(userRole === 'sysadmin' ? [{ path: '/dashboard/settings', icon: Settings, label: '系统设置' }] : []),
      ];
    } else if (userRole === 'parent') {
      return [
        { path: '/dashboard/report', icon: Activity, label: '学情雷达' },
        { path: '/dashboard/materials', icon: BookOpen, label: '学习资料' },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-[#020617] text-white font-inter selection:bg-cyan-500/30 overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[100px]"></div>
      </div>

      {/* Collapsible Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 240 }}
        className="relative z-10 bg-black/40 border-r border-white/5 backdrop-blur-2xl flex flex-col shrink-0 overflow-hidden"
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  <h1 className="text-lg font-black tracking-widest text-white">小鱼思维</h1>
                  <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">{userRole}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-6 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center px-3 py-3.5 rounded-xl transition-all duration-300 relative group ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_3px_0_0_rgba(34,211,238,1)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'space-x-4'}`}
              >
                <item.icon className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="text-sm font-bold tracking-widest whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "退出系统" : undefined}
            className={`w-full flex items-center px-3 py-3.5 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all ${isCollapsed ? 'justify-center' : 'space-x-4'}`}
          >
            <LogOut className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="text-xs font-bold tracking-widest whitespace-nowrap"
                >
                  退出系统
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 h-screen overflow-hidden flex flex-col bg-black/20">
        {/* Top Navbar */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 backdrop-blur-md shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 mr-4 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold tracking-widest text-white/80 hidden sm:block">
              {navItems.find(item => location.pathname.startsWith(item.path))?.label || '概览'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white tracking-widest">{userName}</p>
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Active Session</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px]">
              <div className="w-full h-full bg-[#020617] rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{userName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content with Fade-in */}
        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-full p-6 md:p-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;