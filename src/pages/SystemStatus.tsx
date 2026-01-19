import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  Shield, 
  HardDrive, 
  Zap, 
  Globe, 
  GitBranch, 
  Server, 
  Lock, 
  Radio,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface ServiceHealth {
  name: string;
  description: string;
  region: string;
  latency: string;
  status: "operational" | "degraded" | "outage";
  icon: typeof Database;
}

const services: ServiceHealth[] = [
  { name: "Primary Database Cluster", description: "PostgreSQL High Availability", region: "us-east-1", latency: "330ms", status: "operational", icon: Database },
  { name: "Identity Provider", description: "OAuth2 & Session Management", region: "Global", latency: "-", status: "operational", icon: Shield },
  { name: "Object Storage", description: "Asset & Media Storage", region: "Global", latency: "324ms", status: "operational", icon: HardDrive },
  { name: "Edge Functions", description: "Serverless Compute", region: "Global", latency: "25ms", status: "operational", icon: Zap },
  { name: "Edge Network", description: "CDN & Static Assets", region: "Global", latency: "68ms", status: "operational", icon: Globe },
  { name: "Build & Deploy", description: "CI/CD Pipeline", region: "Global", latency: "143ms", status: "operational", icon: GitBranch },
  { name: "Version Control System", description: "Source Code Management", region: "Global", latency: "-", status: "operational", icon: Server },
  { name: "DNS & CDN Layer", description: "DDoS Protection & Routing", region: "Global", latency: "13ms", status: "operational", icon: Lock },
  { name: "API Gateway", description: "REST/GraphQL Endpoints", region: "us-east-1", latency: "331ms", status: "operational", icon: Radio },
];

const mockLogs = [
  { time: "10:42:15", level: "INFO", message: "Health check routine initiated" },
  { time: "10:42:16", level: "INFO", message: "Database connection pool verified" },
  { time: "10:42:16", level: "DEBUG", message: "Latency check: 24ms" },
  { time: "10:42:17", level: "INFO", message: "Edge cache revalidation complete" },
  { time: "10:42:18", level: "INFO", message: "All systems operational" },
];

const latencyData = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  latency: Math.floor(Math.random() * 30) + 20,
}));

export default function SystemStatus() {
  useDocumentTitle("System Status");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-success bg-success/10";
      case "degraded": return "text-warning bg-warning/10";
      case "outage": return "text-danger bg-danger/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "INFO": return "text-primary";
      case "DEBUG": return "text-muted-foreground";
      case "WARN": return "text-warning";
      case "ERROR": return "text-danger";
      default: return "text-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time operational metrics and service health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="bg-success/10 text-success border-success/30 gap-1.5 py-1.5 px-3 font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            SYSTEM NORMAL
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Global Latency</p>
              <p className="text-2xl font-bold mt-1">42ms</p>
              <p className="text-xs text-muted-foreground mt-1">+2ms from last hour</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Uptime (30d)</p>
              <p className="text-2xl font-bold mt-1 text-success">99.99%</p>
              <p className="text-xs text-muted-foreground mt-1">Target met</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Active Services</p>
              <p className="text-2xl font-bold mt-1 text-success">9/9</p>
              <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Error Rate</p>
              <p className="text-2xl font-bold mt-1 text-success">0.00%</p>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Service Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Service Health</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {services.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <service.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">Region</p>
                      <p className="text-sm font-medium">{service.region}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-muted-foreground">Latency</p>
                      <p className="text-sm font-medium">{service.latency}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("capitalize font-medium", getStatusColor(service.status))}
                    >
                      {service.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Response Latency Chart & Logs */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Response Latency (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end gap-1">
                {latencyData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t cursor-pointer"
                    style={{ height: `${(data.latency / 50) * 100}%` }}
                    title={`${data.hour}:00 - ${data.latency}ms`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>24h</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">SYSTEM_LOGS</CardTitle>
                <span className="text-xs font-mono text-muted-foreground">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[180px]">
                <div className="p-4 pt-0 font-mono text-xs space-y-1.5">
                  {mockLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-muted-foreground">{log.time}</span>
                      <span className={cn("font-semibold", getLogLevelColor(log.level))}>
                        {log.level}
                      </span>
                      <span className="text-foreground">{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}