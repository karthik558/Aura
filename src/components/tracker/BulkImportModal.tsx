import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface ImportError {
  row: number;
  message: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: ImportError[];
}

export type ImportedPermitRow = {
  name: string;
  confirmationNumber: string;
  arrivalDate: string;
  departureDate: string;
  adults?: number;
  property?: string;
  status: "pending" | "approved" | "rejected" | "uploaded";
};

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (data: ImportedPermitRow[]) => void;
}

type ImportStatus = "idle" | "uploading" | "processing" | "complete" | "error";

export function BulkImportModal({ open, onClose, onImportComplete }: BulkImportModalProps) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ".xlsx,.xls,.csv,.xml";
  const acceptedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "text/xml",
    "application/xml"
  ];

  const resetState = () => {
    setStatus("idle");
    setProgress(0);
    setSelectedFile(null);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['xlsx', 'xls', 'csv', 'xml'];
    return validExtensions.includes(extension || '');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        setStatus("error");
        setResult({
          total: 0,
          success: 0,
          failed: 0,
          errors: [{ row: 0, message: "Invalid file format. Please use Excel (.xlsx, .xls), CSV, or XML files." }]
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setStatus("idle");
        setResult(null);
      } else {
        setStatus("error");
        setResult({
          total: 0,
          success: 0,
          failed: 0,
          errors: [{ row: 0, message: "Invalid file format. Please use Excel (.xlsx, .xls), CSV, or XML files." }]
        });
      }
    }
  };

  const parseCSVRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    result.push(current.trim());
    return result.map((value) => value.replace(/^"|"$/g, ""));
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = parseCSVRow(lines[0]).map((header) => header.trim());
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });
      data.push(row);
    }
    
    return data;
  };

  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const getValue = (row: Record<string, any>, keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        return row[key];
      }
    }
    const normalized = Object.entries(row).reduce<Record<string, any>>((acc, [key, val]) => {
      acc[normalizeKey(key)] = val;
      return acc;
    }, {});
    for (const key of keys) {
      const normalizedKey = normalizeKey(key);
      if (normalized[normalizedKey] !== undefined && normalized[normalizedKey] !== null && String(normalized[normalizedKey]).trim() !== "") {
        return normalized[normalizedKey];
      }
    }
    return "";
  };

  const parseDate = (value: string) => {
    const trimmed = value?.toString().trim();
    if (!trimmed) return "";

    const parts = trimmed.includes("/")
      ? trimmed.split("/")
      : trimmed.includes("-")
        ? trimmed.split("-")
        : [];

    if (parts.length === 3) {
      const [d, m, y] = parts.map((p) => p.trim());
      const day = d.padStart(2, "0");
      const month = m.padStart(2, "0");
      const year = y.length === 2 ? `20${y}` : y;
      return `${year}-${month}-${day}`;
    }

    return trimmed;
  };

  const parseXML = (content: string): any[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const rows = xmlDoc.getElementsByTagName("row");
    const data: any[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row: any = {};
      const children = rows[i].children;
      for (let j = 0; j < children.length; j++) {
        row[children[j].tagName] = children[j].textContent || '';
      }
      data.push(row);
    }
    
    return data;
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setProgress(10);

    try {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      let parsedData: any[] = [];

      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(30);
      setStatus("processing");

      if (extension === 'csv') {
        const content = await selectedFile.text();
        parsedData = parseCSV(content);
      } else if (extension === 'xml') {
        const content = await selectedFile.text();
        parsedData = parseXML(content);
      } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      }

      setProgress(60);

      // Validate and process data
      const errors: ImportError[] = [];
      const validData: ImportedPermitRow[] = [];

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        // Simulate processing delay for each row
        if (i % 10 === 0) {
          setProgress(60 + Math.floor((i / parsedData.length) * 30));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Basic validation
        const name = getValue(row, ["Name", "name", "guestName", "guest_name", "Guest Name"]);
        const confirmationNumber = getValue(row, ["Confirmation Number", "confirmationNumber", "confirmation_number", "PassportNo", "passport_no"]);
        const arrivalDate = getValue(row, ["Arrival", "arrivalDate", "arrival_date", "Arrival Date", "date", "Date"]);
        const departureDate = getValue(row, ["Departure", "departureDate", "departure_date", "Departure Date", "endDate", "EndDate"]);
        const adultsRaw = getValue(row, ["Adults", "adults", "adult", "Adult"]);
        const adults = adultsRaw ? Number(adultsRaw) : undefined;
        const property = getValue(row, ["Property", "property", "hotel", "Hotel", "Nationality", "nationality"]);
        const status = (getValue(row, ["Status", "status"]) || "pending") as ImportedPermitRow["status"];

        if (!name) {
          errors.push({ row: i + 2, message: "Missing name" });
          continue;
        }

        const parsedArrival = parseDate(arrivalDate);
        const parsedDeparture = parseDate(departureDate);

        if (!parsedArrival) {
          errors.push({ row: i + 2, message: "Missing arrival date" });
          continue;
        }

        if (!parsedDeparture) {
          errors.push({ row: i + 2, message: "Missing departure date" });
          continue;
        }

        validData.push({
          name: name,
          confirmationNumber,
          arrivalDate: parsedArrival,
          departureDate: parsedDeparture,
          adults: Number.isFinite(adults) ? adults : undefined,
          property,
          status,
        });
      }

      setProgress(100);

      setResult({
        total: parsedData.length,
        success: validData.length,
        failed: errors.length,
        errors: errors.slice(0, 10) // Show max 10 errors
      });

      if (validData.length > 0) {
        onImportComplete(validData);
      }

      setStatus("complete");

    } catch (error) {
      console.error("Import error:", error);
      setStatus("error");
      setResult({
        total: 0,
        success: 0,
        failed: 1,
        errors: [{ row: 0, message: "Failed to parse file. Please check the file format." }]
      });
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileSpreadsheet className="w-8 h-8" />;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return <FileText className="w-8 h-8" />;
    return <FileSpreadsheet className="w-8 h-8" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Bulk Import Permits</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Import multiple permits at once</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          {/* File Drop Zone */}
          {status === "idle" && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-muted/30",
                selectedFile && "border-primary bg-primary/5"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                  selectedFile ? "bg-primary/10" : "bg-muted/60"
                )}>
                  <div className={cn(
                    "transition-colors",
                    selectedFile ? "text-primary" : "text-muted-foreground"
                  )}>
                    {getFileIcon()}
                  </div>
                </div>
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <p className="font-semibold text-foreground">{selectedFile.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready to import
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports Excel (.xlsx, .xls), CSV, and XML
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress State */}
          {(status === "uploading" || status === "processing") && (
            <div className="py-10 space-y-5">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">
                    {status === "uploading" ? "Uploading file..." : "Processing data..."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait while we process your file
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2 rounded-full" />
                <p className="text-sm text-center text-muted-foreground font-medium">
                  {progress}% complete
                </p>
              </div>
            </div>
          )}

          {/* Complete/Error State */}
          {(status === "complete" || status === "error") && result && (
            <div className="space-y-5">
              {/* Summary */}
              <div className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border",
                result.success > 0 
                  ? "bg-success/5 border-success/20" 
                  : "bg-destructive/5 border-destructive/20"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  result.success > 0 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {result.success > 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {result.success > 0 
                      ? `Successfully imported ${result.success} records`
                      : "Import failed"
                    }
                  </p>
                  {result.failed > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {result.failed} records failed validation
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {result.total > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.total}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Total Rows</p>
                  </div>
                  <div className="p-4 bg-success/10 rounded-2xl border border-success/20 text-center">
                    <p className="text-2xl font-bold text-success">{result.success}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Imported</p>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 text-center">
                    <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Failed</p>
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-4 space-y-3 max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Validation Errors
                  </p>
                  <div className="space-y-2">
                    {result.errors.map((error, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {error.row > 0 && <span className="font-medium text-foreground">Row {error.row}:</span>} {error.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            {status === "idle" && (
              <>
                <Button variant="outline" onClick={handleClose} className="rounded-xl">
                  Cancel
                </Button>
                <Button 
                  onClick={processFile} 
                  disabled={!selectedFile}
                  className="gap-2 rounded-xl"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
              </>
            )}
            
            {(status === "complete" || status === "error") && (
              <>
                <Button variant="outline" onClick={resetState} className="rounded-xl">
                  Import Another
                </Button>
                <Button onClick={handleClose} className="rounded-xl">
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}