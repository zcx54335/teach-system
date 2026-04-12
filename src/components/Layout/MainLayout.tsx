import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Banknote, BookOpen, Database, Hexagon, Laptop, Users, UserCheck, History } from 'lucide-react';
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, message, Switch, theme, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, LogoutOutlined, MoonOutlined, SettingOutlined, SunOutlined, UserOutlined } from '@ant-design/icons';
import { useTheme } from '../Theme/ThemeProvider';
import { AnimatePresence, motion } from 'framer-motion';

type UserRole = 'sysadmin' | 'teacher' | 'parent' | null;

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { theme: appTheme, setTheme } = useTheme();

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('xiaoyu_user');
    if (!sessionStr) {
      navigate('/login');
      return;
    }
    try {
      const session = JSON.parse(sessionStr);
      const role = session.role === 'admin' ? 'sysadmin' : session.role;
      setUserRole(role);
      setUserName(session.full_name || '用户');
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('xiaoyu_user');
    navigate('/');
  };

  const roleLabel = userRole === 'sysadmin' ? '超级管理员' : userRole === 'teacher' ? '教师' : userRole === 'parent' ? '家长' : '';

  const selectedMenuKey = useMemo(() => {
    const pathname = location.pathname.replace(/\/+$/, '');
    if (pathname.startsWith('/dashboard/education/')) {
      return pathname;
    }
    if (pathname === '/dashboard/schedule') return pathname;
    if (pathname === '/dashboard/dashboard') return pathname;
    if (pathname === '/dashboard/deduction') return pathname;
    if (pathname === '/dashboard/teachers') return pathname;
    if (pathname === '/dashboard/students') return pathname;
    if (pathname === '/dashboard/history') return pathname;
    if (pathname === '/dashboard/finance') return pathname;
    if (pathname.startsWith('/dashboard/settings')) return pathname;
    if (pathname === '/dashboard/personal-settings') return pathname;
    return '';
  }, [location.pathname, location.search]);

  const breadcrumbs = useMemo(() => {
    const pathname = location.pathname.replace(/\/+$/, '');
    if (!pathname.startsWith('/dashboard')) {
      return [{ title: '主页', path: '/' }];
    }

    const labelMap: Record<string, string> = {
      dashboard: '工作台',
      deduction: '日历消课',
      teachers: '师资管理',
      education: '教务中心',
      products: '课程产品管理',
      library: '题库与资料库',
      dictionary: '教务字典库',
      schedule: '排课管理',
      history: '消课与推送流水',
      students: '学员档案',
      finance: '财务统计',
      settings: '系统管理',
      'personal-settings': '个人设置',
      report: '学情反馈',
      profile: '账号信息',
      materials: '学习资料',
    };

    const parts = pathname.split('/').filter(Boolean);
    const trail: Array<{ title: string; path: string }> = [{ title: '控制台', path: '/dashboard/dashboard' }];
    if (parts.length >= 2) {
      const section = parts[1];
      if (section === 'education') {
        trail.push({ title: labelMap.education, path: '/dashboard/education/products' });
        if (parts.length >= 3) {
          const sub = parts[2];
          trail.push({ title: labelMap[sub] || sub, path: pathname });
        }
      } else if (section === 'settings') {
        trail.push({ title: labelMap.settings, path: '/dashboard/settings/basic' });
        if (parts.length >= 3) {
          const sub = parts[2];
          const subMap: Record<string, string> = { basic: '基础设置', roles: '角色与权限', audit: '操作日志' };
          trail.push({ title: subMap[sub] || sub, path: pathname });
        }
      } else {
        trail.push({ title: labelMap[section] || section, path: pathname });
      }
    }
    return trail;
  }, [location.pathname, location.search]);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'overview',
      disabled: true,
      label: (
        <div className="py-1">
          <div className="font-semibold">{userName || '用户'}</div>
          <div className="text-xs text-slate-500">{roleLabel || '—'}</div>
        </div>
      ),
      icon: <UserOutlined />,
    },
    { type: 'divider' },
    { key: 'settings', label: '个人设置', icon: <SettingOutlined /> },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
  ];

  const menuItems = useMemo(() => {
    if (userRole === 'sysadmin' || userRole === 'teacher') {
      return [
        {
          key: '/dashboard/dashboard',
          label: '工作台',
          icon: <Laptop className="w-4 h-4" />,
        },
        {
          key: '/dashboard/deduction',
          label: '日历消课',
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          key: '/dashboard/schedule',
          label: '排课管理',
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          key: '/dashboard/students',
          label: '学员档案',
          icon: <Users className="w-4 h-4" />,
        },
        {
          key: '/dashboard/teachers',
          label: '师资管理',
          icon: <UserCheck className="w-4 h-4" />,
        },
        {
          key: 'education',
          label: '教务中心',
          icon: <BookOpen className="w-4 h-4" />,
          children: [
            { key: '/dashboard/education/products', label: '课程产品管理' },
            { key: '/dashboard/education/library', label: '题库与资料库' },
            { key: '/dashboard/education/dictionary', label: '教务字典库' },
          ],
        },
        {
          key: '/dashboard/finance',
          label: '财务统计',
          icon: <Banknote className="w-4 h-4" />,
        },
        {
          key: '/dashboard/history',
          label: '消课与推送流水',
          icon: <History className="w-4 h-4" />,
        },
        ...(userRole === 'sysadmin'
          ? [
              {
                key: 'settings',
                label: '系统管理',
                icon: <Database className="w-4 h-4" />,
                children: [
                  { key: '/dashboard/settings/basic', label: '基础设置' },
                  { key: '/dashboard/settings/roles', label: '角色与权限' },
                  { key: '/dashboard/settings/audit', label: '操作日志' },
                ],
              },
            ]
          : []),
      ];
    }
    if (userRole === 'parent') {
      return [
        { key: '/dashboard/report', label: '学情反馈', icon: <Activity className="w-4 h-4" /> },
        { key: '/dashboard/materials', label: '学习资料', icon: <BookOpen className="w-4 h-4" /> },
      ];
    }
    return [];
  }, [userRole]);

  const isDark = appTheme === 'dark' || (appTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider
        width={288}
        collapsible
        collapsed={collapsed}
        collapsedWidth={80}
        onCollapse={setCollapsed}
        className="app-sider"
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          ['--sider-bg' as any]: token.colorBgContainer,
          ['--sider-border' as any]: token.colorBorderSecondary,
          ['--sider-hover' as any]: token.colorFillAlter,
          ['--sider-text' as any]: token.colorTextSecondary,
        }}
      >
        <div className="h-16 px-4 flex items-center justify-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: token.colorFillAlter }}
          >
            <Hexagon className="w-5 h-5" style={{ color: token.colorText }} />
          </div>
          {!collapsed && (
            <div className="min-w-0 text-center">
              <div className="text-[15px] font-black tracking-wide leading-5" style={{ color: token.colorText }}>
                小鱼思维校办系统
              </div>
              <div className="text-[11px] leading-4" style={{ color: token.colorTextSecondary }}>
                {roleLabel}
              </div>
            </div>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
          onClick={({ key }) => {
            const next = String(key);
            if (!next.startsWith('/')) return;
            navigate(next);
          }}
          style={{ borderInlineEnd: 'none' }}
          items={menuItems as any}
        />
      </Sider>

      <Layout className="flex flex-col overflow-hidden min-h-0 min-w-0">
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
          className="h-16 flex items-center justify-between"
        >
          <Breadcrumb
            items={breadcrumbs.map((b) => ({
              title: (
                <Typography.Link onClick={() => navigate(b.path)} style={{ fontSize: 12 }}>
                  {b.title}
                </Typography.Link>
              ),
            }))}
          />

          <div className="flex items-center gap-4">
            <Switch
              checked={isDark}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
            <Dropdown
              menu={{
                items: dropdownItems,
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    handleLogout();
                    return;
                  }
                  if (key === 'settings') {
                    navigate('/dashboard/personal-settings');
                  }
                },
              }}
              trigger={['hover']}
              placement="bottomRight"
            >
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5">
                <Avatar
                  size={32}
                  style={{ background: token.colorPrimary, verticalAlign: 'middle' }}
                  icon={!userName ? <UserOutlined /> : undefined}
                >
                  {userName ? userName.charAt(0) : null}
                </Avatar>
                <div className="hidden sm:flex flex-col leading-4">
                  <div className="text-sm font-semibold" style={{ color: token.colorText }}>
                    {userName}
                  </div>
                  <div className="text-xs" style={{ color: token.colorTextSecondary }}>
                    {roleLabel}
                  </div>
                </div>
                <DownOutlined style={{ fontSize: 12, color: token.colorTextSecondary }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          className="flex-1 overflow-y-auto p-6 min-h-0"
          style={{ background: token.colorBgLayout }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
