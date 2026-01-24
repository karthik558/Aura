import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  User,
  Calendar,
  Globe,
  FileText,
  History,
  Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/context/UserAccessContext";

interface TrackingEntry {
  date: string;
  action: string;
  by: string;
}

interface Permit {
  id: string;
  dbId?: string;
  name: string;
  confirmationNumber: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  property: string;
  status: "pending" | "approved" | "rejected" | "uploaded";
  uploaded: boolean;
  lastUpdated: string;
  updatedBy: string;
  trackingHistory: TrackingEntry[];
}

interface PermitDetailViewProps {
  permit: Permit;
  onClose: () => void;
  onSave: (permit: Permit) => Promise<boolean>;
}

const statusConfig = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  uploaded: { label: "Uploaded", className: "bg-primary/10 text-primary border-primary/20", icon: Upload },
};

export function PermitDetailView({ permit, onClose, onSave }: PermitDetailViewProps) {
  const { isAdmin, pageAccess } = useUserAccess();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPermit, setEditedPermit] = useState<Permit>(permit);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
    permit.arrivalDate ? new Date(permit.arrivalDate) : undefined
  );
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    permit.departureDate ? new Date(permit.departureDate) : undefined
  );
  const [history, setHistory] = useState<TrackingEntry[]>(permit.trackingHistory ?? []);

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

  const handleSave = async () => {
    const updatedPermit: Permit = {
      ...editedPermit,
      arrivalDate: arrivalDate ? format(arrivalDate, "yyyy-MM-dd") : editedPermit.arrivalDate,
      departureDate: departureDate ? format(departureDate, "yyyy-MM-dd") : editedPermit.departureDate,
      lastUpdated: format(new Date(), "yyyy-MM-dd HH:mm"),
      trackingHistory: editedPermit.trackingHistory,
    };
    const ok = await onSave(updatedPermit);
    if (ok) {
      setIsEditing(false);
      toast.success("Permit updated successfully");
    }
  };

  const handleMarkUploaded = async () => {
    const updatedPermit: Permit = {
      ...editedPermit,
      status: "uploaded",
      uploaded: true,
      lastUpdated: format(new Date(), "yyyy-MM-dd HH:mm"),
    };
    const ok = await onSave(updatedPermit);
    if (ok) {
      setEditedPermit(updatedPermit);
      toast.success("Marked as uploaded");
    }
  };

  const handleCopyAllDetails = async () => {
    const details = [
      `Permit: ${editedPermit.id}`,
      `Name: ${editedPermit.name}`,
      `Confirmation Number: ${editedPermit.confirmationNumber}`,
      `Arrival: ${editedPermit.arrivalDate}`,
      `Departure: ${editedPermit.departureDate}`,
      `Adults: ${editedPermit.adults}`,
      `Property: ${editedPermit.property}`,
      `Status: ${statusConfig[editedPermit.status].label}`,
      `Last Updated: ${lastEntry?.date ?? editedPermit.lastUpdated}`,
      `Updated By: ${lastEntry?.by ?? editedPermit.updatedBy}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(details);
      toast.success("Permit details copied");
    } catch {
      toast.error("Failed to copy details");
    }
  };

  const handleCancel = () => {
    setEditedPermit(permit);
    setArrivalDate(permit.arrivalDate ? new Date(permit.arrivalDate) : undefined);
    setDepartureDate(permit.departureDate ? new Date(permit.departureDate) : undefined);
    setIsEditing(false);
  };

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      if (!permit.dbId) {
        setHistory(permit.trackingHistory ?? []);
        return;
      }

      const { data, error } = await supabase
        .from("permit_history")
        .select("action, action_at, metadata")
        .eq("permit_id", permit.dbId)
        .order("action_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setHistory(permit.trackingHistory ?? []);
        return;
      }

      const mapped = (data ?? []).map((entry) => ({
        action: entry.action,
        date: format(new Date(entry.action_at), "yyyy-MM-dd HH:mm"),
        by: (entry.metadata as { user_name?: string; user_email?: string } | null)?.user_name
          ?? (entry.metadata as { user_name?: string; user_email?: string } | null)?.user_email
          ?? "System",
      }));

      setHistory(mapped);
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [permit.dbId, permit.trackingHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const createdEntry = useMemo(() => {
    return history.find((entry) => entry.action.toLowerCase().includes("created"));
  }, [history]);

  const lastEntry = history[0];

  const StatusIcon = statusConfig[editedPermit.status].icon;

  const CopyButton = ({ value, field }: { value: string; field: string }) => (
    <button
      onClick={() => handleCopy(value, field)}
      className="p-1 rounded hover:bg-muted transition-colors"
      title="Copy to clipboard"
    >
      {copiedField === field ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-background/90 backdrop-blur border-b border-border mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onClose} className="h-10 w-10 rounded-xl border-border">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h1 className="text-base font-semibold text-foreground">{editedPermit.id}</h1>
                  <CopyButton value={editedPermit.id} field="id" />
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold",
                  statusConfig[editedPermit.status].className
                )}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusConfig[editedPermit.status].label}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Permit Details • {editedPermit.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2 rounded-xl">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="gap-2 rounded-xl">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const canEdit = isAdmin || Boolean(pageAccess["tracker"]?.canEdit);
                  if (!canEdit) {
                    toast.error("Permission denied", { description: "You do not have access to edit this permit." });
                    return;
                  }
                  setIsEditing(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Main Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Status Card */}
            {isEditing && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Change Status</h2>
                </div>
                
                <Select
                  value={editedPermit.status}
                  onValueChange={(value: Permit["status"]) => 
                    setEditedPermit({ ...editedPermit, status: value })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-warning" />
                        Pending
                      </span>
                    </SelectItem>
                    <SelectItem value="approved">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        Approved
                      </span>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                        Rejected
                      </span>
                    </SelectItem>
                    <SelectItem value="uploaded">
                      <span className="flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5 text-primary" />
                        Uploaded
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Guest Information */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-info" />
                </div>
                <h2 className="font-semibold text-foreground">Guest Information</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedPermit.name}
                      onChange={(e) => setEditedPermit({ ...editedPermit, name: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="text-sm font-medium">{editedPermit.name}</span>
                      <CopyButton value={editedPermit.name} field="name" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Confirmation Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedPermit.confirmationNumber}
                      onChange={(e) => setEditedPermit({ ...editedPermit, confirmationNumber: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        {editedPermit.confirmationNumber}
                      </span>
                      <CopyButton value={editedPermit.confirmationNumber} field="confirmationNumber" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Adults</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min={1}
                      value={editedPermit.adults}
                      onChange={(e) =>
                        setEditedPermit({
                          ...editedPermit,
                          adults: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="h-10 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {editedPermit.adults} {editedPermit.adults === 1 ? 'Adult' : 'Adults'}
                      </span>
                      <CopyButton value={String(editedPermit.adults)} field="adults" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Property</Label>
                  {isEditing ? (
                    <Input
                      value={editedPermit.property}
                      onChange={(e) => setEditedPermit({ ...editedPermit, property: e.target.value })}
                      className="h-10 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        {editedPermit.property}
                      </span>
                      <CopyButton value={editedPermit.property} field="property" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Travel Dates */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
                  <Plane className="w-4 h-4 text-success" />
                </div>
                <h2 className="font-semibold text-foreground">Travel Dates</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Arrival Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-10 font-normal rounded-xl">
                          <Calendar className="w-4 h-4 mr-2" />
                          {arrivalDate ? format(arrivalDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={arrivalDate}
                          onSelect={setArrivalDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-success" />
                        {editedPermit.arrivalDate}
                      </span>
                      <CopyButton value={editedPermit.arrivalDate} field="arrivalDate" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-medium">Departure Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-10 font-normal rounded-xl">
                          <Calendar className="w-4 h-4 mr-2" />
                          {departureDate ? format(departureDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-transparent border-0 shadow-none" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={departureDate}
                          onSelect={setDepartureDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-destructive" />
                        {editedPermit.departureDate}
                      </span>
                      <CopyButton value={editedPermit.departureDate} field="departureDate" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {isEditing && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h2 className="font-semibold text-foreground">Additional Notes</h2>
                </div>
                <Textarea
                  placeholder="Add any additional notes about this permit..."
                  className="min-h-[100px] resize-none rounded-xl"
                />
              </div>
            )}
          </motion.div>

          {/* Sidebar - Tracking History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
                <h2 className="font-semibold text-foreground">Quick Actions</h2>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-11 rounded-xl border-border hover:bg-primary/5 hover:border-primary/30 transition-all"
                  onClick={handleMarkUploaded}
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Mark as Uploaded</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-11 rounded-xl border-border hover:bg-muted/60 transition-all"
                  onClick={handleCopyAllDetails}
                >
                  <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Copy All Details</span>
                </Button>
              </div>
            </div>

            {/* Tracking History */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-info/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-info" />
                </div>
                <h2 className="font-semibold text-foreground">Tracking History</h2>
              </div>
              
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {history.map((entry, index) => (
                  <div key={index} className="flex gap-3 group">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1.5 ring-4 ring-card",
                        index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      {index < history.length - 1 && (
                        <div className="w-px flex-1 bg-border/60 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-transparent group-hover:border-border/50 transition-colors">
                        <p className="text-sm font-medium leading-tight text-foreground">{entry.action}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-muted-foreground">{entry.date}</span>
                          <span className="text-[11px] text-muted-foreground/50">•</span>
                          <span className="text-[11px] text-muted-foreground">{entry.by}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Info */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <h2 className="font-semibold text-foreground">Last Updated</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Date & Time</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{lastEntry?.date ?? editedPermit.lastUpdated}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Updated By</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{lastEntry?.by ?? editedPermit.updatedBy}</p>
                  </div>
                </div>
                {createdEntry && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Created By</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{createdEntry.by}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
