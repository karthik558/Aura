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

  const bgColors = {
    default: "bg-muted/50",
    primary: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-danger/10",
  };

  const valueColors = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  return (
    <div className={cn("stat-card group", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", bgColors[variant])}>
          <Icon className={cn("w-5 h-5", iconColors[variant])} />
        </div>
        {change && (
          <span className={cn(
            "text-[10px] font-semibold px-2 py-1 rounded-lg",
            change.startsWith("+") ? "text-success bg-success/10" : "text-danger bg-danger/10"
          )}>
            {change}
          </span>
        )}
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", valueColors[variant])}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5 font-medium">{title}</p>
    </div>
  );
}
