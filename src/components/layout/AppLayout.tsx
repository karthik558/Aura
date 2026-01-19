import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TopNav } from "./TopNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { cn } from "@/lib/utils";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";

export function AppLayout() {
  const { startCollapsed, stickyHeader, topNavMode } = useLayoutSettings();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(startCollapsed);

  // Sync with startCollapsed setting when it changes
  useEffect(() => {
    setSidebarCollapsed(startCollapsed);
  }, [startCollapsed]);

  if (topNavMode) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <TopNav stickyHeader={stickyHeader} />

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* Main Content */}
        <div className="min-h-screen pt-14 pb-20 lg:pb-0">
          <Header stickyHeader={stickyHeader} />
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Main Content */}
      <div 
        className={cn(
          "min-h-screen transition-all duration-200 pb-20 lg:pb-0",
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-60"
        )}
      >
        <Header stickyHeader={stickyHeader} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}