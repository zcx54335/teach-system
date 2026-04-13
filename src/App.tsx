import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ParentDashboard from "./pages/ParentDashboard";
import ParentCenter from "./pages/ParentCenter";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import PrivateRoute from "./components/Auth/PrivateRoute";
import MainLayout from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSchedule from "./pages/AdminSchedule";
import FinanceManagement from "./pages/FinanceManagement";
import TeachersManagement from "./pages/TeachersManagement";
import EducationProducts from "./pages/EducationProducts";
import EducationLibrary from "./pages/EducationLibrary";
import EducationDictionary from "./pages/EducationDictionary";
import SettingsManagement from "./pages/SettingsManagement";
import RolesPermissions from "./pages/RolesPermissions";
import AuditLogs from "./pages/AuditLogs";
import TeacherWorkbench from "./pages/TeacherWorkbench";
import PublicReport from "./pages/PublicReport";
import Profile from "./pages/Profile";
import History from "./pages/History";
import PersonalSettings from "./pages/PersonalSettings";
import Forbidden from "./pages/Forbidden";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useTheme } from './components/Theme/ThemeProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { AuthProvider, useAuth } from './components/Auth/AuthProvider';
import { ROLES } from './constants/rbac';

dayjs.locale('zh-cn');

function AntdProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        components: {
          Menu: {
            ...(isDark
              ? {
                  itemSelectedBg: 'rgba(255, 255, 255, 0.10)',
                  itemSelectedColor: '#ffffff',
                  itemHoverBg: 'rgba(255, 255, 255, 0.05)',
                }
              : {
                  itemSelectedBg: 'rgba(0, 0, 0, 0.04)',
                  itemSelectedColor: '#1f1f1f',
                  itemHoverBg: 'rgba(0, 0, 0, 0.03)',
                }),
          },
          ...(isDark
            ? {
                Button: {
                  colorPrimary: '#13c2c2',
                  colorPrimaryHover: '#36cfc9',
                  colorPrimaryActive: '#08979c',
                  primaryShadow: '0 10px 26px rgba(19, 194, 194, 0.35)',
                },
              }
            : {}),
        },
        token: {
          colorPrimary: '#1f1f1f',
          colorInfo: '#1677ff',
          ...(isDark
            ? {
                colorBgLayout: '#141414',
                colorBgContainer: '#1d1d1d',
                colorText: 'rgba(255,255,255,0.92)',
                colorTextSecondary: 'rgba(255,255,255,0.65)',
              }
            : {
                colorBgLayout: '#f0f2f5',
                colorBgContainer: '#ffffff',
                colorText: '#333333',
                colorTextSecondary: '#888888',
              }),
          borderRadius: 8,
          fontFamily:
            'Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="xiaoyu-ui-theme">
      <AntdProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            className: 'bg-slate-900 text-white border border-white/10 shadow-2xl',
            style: {
              borderRadius: '9999px',
              background: '#0f172a',
              color: '#fff',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              letterSpacing: '0.05em'
            },
            success: {
              iconTheme: {
                primary: '#4ade80',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#f87171',
                secondary: '#0f172a',
              },
            },
          }} 
        />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/403" element={<Forbidden />} />

              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<MainLayout />}>
                  <Route index element={<DashboardIndex />} />
                  <Route
                    path="dashboard"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route path="deduction" element={<TeacherWorkbench />} />
                  <Route path="workbench" element={<Navigate to="/dashboard/deduction" replace />} />
                  <Route
                    path="teachers"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <TeachersManagement />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="education/products"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <EducationProducts />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="education/library"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <EducationLibrary />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="education/dictionary"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <EducationDictionary />
                      </PrivateRoute>
                    }
                  />
                  <Route path="students" element={<AdminDashboard />} />
                  <Route path="schedule" element={<AdminSchedule />} />
                  <Route
                    path="history"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <History />
                      </PrivateRoute>
                    }
                  />
                  <Route path="notice" element={<Navigate to="/dashboard/history" replace />} />
                  <Route
                    path="finance"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <FinanceManagement />
                      </PrivateRoute>
                    }
                  />
                  <Route path="settings" element={<Navigate to="/dashboard/settings/basic" replace />} />
                  <Route
                    path="settings/basic"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <SettingsManagement />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="settings/roles"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <RolesPermissions />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="settings/audit"
                    element={
                      <PrivateRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <AuditLogs />
                      </PrivateRoute>
                    }
                  />
                  <Route path="personal-settings" element={<PersonalSettings />} />
                  <Route path="system" element={<Navigate to="/dashboard/settings/basic" replace />} />
                  <Route path="report" element={<ParentCenter />} />
                  <Route path="materials" element={<ParentCenter />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              <Route path="/parent-center" element={<Navigate to="/dashboard/report" replace />} />
              <Route path="/admin" element={<Navigate to="/dashboard/dashboard" replace />} />
              <Route path="/admin/*" element={<Navigate to="/dashboard/dashboard" replace />} />
              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/report/:id" element={<PublicReport />} />
            </Routes>
          </Router>
        </AuthProvider>
      </AntdProvider>
    </ThemeProvider>
  );
}

function DashboardIndex() {
  const { user: currentUser } = useAuth();
  return <Navigate to={currentUser?.role === ROLES.TEACHER ? 'deduction' : 'dashboard'} replace />;
}
