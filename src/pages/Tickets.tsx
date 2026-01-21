import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  MoreHorizontal,
  X,
  FileText,
  Zap,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/context/UserAccessContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

interface Ticket {
  id: string;
  dbId?: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdById?: string | null;
  assignedToId?: string | null;
  createdBy: string;
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
  comments: number;
}

const toRelativeTime = (dateValue?: string | null) => {
  if (!dateValue) return "";
  try {
    return formatDistanceToNow(new Date(dateValue), { addSuffix: true });
  } catch {
    return dateValue;
  }
};

const priorityConfig = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-warning/10 text-warning" },
  high: { label: "High", className: "bg-danger/10 text-danger" },
  critical: { label: "Critical", className: "bg-danger text-danger-foreground" },
};

const getInitials = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const statusConfig = {
  open: { label: "Open", icon: AlertCircle, color: "text-warning" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-primary" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-success" },
  closed: { label: "Closed", icon: CheckCircle2, color: "text-muted-foreground" },
};

const issueTemplates = [
  { 
    id: "data_error", 
    name: "Data Entry Error", 
    icon: FileText,
    description: "Incorrect data in permit details",
    defaultTitle: "Data entry error in permit",
    defaultDescription: "There is an error in the permit data that needs to be corrected.\n\nPermit Number: \nField with error: \nCorrect value: "
  },
  { 
    id: "upload_issue", 
    name: "Portal Upload Issue", 
    icon: AlertCircle,
    description: "Problems uploading to ePermit portal",
    defaultTitle: "Portal upload failing",
    defaultDescription: "Unable to upload permit to the ePermit portal.\n\nPermit Number: \nError message: \nSteps to reproduce: "
  },
  { 
    id: "status_clarification", 
    name: "Status Clarification", 
    icon: MessageSquare,
    description: "Need clarification on permit status",
    defaultTitle: "Status clarification needed",
    defaultDescription: "Need clarification on the current status of a permit.\n\nPermit Number: \nCurrent status shown: \nQuestion: "
  },
  { 
    id: "system_bug", 
    name: "System Bug", 
    icon: Zap,
    description: "Technical issue with the system",
    defaultTitle: "System bug report",
    defaultDescription: "Encountered a technical issue with the system.\n\nPage/Feature affected: \nExpected behavior: \nActual behavior: \nSteps to reproduce: "
  },
  { 
    id: "other", 
    name: "Other", 
    icon: MoreHorizontal,
    description: "Other issues not listed above",
    defaultTitle: "",
    defaultDescription: ""
  },
];

type Assignee = { id: string; name: string; email: string | null; role: string };

