import { HashRouter as Router, Routes, Route } from "react-router-dom";
import RollerNavigation from "./components/Layout/RollerNavigation";
import ParentDashboard from "./pages/ParentDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RollerNavigation />} />
        {/* 为家长端配置独立路由 */}
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </Router>
  );
}
