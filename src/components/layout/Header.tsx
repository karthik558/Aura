import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Clock, FileText, User, Ticket, ArrowRight, Menu, LayoutDashboard, ClipboardList, FileBarChart, Settings, LogOut, Moon, Sun, Activity, Bell, Check, AlertTriangle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import auraLogo from "@/assets/aura-logo.png";
import { useUserAccess } from "@/context/UserAccessContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "permit" | "user" | "ticket" | "page";
  path: string;
  permitId?: string;
}

const RECENT_SEARCHES_KEY = "aura_recent_searches";

const pageResults: SearchResult[] = [
  { id: "page-dashboard", title: "Dashboard", subtitle: "View analytics and overview", type: "page", path: "/" },
  { id: "page-tracker", title: "Tracker", subtitle: "Manage all permits", type: "page", path: "/tracker" },
  { id: "page-reports", title: "Reports", subtitle: "Generate and view reports", type: "page", path: "/reports" },
  { id: "page-tickets", title: "Tickets", subtitle: "Support and requests", type: "page", path: "/tickets" },
  { id: "page-settings", title: "Settings", subtitle: "Preferences and configuration", type: "page", path: "/settings" },
];

const mobileNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", pageId: "dashboard" },
  { icon: ClipboardList, label: "Tracker", path: "/tracker", pageId: "tracker" },
  { icon: FileBarChart, label: "Reports", path: "/reports", pageId: "reports" },
  { icon: Ticket, label: "Tickets", path: "/tickets", pageId: "tickets" },
  { icon: Activity, label: "System Status", path: "/system-status", pageId: "system-status" },
  { icon: Settings, label: "Settings", path: "/settings", pageId: "settings" },
];

const getResultIcon = (type: SearchResult["type"]) => {
  switch (type) {
    case "permit": return FileText;
    case "user": return User;
    case "ticket": return Ticket;
    default: return ArrowRight;
  }
};

interface HeaderProps {
  stickyHeader?: boolean;
}