const severityLevels = [
  { value: "low", label: "Low", description: "Minor issue, no immediate impact", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", description: "Moderate impact, workaround available", color: "text-warning" },
  { value: "high", label: "High", description: "Significant impact, needs attention", color: "text-danger" },
  { value: "critical", label: "Critical", description: "Urgent, blocking operations", color: "text-danger" },
];

function TicketsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

interface NewTicketForm {
  template: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  assignedTo: string;
  createdBy: string;
}

const Tickets = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { profile } = useUserAccess();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [formStep, setFormStep] = useState<"template" | "details">("template");
  const [formData, setFormData] = useState<NewTicketForm>({
    template: "",
    title: "",
    description: "",
    category: "",
    severity: "",
    assignedTo: "",
    createdBy: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewTicketForm, string>>>({});
  const canManageTickets = profile?.role === "admin" || profile?.role === "manager";
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [ticketComments, setTicketComments] = useState<Array<{ id: string; content: string; created_at: string; user_id: string }>>([]);
  const [newComment, setNewComment] = useState("");
  const [commentAuthors, setCommentAuthors] = useState<Record<string, { name: string; email: string | null; avatar: string | null }>>({});
  
  useDocumentTitle("Tickets");

  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      setIsLoading(true);
      const [{ data: userData }, ticketsResponse, assigneeResp] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("tickets").select("*, ticket_comments(count)").order("created_at", { ascending: false }),
        supabase.rpc("list_assignable_users"),
      ]);

      if (!isMounted) return;

      setCurrentUserId(userData?.user?.id ?? null);
      setFormData((prev) => ({
        ...prev,
        createdBy: profile?.name ? `${profile.name}${profile.email ? ` (${profile.email})` : ""}` : (profile?.email ?? ""),
      }));

      const fetchedAssignees = !assigneeResp.error
        ? ((assigneeResp.data ?? []) as Array<{ auth_user_id: string; name: string; email: string | null; role: string }>).map((u) => ({
            id: u.auth_user_id,
            name: u.name,
            email: u.email,
            role: u.role,
          }))
        : [];

      if (fetchedAssignees.length) {
        setAssignees(fetchedAssignees);
      }

      if (ticketsResponse.error) {
        toast.error("Failed to load tickets", { description: ticketsResponse.error.message });
        setIsLoading(false);
        return;
      }

      const assigneeMap = new Map(fetchedAssignees.map((a) => [a.id, a]));
      const ticketRows = (ticketsResponse.data ?? []) as any[];
      const ticketIds = ticketRows.map((ticket) => ticket.id).filter(Boolean);
      let commentCountMap = new Map<string, number>();

      if (ticketIds.length) {
        const { data: commentRows } = await supabase
          .from("ticket_comments")
          .select("ticket_id")
          .in("ticket_id", ticketIds);

        commentCountMap = (commentRows ?? []).reduce((map, row) => {
          const current = map.get(row.ticket_id) ?? 0;
          map.set(row.ticket_id, current + 1);
          return map;
        }, new Map<string, number>());
      }

      const mappedTickets: Ticket[] = ticketRows.map((ticket: any) => {
        const creator = assigneeMap.get(ticket.created_by ?? "");
        const assignee = assigneeMap.get(ticket.assigned_to ?? "");
        const commentsFromJoin = Array.isArray(ticket.ticket_comments)
          ? ticket.ticket_comments?.[0]?.count
          : undefined;
        const commentsFromMap = ticket.id ? commentCountMap.get(ticket.id) : undefined;
        return {
        id: ticket.ticket_code ?? ticket.id,
          dbId: ticket.id,
        title: ticket.title,
        category: ticket.category ?? "",
        priority: ticket.priority,
        status: ticket.status,
          createdById: ticket.created_by,
          assignedToId: ticket.assigned_to,
        createdBy: ticket.created_by === userData?.user?.id
          ? "You"
          : (creator ? `${creator.name}${creator.email ? ` (${creator.email})` : ""}` : (ticket.created_by ?? "User")),
        assignedTo: assignee
          ? `${assignee.name}${assignee.email ? ` (${assignee.email})` : ""}`
          : (ticket.assigned_to ? "Assigned" : "Unassigned"),
        createdAt: ticket.created_at,
        lastUpdated: toRelativeTime(ticket.updated_at),
        comments: ticket.comments_count ?? commentsFromJoin ?? commentsFromMap ?? 0,
      }});

      setTickets(mappedTickets);
      setIsLoading(false);
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      createdBy: profile?.name ? `${profile.name}${profile.email ? ` (${profile.email})` : ""}` : (profile?.email ?? ""),
    }));
  }, [profile?.name, profile?.email]);

  const filteredAndSortedTickets = useMemo(() => {
    let result = tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesSeverity = severityFilter === "all" || ticket.priority === severityFilter;
      
      // Date filtering
      const ticketDate = new Date(ticket.createdAt);
      const matchesDateFrom = !dateFrom || ticketDate >= dateFrom;
      const matchesDateTo = !dateTo || ticketDate <= dateTo;
      
      return matchesSearch && matchesStatus && matchesSeverity && matchesDateFrom && matchesDateTo;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority_high":
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case "priority_low":
          const priorityOrderReverse = { critical: 3, high: 2, medium: 1, low: 0 };
          return priorityOrderReverse[a.priority] - priorityOrderReverse[b.priority];
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [tickets, searchQuery, statusFilter, severityFilter, sortBy, dateFrom, dateTo]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (severityFilter !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [statusFilter, severityFilter, dateFrom, dateTo]);

  const clearAllFilters = () => {
    setStatusFilter("all");
    setSeverityFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchQuery("");
    setSortBy("newest");
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = issueTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template: templateId,
        category: template.name,
        title: template.defaultTitle,
        description: template.defaultDescription,
      }));
      setFormStep("details");
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewTicketForm, string>> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < 10) {
      errors.title = "Title must be at least 10 characters";
    } else if (formData.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters";
    }
    
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    } else if (formData.description.trim().length > 2000) {
      errors.description = "Description must be less than 2000 characters";
    }
    
    if (!formData.severity) {
      errors.severity = "Severity level is required";
    }
    
    if (!formData.assignedTo) {
      errors.assignedTo = "Assignee is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const ticketCode = `TKT-${Date.now()}`;
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        ticket_code: ticketCode,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.severity as Ticket["priority"],
        status: "open",
        created_by: currentUserId,
        assigned_to: formData.assignedTo,
      })
      .select()
      .single();

    if (error) {
      toast.error("Ticket creation failed", { description: error.message });
      return;
    }

    const assignedUser = assignees.find((a) => a.id === data.assigned_to);
    const assignedLabel = assignedUser
      ? `${assignedUser.name}${assignedUser.email ? ` (${assignedUser.email})` : ""}`
      : "Assigned";

    const newTicket: Ticket = {
      id: data.ticket_code ?? data.id,
      dbId: data.id,
      title: data.title,
      category: data.category ?? "",
      priority: data.priority,
      status: data.status,
      createdById: data.created_by,
      assignedToId: data.assigned_to,
      createdBy: currentUserId ? "You" : formData.createdBy,
      assignedTo: assignedLabel,
      createdAt: data.created_at,
      lastUpdated: "Just now",
      comments: data.comments_count ?? 0,
    };

    setTickets(prev => [newTicket, ...prev]);
    setIsNewTicketOpen(false);
    resetForm();
    toast.success("Ticket created successfully", {
      description: `${newTicket.id} has been created and assigned.`,
    });
  };

  const resetForm = () => {
    setFormData({
      template: "",
      title: "",
      description: "",
      category: "",
      severity: "",
      assignedTo: "",
      createdBy: profile?.name ? `${profile.name}${profile.email ? ` (${profile.email})` : ""}` : (profile?.email ?? ""),
    });
    setFormErrors({});
    setFormStep("template");
  };

  const handleTicketStatusUpdate = async (ticket: Ticket, status: Ticket["status"]) => {
    const isCreator = Boolean(ticket.createdById && ticket.createdById === currentUserId);
    const canClose = isCreator && status === "closed";
    if (!canManageTickets && !canClose) {
      toast.error("Permission denied", { description: "You do not have access to update tickets." });
      return;
    }

    const targetId = ticket.dbId ?? ticket.id;
    const targetColumn = ticket.dbId ? "id" : "ticket_code";
    const { error } = await supabase
      .from("tickets")
      .update({ status })
      .eq(targetColumn, targetId);

    if (error) {
      toast.error("Failed to update ticket", { description: error.message });
      return;
    }

    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status } : t)));
    toast.success("Ticket updated");
  };

  const openComments = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setCommentDialogOpen(true);
    if (!ticket.dbId) {
      setTicketComments([]);
      return;
    }

    if (currentUserId) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", currentUserId)
        .ilike("title", `%${ticket.id}%`);
    }
    const { data } = await supabase
      .from("ticket_comments")
      .select("id, content, created_at, user_id")
      .eq("ticket_id", ticket.dbId)
      .order("created_at", { ascending: false });
    const uniqueUserIds = Array.from(new Set((data ?? []).map((comment) => comment.user_id).filter(Boolean)));
    if (uniqueUserIds.length) {
      const { data: userData } = await supabase
        .from("users")
        .select("auth_user_id, name, email, avatar")
        .in("auth_user_id", uniqueUserIds);
      if (userData?.length) {
        const mappedAuthors = userData.reduce<Record<string, { name: string; email: string | null; avatar: string | null }>>(
          (acc, user) => {
            acc[user.auth_user_id] = {
              name: user.name,
              email: user.email,
              avatar: user.avatar ?? null,
            };
            return acc;
          },
          {}
        );
        setCommentAuthors((prev) => ({ ...prev, ...mappedAuthors }));
      }
    }
    setTicketComments(data ?? []);
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, comments: (data ?? []).length } : t)));
  };

  const handleAddComment = async () => {
    if (!activeTicket?.dbId || !currentUserId) return;
    if (activeTicket.status === "closed" && profile?.role !== "admin") {
      toast.error("Comments locked", { description: "Only admins can comment on closed tickets." });
      return;
    }
    if (!newComment.trim()) {
      toast.error("Comment required", { description: "Please enter a comment." });
      return;
    }
    const { data, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: activeTicket.dbId,
        user_id: currentUserId,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add comment", { description: error.message });
      return;
    }

    setTicketComments((prev) => [data, ...prev]);
    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? { ...t, comments: t.comments + 1 } : t)));
    if (currentUserId) {
      const fallbackName = profile?.name ?? profile?.email ?? "You";
      setCommentAuthors((prev) => ({
        ...prev,
        [currentUserId]: {
          name: profile?.name ?? fallbackName,
          email: profile?.email ?? null,
          avatar: null,
        },
      }));
    }
    setNewComment("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsNewTicketOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (isLoading) return <TicketsSkeleton />;

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <Breadcrumbs />
        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Support Tickets</h2>
            <p className="text-muted-foreground mt-1">Track and manage support requests</p>
          </div>
          <Button className="gap-2" onClick={() => setIsNewTicketOpen(true)}>
            <Plus className="w-4 h-4" />
            New Ticket
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Open", value: tickets.filter(t => t.status === "open").length, icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
            { label: "In Progress", value: tickets.filter(t => t.status === "in_progress").length, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
            { label: "Resolved", value: tickets.filter(t => t.status === "resolved").length, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
            { label: "Critical", value: tickets.filter(t => t.priority === "critical").length, icon: AlertCircle, color: "text-danger", bg: "bg-danger/10" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-md", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={item} className="bg-card rounded-xl border border-border p-4 space-y-3">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <span className="flex items-center gap-2">
                    <ArrowDown className="w-3.5 h-3.5" /> Newest First
                  </span>
                </SelectItem>
                <SelectItem value="oldest">
                  <span className="flex items-center gap-2">
                    <ArrowUp className="w-3.5 h-3.5" /> Oldest First
                  </span>
                </SelectItem>
                <SelectItem value="priority_high">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Priority (High)
                  </span>
                </SelectItem>
                <SelectItem value="priority_low">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Priority (Low)
                  </span>
                </SelectItem>
                <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                <SelectItem value="title_desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" /> Low
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning" /> Medium
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger" /> High
                  </span>
                </SelectItem>
                <SelectItem value="critical">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-danger" /> Critical
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateFrom ? format(dateFrom, "MMM dd, yy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateTo ? format(dateTo, "MMM dd, yy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
                Clear ({activeFiltersCount})
              </Button>
            )}

            {/* Results count */}
            <span className="ml-auto text-xs text-muted-foreground">
              {filteredAndSortedTickets.length} of {tickets.length} tickets
            </span>
          </div>
        </motion.div>

        {/* Tickets List */}
        <motion.div variants={item} className="space-y-3">
          {filteredAndSortedTickets.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No tickets found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            filteredAndSortedTickets.map((ticket, index) => {
              const StatusIcon = statusConfig[ticket.status].icon;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative bg-card rounded-xl border border-border p-4 hover:shadow-soft transition-all cursor-pointer"
                >
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManageTickets ? (
                          <>
                            <DropdownMenuItem onClick={() => handleTicketStatusUpdate(ticket, "open")}>
                              Mark Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTicketStatusUpdate(ticket, "in_progress")}>
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTicketStatusUpdate(ticket, "resolved")}>
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTicketStatusUpdate(ticket, "closed")}>
                              Mark Closed
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleTicketStatusUpdate(ticket, "closed")}
                            disabled={!Boolean(ticket.createdById && ticket.createdById === currentUserId)}
                          >
                            Close Ticket
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openComments(ticket)}>
                          Add Comment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ticket.id)}>
                          Copy Ticket ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2.5 rounded-lg flex-shrink-0",
                      ticket.priority === "critical" ? "bg-danger/10" : "bg-muted"
                    )}>
                      <StatusIcon className={cn("w-5 h-5", statusConfig[ticket.status].color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                            <Badge className={priorityConfig[ticket.priority].className}>
                              {priorityConfig[ticket.priority].label}
                            </Badge>
                            <span className={cn(
                              "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                              ticket.status === "open" && "bg-warning/10 text-warning",
                              ticket.status === "in_progress" && "bg-primary/10 text-primary",
                              ticket.status === "resolved" && "bg-success/10 text-success",
                              ticket.status === "closed" && "bg-muted text-muted-foreground"
                            )}>
                              {statusConfig[ticket.status].label}
                            </span>
                          </div>
                          <h3 className="font-medium text-foreground">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{ticket.category}</p>
                        </div>
                        
                        <div className="h-8 w-8" />
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{ticket.assignedTo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openComments(ticket)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                          aria-label={`Open comments for ${ticket.id}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{ticket.comments}</span>
                        </button>
                        <span>Updated {ticket.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </motion.div>

      {/* New Ticket Modal */}
      <Dialog open={isNewTicketOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg">
                  {formStep === "template" ? "Create New Ticket" : "Ticket Details"}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  {formStep === "template" 
                    ? "Select an issue template to get started" 
                    : "Fill in all required fields to create the ticket"
                  }
                </DialogDescription>
              </div>
              {formStep === "details" && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFormStep("template")}
                  className="text-xs"
                >
                  Change Template
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {formStep === "template" ? (
              /* Template Selection */
              <div className="space-y-2">
                {issueTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <template.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Ticket Details Form */
              <div className="space-y-5">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{formData.category}</Badge>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, title: e.target.value }));
                      if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined }));
                    }}
                    placeholder="Brief description of the issue"
                    className={cn(formErrors.title && "border-danger focus-visible:ring-danger")}
                  />
                  {formErrors.title && (
                    <p className="text-xs text-danger">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-danger">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, description: e.target.value }));
                      if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined }));
                    }}
                    placeholder="Provide detailed information about the issue..."
                    rows={5}
                    className={cn(formErrors.description && "border-danger focus-visible:ring-danger")}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-danger">{formErrors.description}</p>
                  )}
                </div>

                {/* Severity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Severity Level <span className="text-danger">*</span>
                  </Label>
                  <Select 
                    value={formData.severity} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, severity: value }));
                      if (formErrors.severity) setFormErrors(prev => ({ ...prev, severity: undefined }));
                    }}
                  >
                    <SelectTrigger className={cn(formErrors.severity && "border-danger focus-visible:ring-danger")}>
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium", level.color)}>{level.label}</span>
                            <span className="text-muted-foreground text-xs">- {level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.severity && (
                    <p className="text-xs text-danger">{formErrors.severity}</p>
                  )}
                </div>

                {/* Assign To */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Assign To <span className="text-danger">*</span>
                  </Label>
                  <Select 
                    value={formData.assignedTo} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, assignedTo: value }));
                      if (formErrors.assignedTo) setFormErrors(prev => ({ ...prev, assignedTo: undefined }));
                    }}
                  >
                    <SelectTrigger className={cn(formErrors.assignedTo && "border-danger focus-visible:ring-danger")}>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignees.map((assignee) => (
                        <SelectItem key={assignee.id} value={assignee.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{assignee.name}</span>
                            <span className="text-muted-foreground text-xs">({assignee.role})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.assignedTo && (
                    <p className="text-xs text-danger">{formErrors.assignedTo}</p>
                  )}
                </div>

                {/* Created By (read-only) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Created By</Label>
                  <Input value={formData.createdBy} disabled className="bg-muted" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {formStep === "details" && (
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ticket Comments</DialogTitle>
            <DialogDescription>
              {activeTicket?.id} — {activeTicket?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add Comment *</Label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                disabled={activeTicket?.status === "closed" && profile?.role !== "admin"}
              />
              <Button
                onClick={handleAddComment}
                className="w-full"
                disabled={activeTicket?.status === "closed" && profile?.role !== "admin"}
              >
                Post Comment
              </Button>
              {activeTicket?.status === "closed" && profile?.role !== "admin" && (
                <p className="text-xs text-muted-foreground">
                  Comments are locked for closed tickets. Admins only.
                </p>
              )}
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {ticketComments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                ticketComments.map((comment) => {
                  const isCurrentUser = comment.user_id === currentUserId;
                  const fallbackAssignee = assignees.find((assignee) => assignee.id === comment.user_id);
                  const author = commentAuthors[comment.user_id] ?? (fallbackAssignee ? {
                    name: fallbackAssignee.name,
                    email: fallbackAssignee.email,
                    avatar: null,
                  } : undefined);
                  const authorName = isCurrentUser
                    ? "You"
                    : author?.name ?? "User";
                  const authorEmail = isCurrentUser
                    ? (profile?.email ?? null)
                    : author?.email ?? null;
                  const avatarLabel = author?.avatar
                    ? author.avatar
                    : getInitials(authorName);

                  return (
                    <div
                      key={comment.id}
                      className={cn("flex gap-3", isCurrentUser ? "justify-end" : "justify-start")}
                    >
                      {!isCurrentUser && (
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {avatarLabel}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl border px-3 py-2 text-sm whitespace-pre-wrap",
                          isCurrentUser
                            ? "bg-primary/10 border-primary/20 text-foreground"
                            : "bg-muted/60 border-border text-foreground"
                        )}
                      >
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          {authorName}
                          {authorEmail ? ` • ${authorEmail}` : ""}
                        </div>
                        <div>{comment.content}</div>
                        <div className="text-[11px] text-muted-foreground mt-2">
                          {format(new Date(comment.created_at), "MMM d, yyyy • p")}
                        </div>
                      </div>
                      {isCurrentUser && (
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="bg-primary/20 text-xs font-semibold">
                            {getInitials(profile?.name ?? profile?.email ?? "You")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Tickets;