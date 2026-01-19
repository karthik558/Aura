import { useState, useMemo } from "react";
import { RefreshCw, AlertTriangle, Check, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { initialPermits, Permit } from "@/data/permits";
import { differenceInDays, format, parseISO } from "date-fns";

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="h-8 px-3 rounded-lg gap-1.5 bg-primary hover:bg-primary/90">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-xs">Update</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 pb-1">Update Status</p>
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted",
                  currentStatus === option.value && "bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    "w-3.5 h-3.5",
                    option.value === "pending" && "text-warning",
                    option.value === "approved" && "text-success",
                    option.value === "rejected" && "text-danger",
                    option.value === "uploaded" && "text-primary"
                  )} />
                  <span>{option.label}</span>
                </div>
                {currentStatus === option.value && (
                  <Check className="w-3.5 h-3.5 text-primary" />
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 pb-1">Update Status</p>
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-muted",
                  currentStatus === option.value && "bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    "w-3.5 h-3.5",
                    option.value === "pending" && "text-warning",
                    option.value === "approved" && "text-success",
                    option.value === "rejected" && "text-danger",
                    option.value === "uploaded" && "text-primary"
                  )} />
                  <span>{option.label}</span>
                </div>
                {currentStatus === option.value && (
                  <Check className="w-3.5 h-3.5 text-primary" />
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
  const [permits, setPermits] = useState<Permit[]>(initialPermits);

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

  const handleStatusChange = (id: string, newStatus: Permit["status"]) => {
    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      uploaded: 'Uploaded'
    };
    
    setPermits(prev => prev.map(permit => 
      permit.id === id ? { 
        ...permit, 
        status: newStatus,
        uploaded: newStatus === 'uploaded',
        lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm'),
        updatedBy: 'Current User',
        trackingHistory: [
          { date: format(new Date(), 'yyyy-MM-dd HH:mm'), action: `Status updated to ${statusLabels[newStatus]}`, by: 'Current User' },
          ...permit.trackingHistory
        ]
      } : permit
    ));
    
    toast.success(`Status updated to ${statusLabels[newStatus]}`);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-soft">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pending Uploads</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Due within 7 days - Awaiting portal submission</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {pendingItems.length} items
        </span>
      </div>

      {pendingItems.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">All permits are uploaded or no urgent items</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Guest</th>
                  <th>Arrival</th>
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
                        <span className="font-mono text-xs font-semibold text-primary">{item.id}</span>
                      </div>
                    </td>
                    <td className="font-medium text-sm">{item.guestName}</td>
                    <td className="text-muted-foreground text-sm">{item.arrivalDate}</td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        item.daysUntilDeparture <= 1 ? "bg-danger/10 text-danger" : 
                        item.daysUntilDeparture <= 3 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
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
          <div className="md:hidden divide-y divide-border">
            {pendingItems.map((item) => (
              <div key={item.id} className={cn("p-4 space-y-3", item.isUrgent && "bg-danger/5")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.isUrgent && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                    <span className="font-mono text-xs font-semibold text-primary">{item.id}</span>
                  </div>
                  <span className={cn(
                    item.status === "pending" ? "badge-pending" :
                    item.status === "approved" ? "badge-approved" : "badge-rejected"
                  )}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm font-medium">{item.guestName}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Arrival: {item.arrivalDate}</span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      item.daysUntilDeparture <= 1 ? "bg-danger/10 text-danger" : 
                      item.daysUntilDeparture <= 3 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
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
