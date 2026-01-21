import { format, addDays } from "date-fns";

export interface Permit {
  id: string;
  dbId?: string;
  permitCode?: string;
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
  trackingHistory: { date: string; action: string; by: string }[];
}

// Get current date for realistic mock data
const today = new Date();
const formatDate = (date: Date) => format(date, "yyyy-MM-dd");
const formatDateTime = (date: Date) => format(date, "yyyy-MM-dd HH:mm");

export const initialPermits: Permit[] = [
  { 
    id: "PRM-001", 
    name: "Michael Anderson", 
    confirmationNumber: "CONF-1001",
    arrivalDate: formatDate(addDays(today, -7)), 
    departureDate: formatDate(addDays(today, 2)),
    adults: 2,
    property: "Aura Downtown",
    status: "pending", 
    uploaded: false, 
    lastUpdated: formatDateTime(addDays(today, -2)), 
    updatedBy: "John Doe",
    trackingHistory: [
      { date: formatDateTime(addDays(today, -2)), action: "Status updated to Pending", by: "John Doe" },
      { date: formatDateTime(addDays(today, -3)), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-002", 
    name: "Sarah Williams", 
    confirmationNumber: "CONF-1002",
    arrivalDate: formatDate(addDays(today, -5)), 
    departureDate: formatDate(addDays(today, 3)),
    adults: 1,
    property: "Aura Airport",
    status: "approved", 
    uploaded: false, 
    lastUpdated: formatDateTime(addDays(today, -1)), 
    updatedBy: "Jane Smith",
    trackingHistory: [
      { date: formatDateTime(addDays(today, -1)), action: "Approved", by: "Jane Smith" },
      { date: formatDateTime(addDays(today, -2)), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-003", 
    name: "Robert Chen", 
    confirmationNumber: "CONF-1003",
    arrivalDate: formatDate(addDays(today, -3)), 
    departureDate: formatDate(addDays(today, 5)),
    adults: 2,
    property: "Aura Marina",
    status: "pending", 
    uploaded: false, 
    lastUpdated: formatDateTime(addDays(today, -2)), 
    updatedBy: "John Doe",
    trackingHistory: [
      { date: formatDateTime(addDays(today, -2)), action: "Under review", by: "John Doe" },
      { date: formatDateTime(addDays(today, -3)), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-004", 
    name: "Emily Johnson", 
    confirmationNumber: "CONF-1004",
    arrivalDate: formatDate(addDays(today, -2)), 
    departureDate: formatDate(addDays(today, 6)),
    adults: 3,
    property: "Aura City Center",
    status: "rejected", 
    uploaded: false, 
    lastUpdated: formatDateTime(addDays(today, -1)), 
    updatedBy: "Admin",
    trackingHistory: [
      { date: formatDateTime(addDays(today, -1)), action: "Rejected - Invalid documents", by: "Admin" },
      { date: formatDateTime(addDays(today, -2)), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-005", 
    name: "David Martinez", 
    confirmationNumber: "CONF-1005",
    arrivalDate: formatDate(addDays(today, -1)), 
    departureDate: formatDate(addDays(today, 4)),
    adults: 2,
    property: "Aura Hills",
    status: "approved", 
    uploaded: false, 
    lastUpdated: formatDateTime(today), 
    updatedBy: "Jane Smith",
    trackingHistory: [
      { date: formatDateTime(today), action: "Approved", by: "Jane Smith" },
      { date: formatDateTime(addDays(today, -1)), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-006", 
    name: "Lisa Thompson", 
    confirmationNumber: "CONF-1006",
    arrivalDate: formatDate(today), 
    departureDate: formatDate(addDays(today, 7)),
    adults: 1,
    property: "Aura Resort",
    status: "uploaded", 
    uploaded: true, 
    lastUpdated: formatDateTime(today), 
    updatedBy: "John Doe",
    trackingHistory: [
      { date: formatDateTime(today), action: "Uploaded to portal", by: "John Doe" },
      { date: formatDateTime(addDays(today, -1)), action: "Approved", by: "Admin" },
      { date: formatDateTime(addDays(today, -2)), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-007", 
    name: "James Wilson", 
    confirmationNumber: "CONF-1007",
    arrivalDate: formatDate(today), 
    departureDate: formatDate(addDays(today, 1)),
    adults: 2,
    property: "Aura Gardens",
    status: "pending", 
    uploaded: false, 
    lastUpdated: formatDateTime(today), 
    updatedBy: "Admin",
    trackingHistory: [
      { date: formatDateTime(today), action: "Submitted for review", by: "Admin" },
      { date: formatDateTime(today), action: "Permit created", by: "System" }
    ]
  },
  { 
    id: "PRM-008", 
    name: "Amanda Brown", 
    confirmationNumber: "CONF-1008",
    arrivalDate: formatDate(addDays(today, 1)), 
    departureDate: formatDate(addDays(today, 8)),
    adults: 2,
    property: "Aura Seaside",
    status: "approved", 
    uploaded: true, 
    lastUpdated: formatDateTime(today), 
    updatedBy: "Jane Smith",
    trackingHistory: [
      { date: formatDateTime(today), action: "Uploaded to portal", by: "Jane Smith" },
      { date: formatDateTime(addDays(today, -1)), action: "Approved", by: "Admin" },
      { date: formatDateTime(addDays(today, -1)), action: "Permit created", by: "System" }
    ]
  },
];

export const statusConfig = {
  pending: { label: "Pending", className: "badge-pending" },
  approved: { label: "Approved", className: "badge-approved" },
  rejected: { label: "Rejected", className: "badge-rejected" },
  uploaded: { label: "Uploaded", className: "badge-uploaded" },
};
