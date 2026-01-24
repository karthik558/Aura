import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  FileText, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  CheckCircle2
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PendingItemsTable } from "@/components/dashboard/PendingItemsTable";
import { PermitBarChart, PermitPieChart } from "@/components/dashboard/PermitStatusChart";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserAccess } from "@/context/UserAccessContext";

type PermitStats = {
  status: string;
  uploaded: boolean | null;
  created_at: string;
  last_updated_at: string | null;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const dashboardMessages = [
  "Let's make today productive! 🚀",
  "Your dashboard is ready for action.",
  "Stay on top of your permits and tasks.",
  "Another great day to track progress!",
  "Everything you need, all in one place.",
  "Ready to conquer the day ahead?",
  "Your assets are waiting for your attention.",
  "Time to check what's new today!",
  "Let's keep things moving forward.",
  "Success starts with staying organized.",
];

const getRandomMessage = () => {
  const randomIndex = Math.floor(Math.random() * dashboardMessages.length);
  return dashboardMessages[randomIndex];
};

const Index = () => {
  const { profile } = useUserAccess();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalThisWeek: 0,
    pending: 0,
    rejected: 0,
    pendingUpdates: 0,
    uploaded: 0,
    uploadedThisWeek: 0,
    approvedThisWeek: 0,
    uploadRate: 0,
    approvalRate: 0,
    avgProcessingDays: null as number | null,
  });
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");
  const greeting = getGreeting();
  const firstName = (profile?.name ?? "User").split(" ").filter(Boolean)[0] ?? "User";
  
  useDocumentTitle("Dashboard");

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("permits")
        .select("status, uploaded, created_at, last_updated_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load dashboard data", { description: error.message });
        setIsLoading(false);
        return;
      }

      const permits = (data ?? []) as PermitStats[];
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);

      const total = permits.length;
      const pending = permits.filter(p => p.status === "pending").length;
      const rejected = permits.filter(p => p.status === "rejected").length;
      const uploaded = permits.filter(p => p.status === "uploaded" || p.uploaded).length;
      const pendingUpdates = permits.filter(p => p.status === "approved" && !p.uploaded).length;
      const totalThisWeek = permits.filter(p => new Date(p.created_at) >= weekAgo).length;
      const uploadedThisWeek = permits.filter(p => (p.status === "uploaded" || p.uploaded) && new Date(p.created_at) >= weekAgo).length;
      const approvedThisWeek = permits.filter(p => p.status === "approved" && new Date(p.created_at) >= weekAgo).length;

      const uploadRate = total === 0 ? 0 : (uploaded / total) * 100;
      const approvalRate = totalThisWeek === 0 ? 0 : (approvedThisWeek / totalThisWeek) * 100;

      const uploadedPermits = permits.filter(p => p.status === "uploaded" && p.last_updated_at);
      const avgProcessingDays = uploadedPermits.length === 0
        ? null
        : uploadedPermits.reduce((sum, p) => {
            const createdAt = new Date(p.created_at).getTime();
            const updatedAt = new Date(p.last_updated_at as string).getTime();
            return sum + Math.max(0, updatedAt - createdAt);
          }, 0) / uploadedPermits.length / (1000 * 60 * 60 * 24);

      setStats({
        total,
        totalThisWeek,
        pending,
        rejected,
        pendingUpdates,
        uploaded,
        uploadedThisWeek,
        approvedThisWeek,
        uploadRate,
        approvalRate,
        avgProcessingDays: avgProcessingDays !== null ? Number(avgProcessingDays.toFixed(1)) : null,
      });

      setIsLoading(false);
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div 
        variants={item} 
        className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
      >
        {/* Greeting Header */}
        <div className="p-6 pb-4">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{formattedDate}</p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2">
            {greeting}, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            {getRandomMessage()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-4 pt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="stat-card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                +{stats.totalThisWeek}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Total Applied</p>
          </div>

          <div className="stat-card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-warning">{stats.pending}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Pending Approval</p>
          </div>

          <div className="stat-card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-danger" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-danger">{stats.rejected}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Rejected</p>
          </div>

          <div className="stat-card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-info" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stats.pendingUpdates}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Pending Updates</p>
          </div>

          <div className="stat-card-compact col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-lg">
                +{stats.uploadedThisWeek}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-success">{stats.uploaded}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Uploaded</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PermitBarChart />
        </div>
        <div>
          <PermitPieChart />
        </div>
      </motion.div>

      {/* Pending Items */}
      <motion.div variants={item}>
        <PendingItemsTable />
      </motion.div>

      {/* Performance Metrics */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Upload Rate</p>
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{stats.uploadRate.toFixed(1)}<span className="text-lg text-muted-foreground">%</span></p>
          <p className="text-xs text-muted-foreground mt-2">On-time uploads this month</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Approval Rate</p>
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{stats.approvalRate.toFixed(1)}<span className="text-lg text-muted-foreground">%</span></p>
          <p className="text-xs text-muted-foreground mt-2">Permits approved this week</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Avg. Processing</p>
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {stats.avgProcessingDays === null ? "—" : stats.avgProcessingDays}
            {stats.avgProcessingDays !== null && (
              <span className="text-lg text-muted-foreground ml-1">days</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-2">From submission to upload</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Index;
