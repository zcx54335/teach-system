import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ParentDashboard from "./pages/ParentDashboard";
import ParentCenter from "./pages/ParentCenter";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminRoute from "./components/Auth/AdminRoute";
import MainLayout from "./components/Layout/MainLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSchedule from "./pages/AdminSchedule";
import SystemManagement from "./pages/SystemManagement";
import TeacherWorkbench from "./pages/TeacherWorkbench";
import PublicReport from "./pages/PublicReport";
import Profile from "./pages/Profile";
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <>
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
      <Router>
      <Routes>
        {/* 公开展示页 */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 老师登录页 */}
        <Route path="/login" element={<Login />} />
        
        {/* 全局布局与权限路由 */}
        <Route element={<AdminRoute />}>
          <Route path="/dashboard" element={<MainLayout />}>
            <Route index element={<Navigate to="workbench" replace />} />
            <Route path="workbench" element={<TeacherWorkbench />} />
            <Route path="students" element={<AdminDashboard />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="system" element={<SystemManagement />} />
            <Route path="report" element={<ParentCenter />} />
            <Route path="materials" element={<ParentCenter />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* 家长专属中心 (登录后兼容) */}
        <Route path="/parent-center" element={<Navigate to="/dashboard/report" replace />} />
        
        {/* 老师后台 (兼容老链接) */}
        <Route path="/admin" element={<Navigate to="/dashboard/workbench" replace />} />
        <Route path="/admin/*" element={<Navigate to="/dashboard/workbench" replace />} />

        {/* 家长端 (免登录，仅凭 ID 访问的公开版，保留兼容老链接) */}
        <Route path="/parent" element={<ParentDashboard />} />

        {/* 公开扫码报告页 */}
        <Route path="/report/:id" element={<PublicReport />} />
      </Routes>
    </Router>
    </>
  );
}
