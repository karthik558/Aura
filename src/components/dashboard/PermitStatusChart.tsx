import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  TooltipProps
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subDays, format as formatDate } from "date-fns";

type PermitRecord = {
  status: "pending" | "approved" | "rejected" | "uploaded";
  created_at: string;
};

// Custom Tooltip Component for proper dark mode support
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-lg p-3 min-w-[140px]">
      <p className="text-xs font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-xl shadow-lg p-3">
      <div className="flex items-center gap-2">
        <span 
          className="w-2.5 h-2.5 rounded-full shrink-0" 
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="text-xs font-medium text-foreground">{data.name}</span>
      </div>
      <p className="text-lg font-bold text-foreground mt-1">{data.value}</p>
      <p className="text-xs text-muted-foreground">{data.payload.percentage}% of total</p>
    </div>
  );
};

export function PermitBarChart() {
  const [permits, setPermits] = useState<PermitRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchPermits = async () => {
      const { data, error } = await supabase
        .from("permits")
        .select("status, created_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load chart data", { description: error.message });
        return;
      }

      setPermits((data ?? []) as PermitRecord[]);
    };

    fetchPermits();

    return () => {
      isMounted = false;
    };
  }, []);

  const barData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, idx) => subDays(new Date(), 6 - idx));
    return days.map((day) => {
      const key = formatDate(day, "EEE");
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayPermits = permits.filter((p) => {
        const created = new Date(p.created_at);
        return created >= dayStart && created <= dayEnd;
      });

      return {
        name: key,
        pending: dayPermits.filter(p => p.status === "pending").length,
        approved: dayPermits.filter(p => p.status === "approved").length,
        rejected: dayPermits.filter(p => p.status === "rejected").length,
        uploaded: dayPermits.filter(p => p.status === "uploaded").length,
      };
    });
  }, [permits]);
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Weekly Activity</h3>
          <p className="text-xs text-muted-foreground mt-1">Status breakdown by day</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-success/10 text-success border border-success/20">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">+12.5%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} barGap={4} barSize={12}>
            <defs>
              <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="uploadedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
              strokeOpacity={0.6}
            />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              dx={-10}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)", radius: 6 }} />
            <Bar dataKey="pending" name="Pending" fill="url(#pendingGradient)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="approved" name="Approved" fill="url(#approvedGradient)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="uploaded" name="Uploaded" fill="url(#uploadedGradient)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="rejected" name="Rejected" fill="url(#rejectedGradient)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-auto pt-5 flex-wrap">
        {[
          { label: "Pending", color: "bg-warning", border: "border-warning/30" },
          { label: "Approved", color: "bg-success", border: "border-success/30" },
          { label: "Uploaded", color: "bg-primary", border: "border-primary/30" },
          { label: "Rejected", color: "bg-danger", border: "border-danger/30" },
        ].map((item) => (
          <div key={item.label} className={cn("flex items-center gap-2 px-2.5 py-1 rounded-full border", item.border)}>
            <span className={cn("w-2 h-2 rounded-full", item.color)} />
            <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PermitPieChart() {
  const [permits, setPermits] = useState<PermitRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchPermits = async () => {
      const { data, error } = await supabase
        .from("permits")
        .select("status, created_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load chart data", { description: error.message });
        return;
      }

      setPermits((data ?? []) as PermitRecord[]);
    };

    fetchPermits();

    return () => {
      isMounted = false;
    };
  }, []);

  const pieData = useMemo(() => {
    const total = permits.length || 1;
    const approved = permits.filter(p => p.status === "approved").length;
    const pending = permits.filter(p => p.status === "pending").length;
    const uploaded = permits.filter(p => p.status === "uploaded").length;
    const rejected = permits.filter(p => p.status === "rejected").length;

    return [
      { name: "Approved", value: approved, color: "hsl(var(--success))", percentage: Math.round((approved / total) * 100) },
      { name: "Pending", value: pending, color: "hsl(var(--warning))", percentage: Math.round((pending / total) * 100) },
      { name: "Uploaded", value: uploaded, color: "hsl(var(--primary))", percentage: Math.round((uploaded / total) * 100) },
      { name: "Rejected", value: rejected, color: "hsl(var(--danger))", percentage: Math.round((rejected / total) * 100) },
    ];
  }, [permits]);

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Status Distribution</h3>
          <p className="text-xs text-muted-foreground mt-1">Current breakdown</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">{pieData.length}</span>
        </div>
      </div>

      {/* Chart with center text */}
      <div className="relative h-[180px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="hsl(var(--card))"
              strokeWidth={3}
              animationBegin={0}
              animationDuration={800}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground">{total}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</span>
        </div>
      </div>
      
      {/* Legend Cards */}
      <div className="grid grid-cols-2 gap-2.5 mt-5 flex-1">
        {pieData.map((item, index) => (
          <motion.div 
            key={item.name} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-all duration-200 cursor-default"
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-card" 
              style={{ backgroundColor: item.color, ringColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-foreground">{item.value}</span>
                <span className="text-[10px] text-muted-foreground font-medium">({item.percentage}%)</span>
              </div>
              <span className="text-[10px] text-muted-foreground block truncate font-medium">{item.name}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TrendAreaChart() {
  const [permits, setPermits] = useState<PermitRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchPermits = async () => {
      const { data, error } = await supabase
        .from("permits")
        .select("status, created_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load chart data", { description: error.message });
        return;
      }

      setPermits((data ?? []) as PermitRecord[]);
    };

    fetchPermits();

    return () => {
      isMounted = false;
    };
  }, []);

  const areaData = useMemo(() => {
    const weeks = Array.from({ length: 6 }, (_, idx) => {
      const end = subDays(new Date(), idx * 7);
      const start = subDays(new Date(), idx * 7 + 6);
      return { start, end, label: `Week ${6 - idx}` };
    }).reverse();

    return weeks.map((week) => {
      const count = permits.filter((p) => {
        const created = new Date(p.created_at);
        return created >= week.start && created <= week.end;
      }).length;
      return { name: week.label, value: count };
    });
  }, [permits]);

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Permit Trend</h3>
          <p className="text-xs text-muted-foreground mt-1">Last 6 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">+24%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={areaData}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              name="Permits"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}