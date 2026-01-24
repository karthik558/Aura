import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  FileBarChart,
  Ticket,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserAccess } from "@/context/UserAccessContext";

const navItems = [
  { icon: LayoutDashboard, path: "/", label: "Home", pageId: "dashboard" },
  { icon: ClipboardList, path: "/tracker", label: "Tracker", pageId: "tracker" },
  { icon: FileBarChart, path: "/reports", label: "Reports", pageId: "reports" },
  { icon: Ticket, path: "/tickets", label: "Tickets", pageId: "tickets" },
  { icon: Users, path: "/users", label: "Users", pageId: "users" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { loading, isAdmin, canViewPage } = useUserAccess();

  const visibleNavItems = loading
    ? []
    : (isAdmin
        ? navItems
        : navItems.filter((item) => canViewPage(item.pageId)));

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      {/* Floating pill container */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-background/80 backdrop-blur-2xl rounded-[28px] border border-border/50 shadow-2xl shadow-black/10 dark:shadow-black/30"
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-transparent via-transparent to-white/5 pointer-events-none" />
        
        {/* Navigation items */}
        <div className="relative flex items-center justify-around px-3 py-2">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex items-center justify-center px-5 py-3"
              >
                {/* Active background - rounded rectangle pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-1 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Icon */}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.1 }}
                  className="relative z-10"
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground"
                    )} 
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
}
