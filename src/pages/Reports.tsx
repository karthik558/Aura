import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { PermitBarChart, PermitPieChart } from "@/components/dashboard/PermitStatusChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

const reportTypes = [
  { title: "Daily Summary", description: "Overview of permits processed today", icon: Calendar, color: "bg-primary/10 text-primary" },
  { title: "Weekly Report", description: "Week-over-week permit analysis", icon: BarChart3, color: "bg-success/10 text-success" },
  { title: "Status Breakdown", description: "Distribution by permit status", icon: PieChart, color: "bg-warning/10 text-warning" },
  { title: "Performance Metrics", description: "Upload rates and processing times", icon: TrendingUp, color: "bg-info/10 text-info" },
];

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

const Reports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summaryRows, setSummaryRows] = useState<Array<{
    metric: string;
    current: string;
    previous: string;
    change: string;
    positive: boolean;
  }>>([]);
  
  useDocumentTitle("Reports");

  useEffect(() => {
    let isMounted = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("permits")
        .select("status, uploaded, created_at, last_updated_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load report data", { description: error.message });
        setIsLoading(false);
        return;
      }

      const permits = (data ?? []) as Tables<"permits">[];
      const now = new Date();
      const thisWeekStart = new Date();
      thisWeekStart.setDate(now.getDate() - 7);
      const lastWeekStart = new Date();
      lastWeekStart.setDate(now.getDate() - 14);

      const within = (d: string, start: Date, end: Date) => {
        const date = new Date(d);
        return date >= start && date <= end;
      };

      const currentWeek = permits.filter(p => within(p.created_at, thisWeekStart, now));
      const lastWeek = permits.filter(p => within(p.created_at, lastWeekStart, thisWeekStart));

      const countBy = (list: typeof permits, status: string) => list.filter(p => p.status === status).length;
      const uploadedCount = (list: typeof permits) => list.filter(p => p.status === "uploaded" || p.uploaded).length;

      const formatChange = (current: number, previous: number) => {
        if (previous === 0) {
          return current === 0 ? "0%" : "+100%";
        }
        const diff = ((current - previous) / previous) * 100;
        const sign = diff >= 0 ? "+" : "";
        return `${sign}${diff.toFixed(1)}%`;
      };

      const avgProcessingDays = (list: typeof permits) => {
        const uploaded = list.filter(p => p.status === "uploaded" && p.last_updated_at);
        if (uploaded.length === 0) return null;
        const totalDays = uploaded.reduce((sum, p) => {
          const created = new Date(p.created_at).getTime();
          const updated = new Date(p.last_updated_at as string).getTime();
          return sum + Math.max(0, updated - created);
        }, 0) / (1000 * 60 * 60 * 24);
        return Number((totalDays / uploaded.length).toFixed(1));
      };

      const rows = [
        {
          metric: "Total Permits",
          current: String(currentWeek.length),
          previous: String(lastWeek.length),
          change: formatChange(currentWeek.length, lastWeek.length),
          positive: currentWeek.length >= lastWeek.length,
        },
        {
          metric: "Approved",
          current: String(countBy(currentWeek, "approved")),
          previous: String(countBy(lastWeek, "approved")),
          change: formatChange(countBy(currentWeek, "approved"), countBy(lastWeek, "approved")),
          positive: countBy(currentWeek, "approved") >= countBy(lastWeek, "approved"),
        },
        {
          metric: "Pending",
          current: String(countBy(currentWeek, "pending")),
          previous: String(countBy(lastWeek, "pending")),
          change: formatChange(countBy(currentWeek, "pending"), countBy(lastWeek, "pending")),
          positive: countBy(currentWeek, "pending") <= countBy(lastWeek, "pending"),
        },
        {
          metric: "Rejected",
          current: String(countBy(currentWeek, "rejected")),
          previous: String(countBy(lastWeek, "rejected")),
          change: formatChange(countBy(currentWeek, "rejected"), countBy(lastWeek, "rejected")),
          positive: countBy(currentWeek, "rejected") <= countBy(lastWeek, "rejected"),
        },
        {
          metric: "Uploaded to Portal",
          current: String(uploadedCount(currentWeek)),
          previous: String(uploadedCount(lastWeek)),
          change: formatChange(uploadedCount(currentWeek), uploadedCount(lastWeek)),
          positive: uploadedCount(currentWeek) >= uploadedCount(lastWeek),
        },
        {
          metric: "Avg. Processing Time",
          current: avgProcessingDays(currentWeek) === null ? "—" : `${avgProcessingDays(currentWeek)} days`,
          previous: avgProcessingDays(lastWeek) === null ? "—" : `${avgProcessingDays(lastWeek)} days`,
          change: "—",
          positive: true,
        },
      ];

      setSummaryRows(rows);
      setIsLoading(false);
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <ReportsSkeleton />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <Breadcrumbs />
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground mt-1">Generate and export permit reports</p>
        </div>
        <div className="flex gap-2">
          <DateFilter />
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </motion.div>

      {/* Quick Report Types */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <div 
            key={report.title} 
            className="bg-card rounded-xl border border-border p-5 hover:shadow-soft transition-all cursor-pointer group"
          >
            <div className={`w-11 h-11 rounded-lg ${report.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <report.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-primary hover:text-primary">
              <Download className="w-4 h-4" />
              Generate
            </Button>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PermitBarChart />
        <PermitPieChart />
      </motion.div>

      {/* Summary Table */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">Monthly Summary</h3>
            <p className="text-sm text-muted-foreground">January 2026 permit statistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="text-right">This Week</th>
                <th className="text-right">Last Week</th>
                <th className="text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.metric}>
                  <td className="font-medium">{row.metric}</td>
                  <td className="text-right">{row.current}</td>
                  <td className="text-right text-muted-foreground">{row.previous}</td>
                  <td className={`text-right font-medium ${row.positive ? "text-success" : "text-danger"}`}>
                    {row.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Reports;
