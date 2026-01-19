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
  const [isLoading, setIsLoading] = useState(true);
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");
  const greeting = getGreeting();
  
  useDocumentTitle("Dashboard");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
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
      {/* Welcome Card with Stats */}
      <motion.div 
        variants={item} 
        className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft"
      >
        {/* Greeting Header */}
        <div className="p-6 pb-5">
          <p className="text-sm text-muted-foreground font-medium tracking-wide">{formattedDate}</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-2">
            {greeting}, <span className="text-gradient">Karthik</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-3">
            {getRandomMessage()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-muted/30 hover:bg-muted/50 rounded-xl p-4 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">216</p>
            <p className="text-xs text-muted-foreground mt-1">Total Applied</p>
            <p className="text-xs text-primary font-medium mt-2">+12 this week</p>
          </div>

          <div className="bg-muted/30 hover:bg-muted/50 rounded-xl p-4 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-warning">45</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Approval</p>
          </div>

          <div className="bg-muted/30 hover:bg-muted/50 rounded-xl p-4 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-danger" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-danger">13</p>
            <p className="text-xs text-muted-foreground mt-1">Rejected</p>
          </div>

          <div className="bg-muted/30 hover:bg-muted/50 rounded-xl p-4 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">28</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Updates</p>
          </div>

          <div className="bg-muted/30 hover:bg-muted/50 rounded-xl p-4 transition-colors group col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-success">130</p>
            <p className="text-xs text-muted-foreground mt-1">Uploaded</p>
            <p className="text-xs text-success font-medium mt-2">+15 this week</p>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
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

      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Upload Rate</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">94.2%</p>
          <p className="text-xs text-muted-foreground mt-2">On-time uploads this month</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Approval Rate</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">87.5%</p>
          <p className="text-xs text-muted-foreground mt-2">Permits approved this week</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-info" />
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg. Processing</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">2.3 <span className="text-lg font-medium text-muted-foreground">days</span></p>
          <p className="text-xs text-muted-foreground mt-2">From submission to upload</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Index;
