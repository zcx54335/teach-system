import { Outlet } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";

export function MobileLayout() {
  return (
    <div className="flex flex-col min-h-screen-safe bg-background">
      {/* 
        Main content area 
        Padding bottom is added to prevent content from being hidden behind the bottom navigation.
        h-14 is 56px + safe area padding.
      */}
      <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}
