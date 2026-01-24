import { useState, useMemo, useEffect } from "react";
import { RefreshCw, AlertTriangle, Check, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Permit } from "@/data/permits";
import { differenceInDays, format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useUserAccess } from "@/context/UserAccessContext";

const statusOptions = [
  { value: "pending", label: "Pending", className: "badge-pending", icon: Clock },
  { value: "approved", label: "Approved", className: "badge-approved", icon: CheckCircle2 },
  { value: "rejected", label: "Rejected", className: "badge-rejected", icon: XCircle },
  { value: "uploaded", label: "Uploaded", className: "badge-uploaded", icon: Upload },
] as const;

interface StatusUpdatePopoverProps {
  currentStatus: Permit["status"];
  itemId: string;
  onStatusChange: (id: string, status: Permit["status"]) => void;
}

function StatusUpdatePopover({ currentStatus, itemId, onStatusChange }: StatusUpdatePopoverProps) {
  const [open, setOpen] = useState(false);

  const handleStatusSelect = (status: Permit["status"]) => {
    onStatusChange(itemId, status);
    setOpen(false);
  };

  const currentOption = statusOptions.find(opt => opt.value === currentStatus);
  const CurrentIcon = currentOption?.icon || Clock;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          className={cn(
            "h-8 px-2.5 rounded-lg gap-1.5 border-border/60 hover:bg-muted/50 transition-all",
            "text-xs font-medium"
          )}
        >
          <CurrentIcon className={cn(
            "w-3.5 h-3.5",
            currentStatus === "pending" && "text-warning",
            currentStatus === "approved" && "text-success",
            currentStatus === "rejected" && "text-danger",
            currentStatus === "uploaded" && "text-primary"
          )} />
          <span className="hidden sm:inline">Change</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="end">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground px-2.5 py-1.5 uppercase tracking-wider">Update Status</p>
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all",
                  isSelected 
                    ? "bg-primary/10 text-foreground" 
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  option.value === "pending" && "bg-warning/10",
                  option.value === "approved" && "bg-success/10",
                  option.value === "rejected" && "bg-danger/10",
                  option.value === "uploaded" && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "w-3.5 h-3.5",
                    option.value === "pending" && "text-warning",
                    option.value === "approved" && "text-success",
                    option.value === "rejected" && "text-danger",
                    option.value === "uploaded" && "text-primary"
                  )} />
                </div>
                <span className="flex-1 text-left font-medium">{option.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MobileStatusUpdatePopover({ currentStatus, itemId, onStatusChange }: StatusUpdatePopoverProps) {
  const [open, setOpen] = useState(false);

  const handleStatusSelect = (status: Permit["status"]) => {
    onStatusChange(itemId, status);
    setOpen(false);
  };

  const currentOption = statusOptions.find(opt => opt.value === currentStatus);
  const CurrentIcon = currentOption?.icon || Clock;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          className="h-8 w-8 p-0 rounded-lg border-border/60"
        >
          <CurrentIcon className={cn(
            "w-4 h-4",
            currentStatus === "pending" && "text-warning",
            currentStatus === "approved" && "text-success",
            currentStatus === "rejected" && "text-danger",
            currentStatus === "uploaded" && "text-primary"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="end">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground px-2.5 py-1.5 uppercase tracking-wider">Update Status</p>
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all",
                  isSelected 
                    ? "bg-primary/10 text-foreground" 
                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  option.value === "pending" && "bg-warning/10",
                  option.value === "approved" && "bg-success/10",
                  option.value === "rejected" && "bg-danger/10",
                  option.value === "uploaded" && "bg-primary/10"
                )}>
                  <Icon className={cn(
                    "w-3.5 h-3.5",
                    option.value === "pending" && "text-warning",
                    option.value === "approved" && "text-success",
                    option.value === "rejected" && "text-danger",
                    option.value === "uploaded" && "text-primary"
                  )} />
                </div>
                <span className="flex-1 text-left font-medium">{option.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PendingItemsTable() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { profile } = useUserAccess();

  useEffect(() => {
    let isMounted = true;

    const fetchPermits = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!isMounted) return;
      setCurrentUserId(userData.user?.id ?? null);

      const permitsTable = supabase.from("permits") as any;
      const { data, error } = await permitsTable
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load pending items", { description: error.message });
        return;
      }

      const mappedPermits: Permit[] = ((data ?? []) as Tables<"permits">[]).map((permit) => ({
        id: permit.permit_code ?? permit.id,
        dbId: permit.id,
        permitCode: permit.permit_code ?? undefined,
        name: permit.name ?? permit.guest_name ?? "",
        confirmationNumber: permit.confirmation_number ?? permit.passport_no ?? "",
        arrivalDate: permit.arrival_date,
        departureDate: permit.departure_date,
        adults: permit.adults ?? 1,
        property: permit.property ?? permit.nationality ?? "",
        status: permit.status,
        uploaded: permit.uploaded,
        lastUpdated: permit.last_updated_at ?? permit.updated_at,
        updatedBy:
          (permit.updated_by_name && permit.updated_by_email)
            ? `${permit.updated_by_name} (${permit.updated_by_email})`
            : (permit.updated_by_name || permit.updated_by_email || permit.created_by_name || permit.created_by_email || ""),
        trackingHistory: [],
      }));

      setPermits(mappedPermits);
    };

    fetchPermits();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter permits: not uploaded and departure date within 7 days from today
  const pendingItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return permits
      .filter(permit => {
        // Not uploaded yet
        if (permit.status === "uploaded") return false;
        
        // Departure date within 7 days
        const departureDate = parseISO(permit.departureDate);
        const daysUntilDeparture = differenceInDays(departureDate, today);
        
        return daysUntilDeparture >= 0 && daysUntilDeparture <= 7;
      })
      .map(permit => {
        const departureDate = parseISO(permit.departureDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilDeparture = differenceInDays(departureDate, today);
        
        return {
          ...permit,
          daysUntilDeparture,
          isUrgent: daysUntilDeparture <= 2
        };
      })
      .sort((a, b) => a.daysUntilDeparture - b.daysUntilDeparture);
  }, [permits]);

  const handleStatusChange = async (id: string, newStatus: Permit["status"]) => {
    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      uploaded: 'Uploaded'
    };

    const targetPermit = permits.find(p => p.id === id);
    const targetId = targetPermit?.dbId ?? targetPermit?.permitCode ?? id;
    const targetColumn = targetPermit?.dbId ? "id" : "permit_code";
    const permitsTable = supabase.from("permits") as any;
    const { error } = await permitsTable
      .update({
        status: newStatus,
        uploaded: newStatus === "uploaded",
        last_updated_at: new Date().toISOString(),
        updated_by: currentUserId,
      })
      .eq(targetColumn, targetId);

    if (error) {
      toast.error("Failed to update status", { description: error.message });
      return;
    }

    setPermits(prev => prev.map(permit => 
      permit.id === id ? { 
        ...permit, 
        status: newStatus,
        uploaded: newStatus === 'uploaded',
        lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm'),
        updatedBy: profile?.name && profile?.email ? `${profile.name} (${profile.email})` : (profile?.name || profile?.email || 'Current User'),
        trackingHistory: [
          { date: format(new Date(), 'yyyy-MM-dd HH:mm'), action: `Status updated to ${statusLabels[newStatus]}`, by: profile?.name || profile?.email || 'Current User' },
          ...permit.trackingHistory
        ]
      } : permit
    ));

    if (targetPermit?.dbId) {
      await (supabase.from("permit_history") as any).insert({
        permit_id: targetPermit.dbId,
        action: `Status updated to ${statusLabels[newStatus]}`,
        action_by: currentUserId,
        metadata: { user_name: profile?.name ?? null, user_email: profile?.email ?? null },
      });
    }

    toast.success(`Status updated to ${statusLabels[newStatus]}`);
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border/60 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Pending Uploads</h3>
          <p className="text-xs text-muted-foreground mt-1">Due within 7 days - Awaiting portal submission</p>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg">
          {pendingItems.length} items
        </span>
      </div>

      {pendingItems.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <p className="text-sm font-medium text-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No urgent permits awaiting upload</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Confirmation #</th>
                  <th>Arrival</th>
                  <th>Property</th>
                  <th>Days Left</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingItems.map((item) => (
                  <tr key={item.id} className={cn(item.isUrgent && "bg-danger/5")}>
                    <td>
                      <div className="flex items-center gap-2">
                        {item.isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                        <span className="font-mono text-xs font-bold text-primary">{item.id}</span>
                      </div>
                    </td>
                    <td className="font-medium text-sm">{item.name}</td>
                    <td className="text-sm text-muted-foreground font-mono">{item.confirmationNumber}</td>
                    <td className="text-muted-foreground text-sm">{item.arrivalDate}</td>
                    <td className="text-sm">{item.property}</td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold",
                        item.daysUntilDeparture <= 1 ? "bg-danger/10 text-danger" : 
                        item.daysUntilDeparture <= 3 ? "bg-warning/10 text-warning" : "bg-muted/60 text-muted-foreground"
                      )}>
                        {item.daysUntilDeparture === 0 ? "Today" : 
                         item.daysUntilDeparture === 1 ? "1 day" : 
                         `${item.daysUntilDeparture} days`}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        item.status === "pending" ? "badge-pending" :
                        item.status === "approved" ? "badge-approved" : "badge-rejected"
                      )}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <StatusUpdatePopover 
                        currentStatus={item.status} 
                        itemId={item.id} 
                        onStatusChange={handleStatusChange} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border/60">
            {pendingItems.map((item) => (
              <div key={item.id} className={cn("p-4 space-y-3", item.isUrgent && "bg-danger/5")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                    <span className="font-mono text-xs font-bold text-primary">{item.id}</span>
                  </div>
                  <span className={cn(
                    item.status === "pending" ? "badge-pending" :
                    item.status === "approved" ? "badge-approved" : "badge-rejected"
                  )}>
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">Confirmation #{item.confirmationNumber}</p>
                  <p className="text-xs text-muted-foreground">Property: {item.property}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Arrival: {item.arrivalDate}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-lg",
                      item.daysUntilDeparture <= 1 ? "bg-danger/10 text-danger" : 
                      item.daysUntilDeparture <= 3 ? "bg-warning/10 text-warning" : "bg-muted/60 text-muted-foreground"
                    )}>
                      {item.daysUntilDeparture === 0 ? "Today" : `${item.daysUntilDeparture}d`}
                    </span>
                  </div>
                  <MobileStatusUpdatePopover 
                    currentStatus={item.status} 
                    itemId={item.id} 
                    onStatusChange={handleStatusChange} 
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
