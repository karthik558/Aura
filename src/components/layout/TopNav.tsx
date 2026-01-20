import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileBarChart, 
  Ticket, 
  Users, 
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Globe,
  Cloud
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

  const visibleNavItems = (loading || isAdmin)
    ? navItems
    : navItems.filter((item) => canViewPage(item.pageId));

  return (
    <header 
      className={cn(
        "z-40 bg-sidebar-background border-b border-sidebar-border h-14 hidden lg:block",
        stickyHeader ? "fixed top-0 left-0 right-0" : "relative"
      )}
    >
      <div className="flex items-center h-full px-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center mr-8">
          <img 
            src={auraLogo} 
            alt="Aura" 
            className="h-7 w-auto logo-accent"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 flex-1">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-sidebar-muted hover:text-sidebar-foreground relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-sidebar-background" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

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