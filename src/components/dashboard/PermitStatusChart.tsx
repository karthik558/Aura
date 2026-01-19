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
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const barData = [
  { name: "Mon", pending: 12, approved: 8, rejected: 2, uploaded: 6 },
  { name: "Tue", pending: 15, approved: 12, rejected: 3, uploaded: 10 },
  { name: "Wed", pending: 8, approved: 15, rejected: 1, uploaded: 14 },
  { name: "Thu", pending: 20, approved: 10, rejected: 4, uploaded: 8 },
  { name: "Fri", pending: 14, approved: 18, rejected: 2, uploaded: 16 },
  { name: "Sat", pending: 10, approved: 14, rejected: 1, uploaded: 12 },
  { name: "Sun", pending: 6, approved: 8, rejected: 0, uploaded: 7 },
];

const pieData = [
  { name: "Approved", value: 85, color: "hsl(var(--success))", percentage: 39 },
  { name: "Pending", value: 45, color: "hsl(var(--warning))", percentage: 21 },
  { name: "Uploaded", value: 73, color: "hsl(var(--primary))", percentage: 34 },
  { name: "Rejected", value: 13, color: "hsl(var(--danger))", percentage: 6 },
];

const areaData = [
  { name: "Week 1", value: 45 },
  { name: "Week 2", value: 52 },
  { name: "Week 3", value: 48 },
  { name: "Week 4", value: 70 },
  { name: "Week 5", value: 65 },
  { name: "Week 6", value: 85 },
];

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
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-medium transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Weekly Activity</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Status breakdown by day</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">+12.5%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} barGap={2} barSize={10}>
            <defs>
              <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="uploadedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="rejectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={1} />
                <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
              strokeOpacity={0.5}
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)", radius: 4 }} />
            <Bar dataKey="pending" name="Pending" fill="url(#pendingGradient)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="approved" name="Approved" fill="url(#approvedGradient)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="uploaded" name="Uploaded" fill="url(#uploadedGradient)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejected" name="Rejected" fill="url(#rejectedGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-auto pt-5 flex-wrap">
        {[
          { label: "Pending", color: "bg-warning" },
          { label: "Approved", color: "bg-success" },
          { label: "Uploaded", color: "bg-primary" },
          { label: "Rejected", color: "bg-danger" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", item.color)} />
            <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PermitPieChart() {
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-medium transition-all duration-300 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Status Distribution</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Current breakdown</p>
        </div>
      </div>

      {/* Chart with center text */}
      <div className="relative h-[200px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {pieData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="transition-all duration-200 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>
      
      {/* Legend Cards */}
      <div className="grid grid-cols-2 gap-2 mt-4 flex-1">
        {pieData.map((item, index) => (
          <motion.div 
            key={item.name} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors cursor-default"
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-card" 
              style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block truncate">{item.name}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">{item.value}</span>
                <span className="text-[10px] text-muted-foreground">({item.percentage}%)</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TrendAreaChart() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Permit Trend</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Last 6 weeks</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">+24%</span>
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