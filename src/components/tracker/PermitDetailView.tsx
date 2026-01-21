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
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  nationality: string;
  passportNo: string;
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
      `Guest: ${editedPermit.guestName}`,
      `Arrival: ${editedPermit.arrivalDate}`,
      `Departure: ${editedPermit.departureDate}`,
      `Nationality: ${editedPermit.nationality}`,
      `Passport: ${editedPermit.passportNo}`,
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
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto p-4 lg:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{editedPermit.id}</h1>
                <CopyButton value={editedPermit.id} field="id" />
              </div>
              <p className="text-sm text-muted-foreground">Permit Details</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="gap-2">
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
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Status Card */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Status
                </h2>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium",
                  statusConfig[editedPermit.status].className
                )}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig[editedPermit.status].label}
                </div>
              </div>
              
              {isEditing && (
                <div className="space-y-2">
                  <Label className="text-xs">Change Status</Label>
                  <Select
                    value={editedPermit.status}
                    onValueChange={(value: Permit["status"]) => 
                      setEditedPermit({ ...editedPermit, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="uploaded">Uploaded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Guest Information */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-medium text-foreground flex items-center gap-2 mb-4">
                <User className="w-4 h-4" />
                Guest Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedPermit.guestName}
                      onChange={(e) => setEditedPermit({ ...editedPermit, guestName: e.target.value })}
                      className="h-9"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">{editedPermit.guestName}</span>
                      <CopyButton value={editedPermit.guestName} field="guestName" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  {isEditing ? (
                    <Input
                      value={editedPermit.nationality}
                      onChange={(e) => setEditedPermit({ ...editedPermit, nationality: e.target.value })}
                      className="h-9"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        {editedPermit.nationality}
                      </span>
                      <CopyButton value={editedPermit.nationality} field="nationality" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Passport Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedPermit.passportNo}
                      onChange={(e) => setEditedPermit({ ...editedPermit, passportNo: e.target.value })}
                      className="h-9"
                    />
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium font-mono">{editedPermit.passportNo}</span>
                      <CopyButton value={editedPermit.passportNo} field="passportNo" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Travel Dates */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-medium text-foreground flex items-center gap-2 mb-4">
                <Plane className="w-4 h-4" />
                Travel Dates
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Arrival Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 font-normal">
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
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {editedPermit.arrivalDate}
                      </span>
                      <CopyButton value={editedPermit.arrivalDate} field="arrivalDate" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Departure Date</Label>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-9 font-normal">
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
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
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
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="font-medium text-foreground mb-4">Additional Notes</h2>
                <Textarea
                  placeholder="Add any additional notes about this permit..."
                  className="min-h-[100px] resize-none"
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
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-medium text-foreground flex items-center gap-2 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={handleMarkUploaded}
                >
                  <Upload className="w-4 h-4" />
                  Mark as Uploaded
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  size="sm"
                  onClick={handleCopyAllDetails}
                >
                  <Copy className="w-4 h-4" />
                  Copy All Details
                </Button>
              </div>
            </div>

            {/* Tracking History */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-medium text-foreground flex items-center gap-2 mb-4">
                <History className="w-4 h-4" />
                Tracking History
              </h2>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {history.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full mt-1",
                        index === 0 ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      {index < history.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium leading-tight">{entry.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.date}
                      </p>
                      <p className="text-xs text-muted-foreground">by {entry.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta Info */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-medium text-foreground mb-4">Last Updated</h2>
              <div className="text-sm">
                <p className="text-muted-foreground">{lastEntry?.date ?? editedPermit.lastUpdated}</p>
                <p className="text-muted-foreground">by {lastEntry?.by ?? editedPermit.updatedBy}</p>
                {createdEntry && (
                  <p className="text-muted-foreground">Added by {createdEntry.by}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
