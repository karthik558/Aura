import { useState, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TopNav } from "./TopNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { cn } from "@/lib/utils";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { UserAccessProvider, useUserAccess } from "@/context/UserAccessContext";
import NotFound from "@/pages/NotFound";

const pageIdByPath: Record<string, string> = {
  "/": "dashboard",
  "/tracker": "tracker",
  "/reports": "reports",
  "/tickets": "tickets",
  "/users": "users",
  "/settings": "settings",
  "/system-status": "system-status",
};

const pathByPageId: Record<string, string> = {
  dashboard: "/",
  tracker: "/tracker",
  reports: "/reports",
  tickets: "/tickets",
  users: "/users",
  settings: "/settings",
  "system-status": "/system-status",
};

function AppLayoutContent() {
  const { startCollapsed, stickyHeader, topNavMode } = useLayoutSettings();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(startCollapsed);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, loading, canViewPage } = useUserAccess();

  useEffect(() => {
    setSidebarCollapsed(startCollapsed);
  }, [startCollapsed]);

  const firstAllowedPath = useMemo(() => {
    if (isAdmin) return "/";
    for (const [path, pageId] of Object.entries(pageIdByPath)) {
      if (canViewPage(pageId)) {
        return path;
      }
    }
    return "/";
  }, [isAdmin, canViewPage]);

  useEffect(() => {
    if (loading) return;
    const pageId = pageIdByPath[location.pathname];
    if (!pageId) return;
    if (isAdmin) return;
    if (!canViewPage(pageId)) {
      navigate(firstAllowedPath, { replace: true });
    }
  }, [loading, location.pathname, isAdmin, canViewPage, firstAllowedPath, navigate]);

  if (!loading) {
    const pageId = pageIdByPath[location.pathname];
    if (pageId && !isAdmin && !canViewPage(pageId)) {
      return <NotFound />;
    }
  }

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
          "min-h-screen transition-all duration-300 pb-20 lg:pb-0",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
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

export function AppLayout() {
  return (
    <UserAccessProvider>
      <AppLayoutContent />
    </UserAccessProvider>
  );
}