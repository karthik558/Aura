import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Database } from "@/integrations/supabase/types";

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

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, isAdmin, loading, canViewPage } = useUserAccess();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let isMounted = true;

    const loadTicketCount = async () => {
      if (!profile?.authUserId) {
        setTicketCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", profile.authUserId)
        .in("status", ["open", "in_progress"]);

      if (!isMounted) return;
      if (!error) {
        setTicketCount(count ?? 0);
      }
    };

    loadTicketCount();
    return () => {
      isMounted = false;
    };
  }, [profile?.authUserId]);

  const loadNotifications = useCallback(async () => {
    if (!profile?.authUserId) {
      setNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, message, type, read, created_at")
      .eq("user_id", profile.authUserId)
      .order("created_at", { ascending: false });

    if (!error) {
      setNotifications(data ?? []);
    }
  }, [profile?.authUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const markAsRead = async (id: string) => {
    if (!profile?.authUserId) return;

    const { error } = await (supabase
      .from("notifications") as any)
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", profile.authUserId);

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.authUserId) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", profile.authUserId);

    if (!error) {
      setNotifications([]);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
    const base = isAdmin
      ? systemNavItems
      : systemNavItems.filter((item) => canViewPage(item.pageId));

    if (!isAdmin && canViewPage("system-status")) {
      return [...base, { icon: Activity, label: "System Status", path: "/system-status", pageId: "system-status" }];
    }

    return base;
  }, [loading, isAdmin, canViewPage]);

  const NavLink = ({ item, index }: { item: typeof mainNavItems[0]; index: number }) => {
    const isActive = location.pathname === item.path;
    const showTicketBadge = item.pageId === "tickets" && ticketCount > 0;
    
    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/80",
          collapsed && "justify-center px-2.5"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-primary rounded-xl"
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          />
        )}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative z-10"
        >
          <item.icon className={cn(
            "w-[18px] h-[18px] flex-shrink-0 transition-all duration-200",
            !isActive && "group-hover:scale-110",
            isActive && "text-primary-foreground"
          )} />
        </motion.div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 + 0.1 }}
            className="flex-1 relative z-10"
          >
            {item.label}
          </motion.span>
        )}
        {showTicketBadge && !collapsed && (
          <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-danger text-danger-foreground text-[10px] font-bold px-1.5 shadow-sm relative z-10">
            {ticketCount}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-medium">
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
        "fixed left-0 top-0 z-40 h-screen bg-sidebar-background border-r border-sidebar-border/60 transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header - Logo & Collapse Toggle */}
      <div className={cn(
        "flex items-center h-16 border-b border-sidebar-border/60 shrink-0",
        collapsed ? "justify-center px-3" : "px-4 justify-between"
      )}>
        <AnimatePresence mode="wait">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button
                  key="expand-btn"
                  onClick={onToggle}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="p-2.5 rounded-xl text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200"
                >
                  <PanelLeft className="w-5 h-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          ) : (
            <motion.div
              key="logo-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between w-full"
            >
              <Link 
                to="/"
                className="flex items-center transition-opacity hover:opacity-80"
              >
                <img 
                  src={auraLogo} 
                  alt="Aura" 
                  className="h-8 w-auto logo-accent"
                />
              </Link>
              
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggle}
                    className="p-2 rounded-xl text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Collapse sidebar
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <p className="px-4 mb-2 text-[10px] font-semibold text-sidebar-muted/70 uppercase tracking-wider">
            Main Menu
          </p>
        )}
        <nav className="px-3 space-y-1">
          {visibleMainNavItems.map((item, index) => (
            <NavLink key={item.path} item={item} index={index} />
          ))}
        </nav>

        <div className="px-4 py-4">
          <div className="border-t border-sidebar-border/40" />
        </div>

        {!collapsed && (
          <p className="px-4 mb-2 text-[10px] font-semibold text-sidebar-muted/70 uppercase tracking-wider">
            System
          </p>
        )}
        <nav className="px-3 space-y-1">
          {visibleSystemNavItems.map((item, index) => (
            <NavLink key={item.path} item={item} index={index + visibleMainNavItems.length} />
          ))}
        </nav>

        <div className="px-4 py-4">
          <div className="border-t border-sidebar-border/40" />
        </div>

        {/* Quick Links */}
        <div className="px-3">
          <Popover>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200",
                    collapsed && "justify-center px-2.5"
                  )}>
                    <ExternalLink className="w-[18px] h-[18px]" />
                    {!collapsed && <span>Quick Links</span>}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={12}>
                  Quick Links
                </TooltipContent>
              )}
            </Tooltip>
            <PopoverContent 
              side="right" 
              align="start"
              sideOffset={12}
              className="w-80 p-0 overflow-hidden border-border/60 shadow-xl"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Quick Links</p>
                    <p className="text-[11px] text-muted-foreground">Access external resources</p>
                  </div>
                </div>
              </div>
              
              {/* Links */}
              <div className="p-2">
                {quickLinks.map((link, index) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent/60 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-200 shadow-sm">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{link.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/10 transition-all duration-200">
                      <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </a>
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2.5 bg-muted/30 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground text-center">Links open in a new tab</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-3 pb-2">
        {isAdmin && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                to="/system-status"
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-success/10 hover:bg-success/15 transition-all duration-200",
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
              <TooltipContent side="right" sideOffset={12}>
                <p className="font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
      <div className="p-3 border-t border-sidebar-border/40 space-y-1.5 shrink-0">
        {/* Notifications */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200",
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
                    <span className="ml-auto text-[10px] bg-danger/15 text-danger px-1.5 py-0.5 rounded-lg font-bold">{unreadCount}</span>
                  )}
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={12}>
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
                              {formatTimeAgo(notification.created_at)}
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200",
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
            <TooltipContent side="right" sideOffset={12}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </TooltipContent>
          )}
        </Tooltip>

        {/* User Profile */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-sidebar-accent/60 to-sidebar-accent/30 mt-2 transition-all duration-200",
          collapsed && "justify-center p-2.5"
        )}>
          <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-sidebar-border/50">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">{displayName}</p>
              <p className="text-[11px] text-sidebar-muted truncate">{roleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-muted hover:text-danger transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Sign out
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Copyright */}
        {!collapsed && (
          <p className="text-[10px] text-sidebar-muted/50 text-center mt-4 pb-1">
            © 2026 Aura. All rights reserved.
          </p>
        )}
      </div>
    </aside>
  );
}