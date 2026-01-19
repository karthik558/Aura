import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change,
  variant = "default",
  className 
}: StatCardProps) {
  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  const dotColors = {
    default: "bg-muted-foreground",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("w-2 h-2 rounded-full", dotColors[variant])} />
        <Icon className={cn("w-4 h-4", iconColors[variant])} />
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{title}</p>
      {change && (
        <p className="text-xs text-muted-foreground mt-2">{change}</p>
      )}
    </div>
  );
}
