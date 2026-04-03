import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Hexagon, Users, BookOpen, Settings, LogOut, 
  Menu, ChevronLeft, ChevronRight, Activity, Laptop, X, Database, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        ...(userRole === 'sysadmin' ? [
          { path: '/dashboard/system', icon: Database, label: '系统管理' }
        ] : []),
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

      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 240 }}
        className="hidden md:flex relative z-10 bg-black/40 border-r border-white/5 backdrop-blur-2xl flex-col shrink-0 overflow-hidden"
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

      {/* Mobile Drawer Overlay & Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-white/10 z-50 flex flex-col md:hidden shadow-2xl"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                    <Hexagon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base font-black tracking-widest text-white">小鱼思维</h1>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-4 rounded-xl transition-all duration-300 space-x-4 ${
                        isActive 
                          ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_3px_0_0_rgba(34,211,238,1)]' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold tracking-widest">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-4 rounded-xl bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-white/5 transition-all space-x-4"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold tracking-widest">退出系统</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 h-screen overflow-hidden flex flex-col bg-black/20 w-full">
        {/* Top Navbar */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 backdrop-blur-md shrink-0 relative z-[100]">
          <div className="flex items-center">
            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 mr-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:block p-2 mr-4 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h2 className="text-base md:text-lg font-bold tracking-widest text-white/90">
              {navItems.find(item => location.pathname.startsWith(item.path))?.label || '概览'}
            </h2>
          </div>
          <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
            <div className="text-right hidden sm:block cursor-pointer" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
              <p className="text-sm font-bold text-white tracking-widest hover:text-cyan-400 transition-colors">{userName}</p>
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Active Session</p>
            </div>
            <div 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all"
            >
              <div className="w-full h-full bg-[#020617] rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{userName.charAt(0)}</span>
              </div>
            </div>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-14 right-0 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[9999]"
                >
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <p className="text-sm font-bold text-white tracking-widest truncate">{userName}</p>
                    <p className="text-xs text-cyan-400 font-mono mt-1">{userRole === 'parent' ? '家长' : userRole === 'teacher' ? '教师' : '管理员'}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        navigate('/dashboard/profile');
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors tracking-widest"
                    >
                      <UserCircle className="w-5 h-5 mr-3 text-cyan-400" />
                      账号详细信息
                    </button>
                    
                    <div className="my-1 border-t border-slate-700"></div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-3 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors tracking-widest"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      退出登录
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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