export function Header({ stickyHeader = true }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [permitResults, setPermitResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Tables<"notifications">[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { canViewPage, profile } = useUserAccess();
  const { theme, setTheme } = useTheme();

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

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "success":
        return <Check className="w-4 h-4 text-success" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const pageMatches = pageResults.filter(result =>
      result.title.toLowerCase().includes(normalizedQuery) ||
      result.subtitle.toLowerCase().includes(normalizedQuery)
    );
    const permitMatches = permitResults.filter(result =>
      result.title.toLowerCase().includes(normalizedQuery) ||
      result.subtitle.toLowerCase().includes(normalizedQuery)
    );
    return [...permitMatches, ...pageMatches].slice(0, 12);
  }, [normalizedQuery, permitResults]);

  useEffect(() => {
    if (!searchOpen) return;

    const fetchPermits = async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from("permits")
        .select("id, permit_code, confirmation_number, guest_name, name, property, arrival_date, status")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        setPermitResults([]);
        setIsSearching(false);
        return;
      }

      const mapped = ((data ?? []) as Tables<"permits">[]).map((permit) => {
        const permitId = permit.permit_code ?? permit.id;
        return {
          id: `permit-${permit.id}`,
          title: permit.guest_name || permit.name || permitId,
          subtitle: `${permitId} • ${permit.confirmation_number ?? "—"} • ${permit.property ?? "—"}`,
          type: "permit" as const,
          path: "/tracker",
          permitId,
        };
      });

      setPermitResults(mapped);
      setIsSearching(false);
    };

    fetchPermits();
  }, [searchOpen]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 5));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Handle keyboard navigation in results
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      navigate(filteredResults[selectedIndex].path);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [filteredResults, selectedIndex, navigate]);

  const handleResultClick = (result: SearchResult) => {
    if (searchQuery.trim()) {
      const next = [searchQuery.trim(), ...recentSearches.filter((item) => item !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    }
    if (result.type === "permit" && result.permitId) {
      navigate(result.path, { state: { openPermitId: result.permitId } });
    } else {
      navigate(result.path);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <>
      <header className={cn(
        "z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 lg:border-0 lg:bg-transparent lg:backdrop-blur-none",
        stickyHeader ? "sticky top-0" : "relative"
      )}>
        <div className="flex items-center h-14 px-4 lg:px-6">
          {/* Mobile: Sidebar + Search */}
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85%] max-w-[320px] border-0 bg-transparent [&>button]:hidden">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-[calc(100%-32px)] my-4 ml-4 flex flex-col bg-background/95 backdrop-blur-xl rounded-3xl border border-border/40 shadow-2xl overflow-hidden"
                >
                  {/* Header */}
                  <SheetHeader className="px-5 pt-5 pb-3">
                    <SheetTitle className="flex items-center justify-center">
                      <img src={auraLogo} alt="Aura" className="h-8 w-auto logo-accent" />
                    </SheetTitle>
                  </SheetHeader>

                  {/* User Card */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10">
                      <Avatar className="w-11 h-11 ring-2 ring-primary/20 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold">
                          {initials || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Navigation</p>
                    <div className="space-y-1">
                      {mobileNavItems
                        .filter((item) => canViewPage(item.pageId))
                        .map((item, index) => {
                          const isActive = location.pathname === item.path;
                          return (
                            <motion.button
                              key={item.path}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => {
                                navigate(item.path);
                                setMobileSidebarOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200",
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-[0.98]"
                              )}
                            >
                              <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                                isActive ? "bg-primary-foreground/20" : "bg-muted/80"
                              )}>
                                <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-primary-foreground")} />
                              </div>
                              <span className="font-medium">{item.label}</span>
                              {isActive && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground/50" />
                              )}
                            </motion.button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 space-y-2 border-t border-border/40">
                    {/* Theme Toggle */}
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted/80 flex items-center justify-center">
                        {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                      </div>
                      <span className="font-medium">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    
                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <LogOut className="w-[18px] h-[18px]" />
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Desktop: Search Trigger */}
          <div className="hidden lg:flex flex-1 max-w-md">
            <button 
              onClick={() => setSearchOpen(true)}
              className="relative w-full group"
            >
              <div className="flex items-center w-full h-10 px-3.5 bg-card border border-border/50 hover:border-border rounded-xl text-sm shadow-soft transition-all cursor-pointer">
                <Search className="w-4 h-4 text-muted-foreground mr-3" />
                <span className="text-muted-foreground">Search permits, guests...</span>
                <div className="ml-auto flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
            </button>
          </div>

          {/* Mobile: Center Logo */}
          <div className="flex-1 flex justify-center lg:hidden">
            <Link to="/" className="flex items-center">
              <img
                src={auraLogo}
                alt="Aura"
                className="h-5 w-auto logo-accent"
              />
            </Link>
          </div>

          {/* Mobile: Notifications + Avatar */}
          <div className="flex items-center gap-2 lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {notifications.length === 0
                      ? "You're all caught up."
                      : `${unreadCount} unread`}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                ) : (
                  notifications.slice(0, 6).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className="items-start gap-2"
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-4">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                  <Avatar className="w-7 h-7 ring-2 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>
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

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Search</DialogTitle>
          
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyNavigation}
              placeholder="Search permits, guests, confirmation #, or pages..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 text-base"
              autoFocus
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Results Area */}
          <div className="max-h-[400px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {searchQuery.length === 0 ? (
                /* Recent Searches */
                <motion.div
                  key="recent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3"
                >
                  {recentSearches.length > 0 && (
                    <>
                      <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Recent Searches</p>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(search)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                          >
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{search}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="border-t border-border mt-3 pt-3">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Quick Links</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: "Dashboard", path: "/", pageId: "dashboard" },
                        { label: "Tracker", path: "/tracker", pageId: "tracker" },
                        { label: "Reports", path: "/reports", pageId: "reports" },
                        { label: "Tickets", path: "/tickets", pageId: "tickets" },
                        { label: "Settings", path: "/settings", pageId: "settings" },
                        { label: "System Status", path: "/system-status", pageId: "system-status" },
                      ]
                        .filter((link) => canViewPage(link.pageId))
                        .map((link) => (
                          <button
                            key={link.path}
                            onClick={() => {
                              navigate(link.path);
                              setSearchOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                          >
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span>{link.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </motion.div>
              ) : filteredResults.length > 0 ? (
                /* Search Results */
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-2"
                >
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Results ({filteredResults.length})
                    </p>
                    {isSearching && (
                      <span className="text-[11px] text-muted-foreground">Updating…</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {filteredResults.map((result, index) => {
                      const Icon = getResultIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                            index === selectedIndex 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            index === selectedIndex 
                              ? "bg-primary/20" 
                              : "bg-muted"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                          {index === selectedIndex && (
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* No Results */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center"
                >
                  <Search className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No results found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching for something else
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="h-5 w-5 inline-flex items-center justify-center rounded border bg-background text-[10px]">↑</kbd>
                <kbd className="h-5 w-5 inline-flex items-center justify-center rounded border bg-background text-[10px]">↓</kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-5 px-1.5 inline-flex items-center justify-center rounded border bg-background text-[10px]">↵</kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="h-5 px-1.5 inline-flex items-center justify-center rounded border bg-background text-[10px]">Esc</kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}