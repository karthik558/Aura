import { format, addDays } from "date-fns";

export interface Permit {
  id: string;
  dbId?: string;
  permitCode?: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  nationality: string;
  passportNo: string;
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
    guestName: "Michael Anderson", 
    arrivalDate: formatDate(addDays(today, -7)), 
    departureDate: formatDate(addDays(today, 2)),
    nationality: "USA",
    passportNo: "US****234",
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
    guestName: "Sarah Williams", 
    arrivalDate: formatDate(addDays(today, -5)), 
    departureDate: formatDate(addDays(today, 3)),
    nationality: "UK",
    passportNo: "GB****567",
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
    guestName: "Robert Chen", 
    arrivalDate: formatDate(addDays(today, -3)), 
    departureDate: formatDate(addDays(today, 5)),
    nationality: "China",
    passportNo: "CN****890",
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
    guestName: "Emily Johnson", 
    arrivalDate: formatDate(addDays(today, -2)), 
    departureDate: formatDate(addDays(today, 6)),
    nationality: "Canada",
    passportNo: "CA****123",
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
    guestName: "David Martinez", 
    arrivalDate: formatDate(addDays(today, -1)), 
    departureDate: formatDate(addDays(today, 4)),
    nationality: "Spain",
    passportNo: "ES****456",
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
    guestName: "Lisa Thompson", 
    arrivalDate: formatDate(today), 
    departureDate: formatDate(addDays(today, 7)),
    nationality: "Australia",
    passportNo: "AU****789",
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
    guestName: "James Wilson", 
    arrivalDate: formatDate(today), 
    departureDate: formatDate(addDays(today, 1)),
    nationality: "Germany",
    passportNo: "DE****012",
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
    guestName: "Amanda Brown", 
    arrivalDate: formatDate(addDays(today, 1)), 
    departureDate: formatDate(addDays(today, 8)),
    nationality: "France",
    passportNo: "FR****345",
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
