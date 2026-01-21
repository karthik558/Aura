import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Upload,
  Copy,
  Check,
  X,
  FileUp,
  CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TableSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { BulkImportModal, type ImportedPermitRow } from "@/components/tracker/BulkImportModal";
import { PermitDetailView } from "@/components/tracker/PermitDetailView";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import { Permit, statusConfig } from "@/data/permits";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useUserAccess } from "@/context/UserAccessContext";

const statusConfigWithIcons = {
  pending: { ...statusConfig.pending, icon: Clock },
  approved: { ...statusConfig.approved, icon: CheckCircle2 },
  rejected: { ...statusConfig.rejected, icon: XCircle },
  uploaded: { ...statusConfig.uploaded, icon: Upload },
};

type SortField = "id" | "guestName" | "arrivalDate" | "status" | "lastUpdated";
type SortDirection = "asc" | "desc";

const Tracker = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [permits, setPermits] = useState<Permit[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isAddPermitOpen, setIsAddPermitOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortField, setSortField] = useState<SortField>("arrivalDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [detailViewPermit, setDetailViewPermit] = useState<Permit | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newPermit, setNewPermit] = useState({
    permitCode: "",
    guestName: "",
    arrivalDate: "",
    departureDate: "",
    nationality: "",
    passportNo: "",
    status: "pending" as Permit["status"],
  });
  const { profile } = useUserAccess();

  const formatUserLabel = (name?: string | null, email?: string | null, fallback?: string | null) => {
    if (name && email) return `${name} (${email})`;
    if (name) return name;
    if (email) return email;
    return fallback ?? "";
  };

  const actorMeta = useMemo(
    () => ({ user_name: profile?.name ?? null, user_email: profile?.email ?? null }),
    [profile?.name, profile?.email]
  );

  const insertPermitHistory = async (permitDbId: string | undefined, action: string) => {
    if (!permitDbId) return;
    await (supabase.from("permit_history") as any).insert({
      permit_id: permitDbId,
      action,
      action_by: currentUserId,
      metadata: actorMeta,
    });
  };
  
  useDocumentTitle("Tracker");

  useEffect(() => {
    let isMounted = true;

    const fetchPermits = async () => {
      setIsLoading(true);
      const permitsTable = supabase.from("permits") as any;
      const [{ data: userData }, permitsResponse] = await Promise.all([
        supabase.auth.getUser(),
        permitsTable.select("*").order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      setCurrentUserId(userData?.user?.id ?? null);

      if (permitsResponse.error) {
        toast.error("Failed to load permits", { description: permitsResponse.error.message });
        setIsLoading(false);
        return;
      }

      const mappedPermits: Permit[] = ((permitsResponse.data ?? []) as Tables<"permits">[]).map((permit) => ({
        id: permit.permit_code ?? permit.id,
        dbId: permit.id,
        permitCode: permit.permit_code ?? undefined,
        guestName: permit.guest_name,
        arrivalDate: permit.arrival_date,
        departureDate: permit.departure_date,
        nationality: permit.nationality ?? "",
        passportNo: permit.passport_no ?? "",
        status: permit.status,
        uploaded: permit.uploaded,
        lastUpdated: permit.last_updated_at ?? permit.updated_at,
        updatedBy: formatUserLabel(
          permit.updated_by_name ?? permit.created_by_name,
          permit.updated_by_email ?? permit.created_by_email,
          permit.updated_by ?? permit.created_by ?? ""
        ),
        trackingHistory: [],
      }));

      setPermits(mappedPermits);
      setIsLoading(false);
    };

    fetchPermits();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreatePermit = async () => {
    if (!newPermit.guestName || !newPermit.arrivalDate || !newPermit.departureDate) {
      toast.error("Please fill required fields");
      return;
    }

    const permitsTable = supabase.from("permits") as any;
    const { data, error } = await permitsTable
      .insert({
        guest_name: newPermit.guestName,
        arrival_date: newPermit.arrivalDate,
        departure_date: newPermit.departureDate,
        nationality: newPermit.nationality,
        passport_no: newPermit.passportNo,
        status: newPermit.status,
        uploaded: newPermit.status === "uploaded",
        created_by: currentUserId,
        updated_by: currentUserId,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create permit", { description: error.message });
      return;
    }

    if (!data) {
      toast.error("Failed to create permit", { description: "No data returned." });
      return;
    }

    const createdPermit: Permit = {
      id: data.permit_code ?? data.id,
      dbId: data.id,
      permitCode: data.permit_code ?? undefined,
      guestName: data.guest_name,
      arrivalDate: data.arrival_date,
      departureDate: data.departure_date,
      nationality: data.nationality ?? "",
      passportNo: data.passport_no ?? "",
      status: data.status,
      uploaded: data.uploaded,
      lastUpdated: data.last_updated_at ?? data.updated_at,
      updatedBy: formatUserLabel(
        data.updated_by_name ?? data.created_by_name,
        data.updated_by_email ?? data.created_by_email,
        data.updated_by ?? data.created_by ?? ""
      ),
      trackingHistory: [],
    };

    await insertPermitHistory(data.id, "Permit created");

    setPermits(prev => [createdPermit, ...prev]);
    setIsAddPermitOpen(false);
    setNewPermit({
      permitCode: "",
      guestName: "",
      arrivalDate: "",
      departureDate: "",
      nationality: "",
      passportNo: "",
      status: "pending",
    });
    toast.success("Permit created");
  };

  const handleImportComplete = async (importedData: ImportedPermitRow[]) => {
    if (!importedData.length) return;

    const permitsTable = supabase.from("permits") as any;
    const { data, error } = await permitsTable
      .insert(
        importedData.map((row) => ({
          guest_name: row.guestName,
          arrival_date: row.arrivalDate,
          departure_date: row.departureDate,
          nationality: row.nationality ?? null,
          passport_no: row.passportNo ?? null,
          status: row.status,
          uploaded: row.status === "uploaded",
          created_by: currentUserId,
          updated_by: currentUserId,
          last_updated_at: new Date().toISOString(),
        }))
      )
      .select();

    if (error) {
      toast.error("Bulk import failed", { description: error.message });
      return;
    }

    const mappedPermits: Permit[] = ((data ?? []) as Tables<"permits">[]).map((permit) => ({
      id: permit.permit_code ?? permit.id,
      dbId: permit.id,
      permitCode: permit.permit_code ?? undefined,
      guestName: permit.guest_name,
      arrivalDate: permit.arrival_date,
      departureDate: permit.departure_date,
      nationality: permit.nationality ?? "",
      passportNo: permit.passport_no ?? "",
      status: permit.status,
      uploaded: permit.uploaded,
      lastUpdated: permit.last_updated_at ?? permit.updated_at,
      updatedBy: formatUserLabel(
        permit.updated_by_name ?? permit.created_by_name,
        permit.updated_by_email ?? permit.created_by_email,
        permit.updated_by ?? permit.created_by ?? ""
      ),
      trackingHistory: [],
    }));

    await (supabase.from("permit_history") as any).insert(
      mappedPermits
        .filter((permit) => permit.dbId)
        .map((permit) => ({
          permit_id: permit.dbId,
          action: "Permit created (import)",
          action_by: currentUserId,
          metadata: actorMeta,
        }))
    );

    setPermits((prev) => [...mappedPermits, ...prev]);
    toast.success(`Imported ${mappedPermits.length} permits`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handlePermitSave = async (updatedPermit: Permit) => {
    const previousPermit = permits.find((p) => p.id === updatedPermit.id);
    const targetId = updatedPermit.dbId ?? updatedPermit.permitCode ?? updatedPermit.id;
    const permitsTable = supabase.from("permits") as any;
    const { data, error } = await permitsTable
      .update({
        guest_name: updatedPermit.guestName,
        arrival_date: updatedPermit.arrivalDate,
        departure_date: updatedPermit.departureDate,
        nationality: updatedPermit.nationality,
        passport_no: updatedPermit.passportNo,
        status: updatedPermit.status,
        uploaded: updatedPermit.uploaded,
        last_updated_at: new Date().toISOString(),
        updated_by: currentUserId,
      })
      .eq(updatedPermit.dbId ? "id" : "permit_code", targetId)
      .select()
      .single();

    if (error) {
      const isPermissionIssue = error.message.toLowerCase().includes("cannot coerce the result to a single json object");
      if (isPermissionIssue) {
        toast.error("Permission denied", { description: "You do not have access to edit this permit." });
      } else {
        toast.error("Failed to update permit", { description: error.message });
      }
      return false;
    }

    if (data) {
      const mappedPermit: Permit = {
        id: data.permit_code ?? data.id,
        dbId: data.id,
        permitCode: data.permit_code ?? undefined,
        guestName: data.guest_name,
        arrivalDate: data.arrival_date,
        departureDate: data.departure_date,
        nationality: data.nationality ?? "",
        passportNo: data.passport_no ?? "",
        status: data.status,
        uploaded: data.uploaded,
        lastUpdated: data.last_updated_at ?? data.updated_at,
        updatedBy: formatUserLabel(
          data.updated_by_name ?? data.created_by_name,
          data.updated_by_email ?? data.created_by_email,
          data.updated_by ?? data.created_by ?? ""
        ),
        trackingHistory: updatedPermit.trackingHistory,
      };
      setPermits((prev) => prev.map((p) => (p.id === updatedPermit.id ? mappedPermit : p)));
      setDetailViewPermit(mappedPermit);
      const statusLabels = {
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        uploaded: "Uploaded",
      };
      const action = previousPermit && previousPermit.status !== data.status
        ? `Status updated to ${statusLabels[data.status]}`
        : "Permit details updated";
      await insertPermitHistory(data.id, action);
      return true;
    }

    setPermits((prev) => prev.map((p) => (p.id === updatedPermit.id ? updatedPermit : p)));
    setDetailViewPermit(updatedPermit);
    return true;
  };

  const handleDeletePermit = async (permit: Permit) => {
    const targetId = permit.dbId ?? permit.permitCode ?? permit.id;
    if (!targetId) {
      toast.error("Unable to delete permit", { description: "Missing permit identifier." });
      return;
    }

    const confirmed = window.confirm(`Delete permit ${permit.permitCode ?? permit.id}? This cannot be undone.`);
    if (!confirmed) return;

    const permitsTable = supabase.from("permits") as any;
    const query = permit.dbId
      ? permitsTable.delete().eq("id", permit.dbId)
      : permitsTable.delete().eq("permit_code", permit.permitCode ?? permit.id);

    const { error } = await query;
    if (error) {
      toast.error("Failed to delete permit", { description: error.message });
      return;
    }

    setPermits((prev) => prev.filter((p) => p.id !== permit.id));
    if (detailViewPermit?.id === permit.id) {
      setDetailViewPermit(null);
    }
    if (selectedPermit?.id === permit.id) {
      setSelectedPermit(null);
    }
    toast.success("Permit deleted");
  };

  const handleStatusUpdate = async (permitId: string, newStatus: Permit['status']) => {
    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      uploaded: 'Uploaded'
    };

    const nowIso = new Date().toISOString();
    const targetPermit = permits.find(p => p.id === permitId);
    const targetId = targetPermit?.dbId ?? targetPermit?.permitCode ?? permitId;
    const targetColumn = targetPermit?.dbId ? "id" : "permit_code";
    const permitsTable = supabase.from("permits") as any;
    const { error } = await permitsTable
      .update({
        status: newStatus,
        uploaded: newStatus === 'uploaded',
        last_updated_at: nowIso,
        updated_by: currentUserId,
      })
      .eq(targetColumn, targetId);

    if (error) {
      toast.error("Failed to update status", { description: error.message });
      return;
    }

    setPermits(prev => prev.map(p => {
      if (p.id === permitId) {
        return {
          ...p,
          status: newStatus,
          uploaded: newStatus === 'uploaded',
          lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm'),
          updatedBy: formatUserLabel(profile?.name, profile?.email, p.updatedBy)
        };
      }
      return p;
    }));

    await insertPermitHistory(targetPermit?.dbId ?? undefined, `Status updated to ${statusLabels[newStatus]}`);

    toast.success(`Status updated to ${statusLabels[newStatus]}`);
  };

  const CopyButton = ({ value, field, className }: { value: string; field: string; className?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(value, field);
          }}
          className={cn("p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100", className)}
        >
          {copiedField === field ? (
            <Check className="w-3 h-3 text-success" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy</TooltipContent>
    </Tooltip>
  );

  const filteredAndSortedPermits = useMemo(() => {
    let result = permits.filter(permit => {
      const matchesSearch = permit.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            permit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            permit.passportNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || permit.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const arrivalDate = new Date(permit.arrivalDate);
        if (dateFrom && arrivalDate < dateFrom) matchesDate = false;
        if (dateTo && arrivalDate > dateTo) matchesDate = false;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "id":
          comparison = a.id.localeCompare(b.id);
          break;
        case "guestName":
          comparison = a.guestName.localeCompare(b.guestName);
          break;
        case "arrivalDate":
          comparison = new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "lastUpdated":
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [permits, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  const stats = useMemo(() => ({
    total: permits.length,
    pending: permits.filter(p => p.status === "pending").length,
    approved: permits.filter(p => p.status === "approved").length,
    rejected: permits.filter(p => p.status === "rejected").length,
    uploaded: permits.filter(p => p.status === "uploaded").length,
  }), [permits]);

  const arrivalDateValue = newPermit.arrivalDate ? new Date(newPermit.arrivalDate) : undefined;
  const departureDateValue = newPermit.departureDate ? new Date(newPermit.departureDate) : undefined;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1" /> 
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      <Breadcrumbs />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-semibold text-foreground">Permit Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track all hotel arrival permits
          </p>
        </motion.div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setImportModalOpen(true)}
          >
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Import</span>
          </Button>
          <Button className="gap-2" onClick={() => setIsAddPermitOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Permit
          </Button>
        </div>
      </div>

      <Dialog open={isAddPermitOpen} onOpenChange={setIsAddPermitOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Permit</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="permitCode">Permit Code</Label>
              <Input
                id="permitCode"
                  value={newPermit.permitCode}
                  placeholder="Auto-generated"
                  readOnly
                  disabled
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestName">Guest Name *</Label>
              <Input
                id="guestName"
                value={newPermit.guestName}
                onChange={(e) => setNewPermit(prev => ({ ...prev, guestName: e.target.value }))}
                placeholder="Guest name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="arrivalDate">Arrival Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !arrivalDateValue && "text-muted-foreground"
                    )}
                  >
                    {arrivalDateValue ? format(arrivalDateValue, "MMM d, yyyy") : "Select date"}
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                  <Calendar
                    mode="single"
                    selected={arrivalDateValue}
                    onSelect={(date) =>
                      setNewPermit((prev) => ({
                        ...prev,
                        arrivalDate: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="departureDate">Departure Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !departureDateValue && "text-muted-foreground"
                    )}
                  >
                    {departureDateValue ? format(departureDateValue, "MMM d, yyyy") : "Select date"}
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                  <Calendar
                    mode="single"
                    selected={departureDateValue}
                    onSelect={(date) =>
                      setNewPermit((prev) => ({
                        ...prev,
                        departureDate: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={newPermit.nationality}
                onChange={(e) => setNewPermit(prev => ({ ...prev, nationality: e.target.value }))}
                placeholder="Country"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="passportNo">Passport No</Label>
              <Input
                id="passportNo"
                value={newPermit.passportNo}
                onChange={(e) => setNewPermit(prev => ({ ...prev, passportNo: e.target.value }))}
                placeholder="Passport"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Status</Label>
              <Select
                value={newPermit.status}
                onValueChange={(value) => setNewPermit(prev => ({ ...prev, status: value as Permit["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddPermitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePermit}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      >
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-warning">{stats.pending}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Approved</span>
          </div>
          <p className="text-2xl font-semibold text-success">{stats.approved}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Rejected</span>
          </div>
          <p className="text-2xl font-semibold text-destructive">{stats.rejected}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Uploaded</span>
          </div>
          <p className="text-2xl font-semibold text-primary">{stats.uploaded}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border p-4"
      >
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, guest name, or passport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 gap-2 text-xs", dateFrom && "text-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                <Calendar
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
                <Button variant="outline" size="sm" className={cn("h-9 gap-2 text-xs", dateTo && "text-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilter} className="h-9 text-xs text-muted-foreground">
                Clear dates
              </Button>
            )}

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Desktop Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="hidden md:block bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button 
                    onClick={() => handleSort("id")} 
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    ID <SortIcon field="id" />
                  </button>
                </th>
                <th>
                  <button 
                    onClick={() => handleSort("guestName")} 
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Guest <SortIcon field="guestName" />
                  </button>
                </th>
                <th>Nationality</th>
                <th>
                  <button 
                    onClick={() => handleSort("arrivalDate")} 
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Arrival <SortIcon field="arrivalDate" />
                  </button>
                </th>
                <th>Departure</th>
                <th>
                  <button 
                    onClick={() => handleSort("status")} 
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th>
                  <button 
                    onClick={() => handleSort("lastUpdated")} 
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Updated <SortIcon field="lastUpdated" />
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPermits.map((permit, index) => {
                const StatusIcon = statusConfigWithIcons[permit.status].icon;
                return (
                  <motion.tr 
                    key={permit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group cursor-pointer hover:bg-muted/30"
                    onClick={() => setDetailViewPermit(permit)}
                  >
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-medium text-primary">{permit.id}</span>
                        <CopyButton value={permit.id} field={`id-${permit.id}`} />
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm">{permit.guestName}</p>
                        <CopyButton value={permit.guestName} field={`name-${permit.id}`} />
                      </div>
                    </td>
                    <td className="text-sm">{permit.nationality}</td>
                    <td className="text-sm">{permit.arrivalDate}</td>
                    <td className="text-sm text-muted-foreground">{permit.departureDate}</td>
                    <td>
                      <span className={cn("inline-flex items-center gap-1.5", statusConfig[permit.status].className)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[permit.status].label}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="text-xs">{permit.lastUpdated}</p>
                        <p className="text-xs text-muted-foreground">by {permit.updatedBy}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPermit(permit);
                              }}
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View History</TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setDetailViewPermit(permit)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetailViewPermit(permit)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                              Update Status
                            </DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(permit.id, 'pending');
                              }}
                              className={permit.status === 'pending' ? 'bg-muted' : ''}
                            >
                              <Clock className="w-4 h-4 mr-2 text-warning" />
                              Pending
                              {permit.status === 'pending' && <Check className="w-4 h-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(permit.id, 'approved');
                              }}
                              className={permit.status === 'approved' ? 'bg-muted' : ''}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                              Approved
                              {permit.status === 'approved' && <Check className="w-4 h-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(permit.id, 'rejected');
                              }}
                              className={permit.status === 'rejected' ? 'bg-muted' : ''}
                            >
                              <XCircle className="w-4 h-4 mr-2 text-destructive" />
                              Rejected
                              {permit.status === 'rejected' && <Check className="w-4 h-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(permit.id, 'uploaded');
                              }}
                              className={permit.status === 'uploaded' ? 'bg-muted' : ''}
                            >
                              <Upload className="w-4 h-4 mr-2 text-primary" />
                              Uploaded
                              {permit.status === 'uploaded' && <Check className="w-4 h-4 ml-auto" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePermit(permit);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium">{filteredAndSortedPermits.length}</span> of{" "}
            <span className="font-medium">{permits.length}</span> permits
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-7 text-xs">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Next
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredAndSortedPermits.map((permit, index) => {
          const StatusIcon = statusConfigWithIcons[permit.status].icon;
          return (
            <motion.div
              key={permit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card rounded-xl border border-border p-4 space-y-3 cursor-pointer active:bg-muted/30"
              onClick={() => setDetailViewPermit(permit)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-medium text-primary">{permit.id}</span>
                  <p className="font-medium text-sm mt-1">{permit.guestName}</p>
                  <p className="text-xs text-muted-foreground">{permit.nationality}</p>
                </div>
                <span className={cn("inline-flex items-center gap-1", statusConfig[permit.status].className)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[permit.status].label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Arrival</p>
                  <p className="font-medium">{permit.arrivalDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Departure</p>
                  <p className="font-medium">{permit.departureDate}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Last updated by {permit.updatedBy}</p>
                  <p className="text-xs text-muted-foreground">{permit.lastUpdated}</p>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPermit(permit);
                    }}
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailViewPermit(permit)}><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDetailViewPermit(permit)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem><Upload className="w-4 h-4 mr-2" /> Upload</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePermit(permit);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tracking History Panel */}
      {selectedPermit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-4 bottom-4 md:inset-x-auto md:right-6 md:bottom-6 md:w-96 bg-card rounded-xl border border-border shadow-2xl p-5 z-50"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Tracking History</h3>
              <p className="text-xs text-muted-foreground">{selectedPermit.id} - {selectedPermit.guestName}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedPermit(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedPermit.trackingHistory.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                  {index < selectedPermit.trackingHistory.length - 1 && (
                    <div className="w-px h-full bg-border" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">{entry.date} • {entry.by}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal 
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Full Permit Detail View */}
      <AnimatePresence>
        {detailViewPermit && (
          <PermitDetailView
            permit={detailViewPermit}
            onClose={() => setDetailViewPermit(null)}
            onSave={handlePermitSave}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tracker;
