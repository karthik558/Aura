import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileBarChart, 
  Ticket, 
  Users, 
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Sun,
  Moon,
  LogOut,
  Check,
  Clock,
  AlertTriangle,
  ExternalLink,
  Globe,
  Cloud,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import auraLogo from "@/assets/aura-logo.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserAccess } from "@/context/UserAccessContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", pageId: "dashboard" },
  { icon: ClipboardList, label: "Tracker", path: "/tracker", pageId: "tracker" },
  { icon: FileBarChart, label: "Reports", path: "/reports", pageId: "reports" },
  { icon: Ticket, label: "Tickets", path: "/tickets", pageId: "tickets" },
];

const systemNavItems = [
  { icon: Users, label: "Users", path: "/users", pageId: "users" },
  { icon: Settings, label: "Settings", path: "/settings", pageId: "settings" },
  { icon: Activity, label: "System Status", path: "/system-status", pageId: "system-status" },
];

const quickLinks = [
  { 
    name: "ePermit Website", 
    url: "https://epermit.utl.gov.in", 
    icon: Globe,
    description: "Government permit portal"
  },
  { 
    name: "Oracle Cloud", 
    url: "https://mtcb2.oraclehospitality.ap-mumbai-1.ocs.oraclecloud.com/IHCLE/operacloud/", 
    icon: Cloud,
    description: "Opera Cloud PMS"
  },
];

const mockNotifications = [
  { id: 1, title: "Permit Expiring Soon", message: "Guest permit #1234 expires in 2 days", time: "5 min ago", type: "warning", read: false },
  { id: 2, title: "New Ticket Created", message: "Support ticket #567 needs attention", time: "1 hour ago", type: "info", read: false },
  { id: 3, title: "Upload Successful", message: "Bulk import completed with 45 records", time: "3 hours ago", type: "success", read: true },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, isAdmin, loading, canViewPage } = useUserAccess();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const displayName = profile?.name ?? "User";
  const roleLabel = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const visibleMainNavItems = useMemo(() => {
    if (loading) return [];
    if (isAdmin) return mainNavItems;
    return mainNavItems.filter((item) => canViewPage(item.pageId));
  }, [loading, isAdmin, canViewPage]);

  const visibleSystemNavItems = useMemo(() => {
    if (loading) return [];
    if (isAdmin) return systemNavItems;
    return systemNavItems.filter((item) => canViewPage(item.pageId));
  }, [loading, isAdmin, canViewPage]);

  const NavLink = ({ item, index }: { item: typeof mainNavItems[0]; index: number }) => {
    const isActive = location.pathname === item.path;
    
    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2.5"
        )}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <item.icon className={cn(
            "w-[18px] h-[18px] flex-shrink-0 transition-transform",
            !isActive && "group-hover:scale-110"
          )} />
        </motion.div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 + 0.1 }}
          >
            {item.label}
          </motion.span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "success": return <Check className="w-4 h-4 text-success" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Header - Logo & Collapse Toggle */}
      <div className={cn(
        "flex items-center h-14 border-b border-sidebar-border shrink-0",
        collapsed ? "justify-center px-2" : "px-3 justify-between"
      )}>
        <Link 
          to="/"
          className="flex items-center transition-colors hover:opacity-80"
        >
          <motion.img 
            src={auraLogo} 
            alt="Aura" 
            className={cn(
              "w-auto logo-accent transition-all duration-300",
              collapsed ? "h-5" : "h-7"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        </Link>
        
        {!collapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Collapse sidebar
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="px-2 py-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={onToggle}
                className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-2 space-y-1">
          {visibleMainNavItems.map((item, index) => (
            <NavLink key={item.path} item={item} index={index} />
          ))}
        </nav>

        <div className="px-4 py-3">
          <div className="border-t border-sidebar-border" />
        </div>

        <nav className="px-2 space-y-1">
          {visibleSystemNavItems.map((item, index) => (
            <NavLink key={item.path} item={item} index={index + visibleMainNavItems.length} />
          ))}
        </nav>

        <div className="px-4 py-3">
          <div className="border-t border-sidebar-border" />
        </div>

        {/* Quick Links */}
        <div className="px-2">
          <Popover>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200",
                    collapsed && "justify-center px-2.5"
                  )}>
                    <ExternalLink className="w-[18px] h-[18px]" />
                    {!collapsed && <span>Quick Links</span>}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={10}>
                  Quick Links
                </TooltipContent>
              )}
            </Tooltip>
            <PopoverContent 
              side="right" 
              align="start"
              sideOffset={10}
              className="w-64 p-2"
            >
              <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                External Links
              </p>
              <div className="space-y-1">
                {quickLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <link.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-2 pb-2">
        {isAdmin && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to="/system-status"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 hover:bg-success/15 transition-all duration-200",
                  collapsed && "justify-center px-2"
                )}
              >
                <Activity className="w-4 h-4 text-success" />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-success">All Systems</p>
                    <p className="text-[10px] text-success/70">Operational</p>
                  </div>
                )}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={10}>
                <p className="font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
      <div className="p-2 border-t border-sidebar-border space-y-1 shrink-0">
        {/* Notifications */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200",
                  collapsed && "justify-center px-2.5"
                )}>
                  <div className="relative">
                    <Bell className="w-[18px] h-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-danger ring-2 ring-sidebar-background" />
                    )}
                  </div>
                  {!collapsed && <span>Notifications</span>}
                  {!collapsed && unreadCount > 0 && (
                    <span className="ml-auto text-xs bg-danger/15 text-danger px-1.5 py-0.5 rounded-full font-semibold">{unreadCount}</span>
                  )}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={10}>
                Notifications ({unreadCount})
              </TooltipContent>
            )}
          </Tooltip>
          <PopoverContent 
            side="right" 
            align="end"
            sideOffset={10}
            className="w-80 p-0"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              <AnimatePresence>
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm",
                              !notification.read && "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {notification.time}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button 
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200",
                collapsed && "justify-center px-2.5"
              )}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === "dark" ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === "dark" ? (
                  <Sun className="w-[18px] h-[18px]" />
                ) : (
                  <Moon className="w-[18px] h-[18px]" />
                )}
              </motion.div>
              {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={10}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </TooltipContent>
          )}
        </Tooltip>

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 p-2.5 rounded-lg bg-sidebar-accent/50 mt-2 transition-all duration-200",
          collapsed && "justify-center p-2"
        )}>
          <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-sidebar-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{displayName}</p>
              <p className="text-[11px] text-sidebar-muted truncate">{roleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-muted hover:text-danger transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Copyright */}
        {!collapsed && (
          <p className="text-[10px] text-sidebar-muted/60 text-center mt-3 pb-1">
            © 2026 Aura. All rights reserved.
          </p>
        )}
      </div>
    </aside>
  );
}