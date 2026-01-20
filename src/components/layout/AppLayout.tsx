import { useState, useEffect, useMemo } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TopNav } from "./TopNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { cn } from "@/lib/utils";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { UserAccessProvider, useUserAccess } from "@/context/UserAccessContext";

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
  const { pageAccess, isAdmin, loading, canViewPage } = useUserAccess();

  useEffect(() => {
    setSidebarCollapsed(startCollapsed);
  }, [startCollapsed]);

  const firstAllowedPath = useMemo(() => {
    if (isAdmin) return "/";
    const firstAllowed = Object.values(pageAccess).find((access) => access.canView);
    if (!firstAllowed) return "/";
    return pathByPageId[firstAllowed.page] ?? "/";
  }, [isAdmin, pageAccess]);

  useEffect(() => {
    if (loading) return;
    const pageId = pageIdByPath[location.pathname];
    if (!pageId) return;
    if (isAdmin) return;
    if (pageId === "system-status") {
      navigate(firstAllowedPath, { replace: true });
      return;
    }
    if (!canViewPage(pageId)) {
      navigate(firstAllowedPath, { replace: true });
    }
  }, [loading, location.pathname, isAdmin, canViewPage, firstAllowedPath, navigate]);

  if (!loading) {
    const pageId = pageIdByPath[location.pathname];
    if (pageId && !isAdmin && !canViewPage(pageId)) {
      return <Navigate to={firstAllowedPath} replace />;
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

export function AppLayout() {
  return (
    <UserAccessProvider>
      <AppLayoutContent />
    </UserAccessProvider>
  );
}