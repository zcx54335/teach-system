import { HashRouter as Router, Routes, Route } from "react-router-dom";
import RollerNavigation from "./components/Layout/RollerNavigation";
import ParentDashboard from "./pages/ParentDashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminRoute from "./components/Auth/AdminRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 公开展示页 */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 老师登录页 */}
        <Route path="/login" element={<Login />} />
        
        {/* 老师后台 (强鉴权) */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<RollerNavigation />} />
        </Route>

        {/* 家长端 (免登录，仅凭 ID 访问) */}
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </Router>
  );
}
