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
  
  useDocumentTitle("Reports");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
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
              {[
                { metric: "Total Permits", current: "216", previous: "198", change: "+9.1%", positive: true },
                { metric: "Approved", current: "185", previous: "172", change: "+7.6%", positive: true },
                { metric: "Pending", current: "45", previous: "38", change: "+18.4%", positive: false },
                { metric: "Rejected", current: "13", previous: "15", change: "-13.3%", positive: true },
                { metric: "Uploaded to Portal", current: "130", previous: "112", change: "+16.1%", positive: true },
                { metric: "Avg. Processing Time", current: "2.3 days", previous: "2.8 days", change: "-17.9%", positive: true },
              ].map((row) => (
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
