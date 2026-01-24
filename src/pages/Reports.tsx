import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sparkles,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateFilter, type FilterOption } from "@/components/dashboard/DateFilter";
import { PermitBarChart, PermitPieChart } from "@/components/dashboard/PermitStatusChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Workbook } from "exceljs";
import { useUserAccess } from "@/context/UserAccessContext";
import type { DateRange } from "react-day-picker";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

const reportTypes = [
  { id: "daily", title: "Daily Summary", description: "Overview of permits processed today", icon: Calendar, color: "bg-primary/10 text-primary" },
  { id: "weekly", title: "Weekly Report", description: "Week-over-week permit analysis", icon: BarChart3, color: "bg-success/10 text-success" },
  { id: "arrival", title: "Arrival Report", description: "New permit arrivals, intake trends, and backlog status", icon: TrendingUp, color: "bg-info/10 text-info" },
  { id: "permit-status", title: "Permit Status", description: "Professional status overview with approvals, pending, and rejections", icon: PieChart, color: "bg-warning/10 text-warning" },
];

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

const Reports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [permits, setPermits] = useState<Tables<"permits">[]>([]);
  const [summaryRows, setSummaryRows] = useState<Array<{
    metric: string;
    current: string;
    previous: string;
    change: string;
    positive: boolean;
  }>>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<FilterOption>("week");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "uploaded" | "all">("pending");
  const { profile } = useUserAccess();
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  
  useDocumentTitle("Reports");

  const selectedReport = useMemo(
    () => reportTypes.find((report) => report.id === selectedReportId) ?? reportTypes[0],
    [selectedReportId],
  );

  useEffect(() => {
    let isMounted = true;

    const loadLogo = async () => {
      try {
        const response = await fetch("/favicon.png");
        if (!response.ok) throw new Error("Unable to load favicon.");
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read favicon"));
          reader.readAsDataURL(blob);
        });
        if (isMounted) setLogoDataUrl(dataUrl);
      } catch (error) {
        if (isMounted) setLogoDataUrl(null);
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const getRangeForFilter = (filter: FilterOption) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    if (filter === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter === "week") {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }

    if (filter === "month") {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end };
    }

    if (filter === "year") {
      return { start: new Date(now.getFullYear(), 0, 1), end };
    }

    if (filter === "custom") {
      if (customRange?.from && customRange?.to) {
        const customStart = new Date(customRange.from);
        const customEnd = new Date(customRange.to);
        customStart.setHours(0, 0, 0, 0);
        customEnd.setHours(23, 59, 59, 999);
        return { start: customStart, end: customEnd };
      }
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }

    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const getArrivalRangeForFilter = (filter: FilterOption) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    start.setHours(0, 0, 0, 0);

    if (filter === "today") {
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter === "week") {
      end.setDate(now.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter === "month") {
      end.setMonth(now.getMonth() + 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter === "year") {
      end.setFullYear(now.getFullYear() + 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (filter === "custom") {
      if (customRange?.from && customRange?.to) {
        const customStart = new Date(customRange.from);
        const customEnd = new Date(customRange.to);
        customStart.setHours(0, 0, 0, 0);
        customEnd.setHours(23, 59, 59, 999);
        return { start: customStart, end: customEnd };
      }
      end.setDate(now.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    end.setDate(now.getDate() + 30);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  const getStatusLabel = (status: Tables<"permits">["status"] | "all") => {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    if (status === "uploaded") return "Uploaded";
    if (status === "all") return "All statuses";
    return "Pending";
  };

  const getStatusClass = (status: Tables<"permits">["status"]) => {
    if (status === "approved") return "badge-approved";
    if (status === "rejected") return "badge-rejected";
    if (status === "uploaded") return "badge-uploaded";
    return "badge-pending";
  };

  const { start: arrivalStart, end: arrivalEnd } = useMemo(
    () => getArrivalRangeForFilter(dateFilter),
    [dateFilter],
  );

  const parseDateOnly = (value?: string | null) => {
    if (!value) return null;
    return new Date(`${value}T00:00:00`);
  };

  const arrivalPermits = useMemo(() => {
    const rangeStart = new Date(arrivalStart);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(arrivalEnd);
    rangeEnd.setHours(23, 59, 59, 999);

    return permits.filter((permit) => {
      const arrivalDate = parseDateOnly(permit.arrival_date);
      if (!arrivalDate) return false;
      return arrivalDate >= rangeStart && arrivalDate <= rangeEnd;
    });
  }, [permits, arrivalStart, arrivalEnd]);

  const statusFilteredPermits = useMemo(() => {
    if (statusFilter === "all") return permits;
    return permits.filter((permit) => permit.status === statusFilter);
  }, [permits, statusFilter]);

  const arrivalRangeLabel = `${arrivalStart.toLocaleDateString()} – ${arrivalEnd.toLocaleDateString()}`;

  const resolveLogoDataUrl = async () => {
    if (logoDataUrl) return logoDataUrl;
    try {
      const response = await fetch("/favicon.png");
      if (!response.ok) return null;
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read favicon"));
        reader.readAsDataURL(blob);
      });
      setLogoDataUrl(dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("permits")
        .select("id, permit_code, confirmation_number, guest_name, arrival_date, departure_date, property, status, uploaded, last_updated_at, created_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        toast.error("Failed to load report data", { description: error.message });
        setIsLoading(false);
        return;
      }

      const permits = (data ?? []) as Tables<"permits">[];
      setPermits(permits);
      const now = new Date();
      const thisWeekStart = new Date();
      thisWeekStart.setDate(now.getDate() - 7);
      const lastWeekStart = new Date();
      lastWeekStart.setDate(now.getDate() - 14);

      const within = (d: string, start: Date, end: Date) => {
        const date = new Date(d);
        return date >= start && date <= end;
      };

      const currentWeek = permits.filter(p => within(p.created_at, thisWeekStart, now));
      const lastWeek = permits.filter(p => within(p.created_at, lastWeekStart, thisWeekStart));

      const countBy = (list: typeof permits, status: string) => list.filter(p => p.status === status).length;
      const uploadedCount = (list: typeof permits) => list.filter(p => p.status === "uploaded" || p.uploaded).length;

      const formatChange = (current: number, previous: number) => {
        if (previous === 0) {
          return current === 0 ? "0%" : "+100%";
        }
        const diff = ((current - previous) / previous) * 100;
        const sign = diff >= 0 ? "+" : "";
        return `${sign}${diff.toFixed(1)}%`;
      };

      const avgProcessingDays = (list: typeof permits) => {
        const uploaded = list.filter(p => p.status === "uploaded" && p.last_updated_at);
        if (uploaded.length === 0) return null;
        const totalDays = uploaded.reduce((sum, p) => {
          const created = new Date(p.created_at).getTime();
          const updated = new Date(p.last_updated_at as string).getTime();
          return sum + Math.max(0, updated - created);
        }, 0) / (1000 * 60 * 60 * 24);
        return Number((totalDays / uploaded.length).toFixed(1));
      };

      const rows = [
        {
          metric: "Total Permits",
          current: String(currentWeek.length),
          previous: String(lastWeek.length),
          change: formatChange(currentWeek.length, lastWeek.length),
          positive: currentWeek.length >= lastWeek.length,
        },
        {
          metric: "Approved",
          current: String(countBy(currentWeek, "approved")),
          previous: String(countBy(lastWeek, "approved")),
          change: formatChange(countBy(currentWeek, "approved"), countBy(lastWeek, "approved")),
          positive: countBy(currentWeek, "approved") >= countBy(lastWeek, "approved"),
        },
        {
          metric: "Pending",
          current: String(countBy(currentWeek, "pending")),
          previous: String(countBy(lastWeek, "pending")),
          change: formatChange(countBy(currentWeek, "pending"), countBy(lastWeek, "pending")),
          positive: countBy(currentWeek, "pending") <= countBy(lastWeek, "pending"),
        },
        {
          metric: "Rejected",
          current: String(countBy(currentWeek, "rejected")),
          previous: String(countBy(lastWeek, "rejected")),
          change: formatChange(countBy(currentWeek, "rejected"), countBy(lastWeek, "rejected")),
          positive: countBy(currentWeek, "rejected") <= countBy(lastWeek, "rejected"),
        },
        {
          metric: "Uploaded to Portal",
          current: String(uploadedCount(currentWeek)),
          previous: String(uploadedCount(lastWeek)),
          change: formatChange(uploadedCount(currentWeek), uploadedCount(lastWeek)),
          positive: uploadedCount(currentWeek) >= uploadedCount(lastWeek),
        },
        {
          metric: "Avg. Processing Time",
          current: avgProcessingDays(currentWeek) === null ? "—" : `${avgProcessingDays(currentWeek)} days`,
          previous: avgProcessingDays(lastWeek) === null ? "—" : `${avgProcessingDays(lastWeek)} days`,
          change: "—",
          positive: true,
        },
      ];

      setSummaryRows(rows);
      setIsLoading(false);
    };

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const openExportDialog = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsExportDialogOpen(true);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const getBase64FromDataUrl = (dataUrl: string) => {
    const [, base64] = dataUrl.split(",");
    return base64 ?? "";
  };

  const getExportTable = () => {
    if (selectedReport.id === "arrival") {
      const rows = arrivalPermits.map((permit) => [
        permit.permit_code ?? permit.confirmation_number ?? permit.id,
        permit.guest_name,
        formatDate(permit.arrival_date),
        formatDate(permit.departure_date),
        permit.property ?? "—",
        getStatusLabel(permit.status),
      ]);

      return {
        description: `Arrival report for ${arrivalRangeLabel}`,
        columns: ["Permit", "Guest", "Arrival", "Departure", "Property", "Status"],
        rows:
          rows.length > 0
            ? rows
            : [["—", "No arrivals found for the selected range", "—", "—", "—", "—"]],
      };
    }

    if (selectedReport.id === "permit-status") {
      const rows = statusFilteredPermits.map((permit) => [
        permit.permit_code ?? permit.confirmation_number ?? permit.id,
        permit.guest_name,
        getStatusLabel(permit.status),
        permit.uploaded ? "Yes" : "No",
        formatDateTime(permit.last_updated_at),
      ]);

      return {
        description: `Permit status report: ${getStatusLabel(statusFilter)}`,
        columns: ["Permit", "Guest", "Status", "Uploaded", "Last Updated"],
        rows:
          rows.length > 0
            ? rows
            : [["—", `No permits found for ${getStatusLabel(statusFilter)}`, "—", "—", "—"]],
      };
    }

    return {
      description: "Weekly summary overview",
      columns: ["Metric", "This Week", "Last Week", "Change"],
      rows: summaryRows.map((row) => [row.metric, row.current, row.previous, row.change]),
    };
  };

  const exportToPdf = async () => {
    const exportTable = getExportTable();
    const logo = await resolveLogoDataUrl();
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(245, 247, 252);
    doc.rect(0, 0, pageWidth, 120, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(40, 120, pageWidth - 40, 120);

    if (logo) {
      doc.addImage(logo, "PNG", 40, 28, 40, 40);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Aura Reports", pageWidth - 40, 50, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(selectedReport.title, pageWidth - 40, 72, { align: "right" });
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - 40, 92, { align: "right" });
    doc.setTextColor(17, 24, 39);

    const cardY = 138;
    const preparedByName = profile?.name ?? "User";
    const preparedByEmail = profile?.email ?? "—";
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(40, cardY, pageWidth - 80, 56, 12, 12, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(40, cardY, pageWidth - 80, 56, 12, 12, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(exportTable.description, 56, cardY + 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Records: ${exportTable.rows.length}`, 56, cardY + 42);
    doc.text(`Prepared by ${preparedByName}`, pageWidth - 56, cardY + 24, { align: "right" });
    doc.text(preparedByEmail, pageWidth - 56, cardY + 42, { align: "right" });
    doc.setTextColor(17, 24, 39);

    autoTable(doc, {
      startY: 215,
      head: [exportTable.columns],
      body: exportTable.rows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9.5, cellPadding: 6, textColor: [30, 41, 59] },
      columnStyles: exportTable.columns.reduce((styles, _, index) => {
        if (index > 0) {
          return { ...styles, [index]: { halign: "right" } };
        }
        return styles;
      }, {} as Record<number, { halign: "right" }>),
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.5,
      margin: { left: 40, right: 40 },
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(40, pageHeight - 40, pageWidth - 40, pageHeight - 40);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Aura Reports • Confidential", 40, pageHeight - 24);
    doc.text(`Page 1`, pageWidth - 40, pageHeight - 24, { align: "right" });
    doc.setTextColor(17, 24, 39);

    const filename = `Aura_${selectedReport.title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const exportToExcel = async () => {
    const exportTable = getExportTable();
    const logo = await resolveLogoDataUrl();
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Report", { views: [{ state: "frozen", ySplit: 6 }] });

    worksheet.columns = exportTable.columns.map((header, index) => ({
      header,
      key: `col_${index}`,
      width: index === 0 ? 28 : 16,
    }));

    const lastColumn = String.fromCharCode(64 + exportTable.columns.length);

    worksheet.mergeCells(`A1:${lastColumn}1`);
    worksheet.getCell("A1").value = "Aura Reports";
    worksheet.getCell("A1").font = { size: 16, bold: true };
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    worksheet.mergeCells(`A2:${lastColumn}2`);
    worksheet.getCell("A2").value = selectedReport.title;
    worksheet.getCell("A2").font = { size: 12, bold: true };
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };

    worksheet.mergeCells(`A3:${lastColumn}3`);
    worksheet.getCell("A3").value = `Generated ${new Date().toLocaleString()}`;
    worksheet.getCell("A3").font = { size: 10, color: { argb: "6B7280" } };

    worksheet.mergeCells(`A4:${lastColumn}4`);
    worksheet.getCell("A4").value = `Prepared by ${profile?.name ?? "User"} • ${profile?.email ?? "—"}`;
    worksheet.getCell("A4").font = { size: 10, color: { argb: "6B7280" } };

    worksheet.addRow([]);
    const headerRow = worksheet.getRow(6);
    headerRow.values = exportTable.columns;
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "111827" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 20;

    exportTable.rows.forEach((row) => {
      worksheet.addRow(row);
    });

    exportTable.columns.forEach((_, index) => {
      if (index > 0) {
        worksheet.getColumn(index + 1).alignment = { horizontal: "right" };
      }
    });

    if (logo) {
      const imageId = workbook.addImage({ base64: getBase64FromDataUrl(logo), extension: "png" });
      worksheet.addImage(imageId, { tl: { col: 3.6, row: 0.1 }, ext: { width: 32, height: 32 } });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Aura_${selectedReport.title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadBlob(new Blob([buffer]), filename);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (exportFormat === "pdf") {
        await exportToPdf();
      } else {
        await exportToExcel();
      }
      setIsExportDialogOpen(false);
      toast.success(`${selectedReport.title} exported`, { description: exportFormat === "pdf" ? "PDF ready" : "Excel ready" });
    } catch (error) {
      toast.error("Export failed", { description: "Please try again." });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <ReportsSkeleton />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <Breadcrumbs />
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground mt-1">Generate and export permit reports</p>
        </div>
        <div className="flex gap-2">
          <DateFilter
            value={dateFilter}
            onChange={setDateFilter}
            range={customRange}
            onRangeChange={setCustomRange}
          />
          <Button variant="outline" className="gap-2" onClick={() => openExportDialog("weekly")}>
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </motion.div>

      {/* Quick Report Types */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <div 
            key={report.title} 
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group"
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl ${report.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <report.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Ready</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 text-primary hover:text-primary"
              onClick={() => openExportDialog(report.id)}
            >
              <Download className="w-4 h-4" />
              Generate
            </Button>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PermitBarChart />
        <PermitPieChart />
      </motion.div>

      {/* Summary Table */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">Monthly Summary</h3>
            <p className="text-sm text-muted-foreground">January 2026 permit statistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openExportDialog("weekly")}>
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openExportDialog("weekly")}>
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="text-right">This Week</th>
                <th className="text-right">Last Week</th>
                <th className="text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.metric}>
                  <td className="font-medium">{row.metric}</td>
                  <td className="text-right">{row.current}</td>
                  <td className="text-right text-muted-foreground">{row.previous}</td>
                  <td className={`text-right font-medium ${row.positive ? "text-success" : "text-danger"}`}>
                    {row.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Arrival Report</h3>
                <p className="text-sm text-muted-foreground">Arrivals for {arrivalRangeLabel}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => openExportDialog("arrival")}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permit</th>
                  <th>Guest</th>
                  <th>Arrival</th>
                  <th>Departure</th>
                  <th>Property</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {arrivalPermits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground">
                      No arrivals found for this range.
                    </td>
                  </tr>
                ) : (
                  arrivalPermits.map((permit) => (
                    <tr key={permit.id}>
                      <td className="font-medium">{permit.permit_code ?? permit.confirmation_number ?? permit.id}</td>
                      <td>{permit.guest_name}</td>
                      <td>{formatDate(permit.arrival_date)}</td>
                      <td>{formatDate(permit.departure_date)}</td>
                      <td>{permit.property ?? "—"}</td>
                      <td>
                        <span className={getStatusClass(permit.status)}>{getStatusLabel(permit.status)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Permit Status Report</h3>
                <p className="text-sm text-muted-foreground">Filtered by {statusFilter === "all" ? "all statuses" : getStatusLabel(statusFilter)}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => openExportDialog("permit-status")}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permit</th>
                  <th>Guest</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {statusFilteredPermits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground">
                      No permits found for this status.
                    </td>
                  </tr>
                ) : (
                  statusFilteredPermits.map((permit) => (
                    <tr key={permit.id}>
                      <td className="font-medium">{permit.permit_code ?? permit.confirmation_number ?? permit.id}</td>
                      <td>{permit.guest_name}</td>
                      <td>
                        <span className={getStatusClass(permit.status)}>{getStatusLabel(permit.status)}</span>
                      </td>
                      <td>{permit.uploaded ? "Yes" : "No"}</td>
                      <td>{formatDateTime(permit.last_updated_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Export {selectedReport.title}
            </DialogTitle>
            <DialogDescription>
              Choose the format you need. We will include the Aura favicon and branding in the report header.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Report details</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            {selectedReport.id === "arrival" && (
              <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                Arrival range: <span className="text-foreground font-medium">{arrivalRangeLabel}</span>
              </div>
            )}
            {selectedReport.id === "permit-status" && (
              <div className="grid gap-2">
                <p className="text-sm font-medium text-foreground">Select permit status</p>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as "pdf" | "excel")}
              className="gap-3"
            >
              {([
                {
                  value: "pdf",
                  title: "PDF",
                  description: "Perfect for sharing and printing with branded header.",
                  icon: FileText,
                },
                {
                  value: "excel",
                  title: "Excel",
                  description: "Editable workbook with the same metrics and logo.",
                  icon: FileSpreadsheet,
                },
              ] as const).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors",
                    exportFormat === option.value ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <option.icon className="h-5 w-5 text-muted-foreground" />
                </label>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <FileDown className="h-4 w-4" />
              {isExporting ? "Preparing..." : "Generate Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Reports;
