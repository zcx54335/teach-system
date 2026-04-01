import { Home, Calendar, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: BottomNavItem[] = [
  { id: "home", label: "主页", icon: Home, path: "/" },
  { id: "schedule", label: "课表", icon: Calendar, path: "/schedule" },
  { id: "profile", label: "我的", icon: User, path: "/profile" },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] focus:outline-none"
            >
              <Icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? "text-primary" : "text-gray-400"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "text-primary font-medium" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
