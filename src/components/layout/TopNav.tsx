import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileBarChart, 
  Ticket, 
  Users, 
  Settings,
  Activity,
  Bell,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Globe,
  Cloud,
  Check,
  Clock,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import auraLogo from "@/assets/aura-logo.png";
import { useUserAccess } from "@/context/UserAccessContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

interface TopNavProps {
  stickyHeader: boolean;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", pageId: "dashboard" },
  { icon: ClipboardList, label: "Tracker", path: "/tracker", pageId: "tracker" },
  { icon: FileBarChart, label: "Reports", path: "/reports", pageId: "reports" },
  { icon: Ticket, label: "Tickets", path: "/tickets", pageId: "tickets" },
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

export function TopNav({ stickyHeader }: TopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { profile, isAdmin, loading, canViewPage } = useUserAccess();
  const [notifications, setNotifications] = useState<Database["public"]["Tables"]["notifications"]["Row"][]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "success": return <Check className="w-4 h-4 text-success" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const visibleNavItems = loading
    ? []
    : (isAdmin
        ? navItems
        : navItems.filter((item) => canViewPage(item.pageId)));

  return (
    <header 
      className={cn(
        "z-40 bg-sidebar-background border-b border-sidebar-border h-14 hidden lg:block",
        stickyHeader ? "fixed top-0 left-0 right-0" : "relative"
      )}
    >
      <div className="relative flex items-center h-full px-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src={auraLogo} 
            alt="Aura" 
            className="h-7 w-auto logo-accent"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Links */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-sidebar-muted hover:text-sidebar-foreground">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
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
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <link.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Notifications */}
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-sidebar-muted hover:text-sidebar-foreground relative">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-sidebar-background" />
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <PopoverContent align="end" className="w-80 p-0">
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
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-lg text-sidebar-muted hover:text-sidebar-foreground"
                onClick={toggleTheme}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === "dark" ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2 rounded-lg">
                <Avatar className="w-7 h-7 ring-2 ring-sidebar-border">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-sidebar-foreground">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}