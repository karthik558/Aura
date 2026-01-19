import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileBarChart, 
  Ticket, 
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, path: "/", label: "Dashboard" },
  { icon: ClipboardList, path: "/tracker", label: "Tracker" },
  { icon: FileBarChart, path: "/reports", label: "Reports" },
  { icon: Ticket, path: "/tickets", label: "Tickets" },
  { icon: Users, path: "/users", label: "Users" },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-border/40" />
      
      {/* Navigation items */}
      <div className="relative flex items-stretch justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex-1 flex items-center justify-center py-3"
            >
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 inset-x-0 mx-auto w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              {/* Icon */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-colors duration-150",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )} 
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
