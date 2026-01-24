import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "tracker": "Tracker",
  "reports": "Reports",
  "tickets": "Tickets",
  "users": "Users",
  "settings": "Settings",
  "privacy-policy": "Privacy Policy",
  "cookies": "Cookie Policy",
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) return null;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
  ];

  let currentPath = "";
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    breadcrumbs.push({ label, path: currentPath });
  });

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="Breadcrumb"
      className="mb-6"
    >
      <div className="inline-flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <div key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 mx-0.5" />
              )}
              
              {isLast ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200",
                    isFirst && "pr-2"
                  )}
                >
                  {isFirst && (
                    <div className="w-5 h-5 rounded-lg bg-muted/80 flex items-center justify-center">
                      <Home className="w-3 h-3" />
                    </div>
                  )}
                  <span>{crumb.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </motion.nav>
  );
}