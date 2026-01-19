import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  Building2,
  Shield,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  Edit,
  Trash2,
  Plus,
  LayoutDashboard,
  Users,
  Ticket,
  FileBarChart,
  Settings,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded?: (user: UserFormData) => void;
}

interface UserFormData {
  name: string;
  email: string;
  department: string;
  role: string;
  pageAccess: PageAccess[];
  permissions: Permissions;
}

interface PageAccess {
  page: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

interface Permissions {
  canExportData: boolean;
  canImportData: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canApproveRequests: boolean;
  canBulkOperations: boolean;
}

const pages = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "tracker", name: "Tracker", icon: MapPin },
  { id: "tickets", name: "Tickets", icon: Ticket },
  { id: "users", name: "Users", icon: Users },
  { id: "reports", name: "Reports", icon: FileBarChart },
  { id: "settings", name: "Settings", icon: Settings },
];

const roles = [
  { value: "admin", label: "Administrator", description: "Full system access" },
  { value: "manager", label: "Manager", description: "Team management access" },
  { value: "analyst", label: "Analyst", description: "View and report access" },
  { value: "user", label: "Standard User", description: "Basic access only" },
];

const departments = [
  "Engineering",
  "Operations",
  "Finance",
  "Human Resources",
  "Marketing",
  "Sales",
  "Legal",
  "IT Support",
];

const defaultPageAccess: PageAccess[] = pages.map((page) => ({
  page: page.id,
  canView: false,
  canEdit: false,
  canDelete: false,
  canCreate: false,
}));

const defaultPermissions: Permissions = {
  canExportData: false,
  canImportData: false,
  canManageUsers: false,
  canViewReports: false,
  canManageSettings: false,
  canApproveRequests: false,
  canBulkOperations: false,
};

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    department: "",
    role: "",
    pageAccess: defaultPageAccess,
    permissions: defaultPermissions,
  });

  const totalSteps = 4;

  const updateFormData = (field: keyof UserFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePageAccess = (pageId: string, field: keyof Omit<PageAccess, "page">, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      pageAccess: prev.pageAccess.map((p) =>
        p.page === pageId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const updatePermission = (field: keyof Permissions, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [field]: value },
    }));
  };

  const applyRolePresets = (role: string) => {
    let pageAccess = [...defaultPageAccess];
    let permissions = { ...defaultPermissions };

    switch (role) {
      case "admin":
        pageAccess = pages.map((page) => ({
          page: page.id,
          canView: true,
          canEdit: true,
          canDelete: true,
          canCreate: true,
        }));
        permissions = {
          canExportData: true,
          canImportData: true,
          canManageUsers: true,
          canViewReports: true,
          canManageSettings: true,
          canApproveRequests: true,
          canBulkOperations: true,
        };
        break;
      case "manager":
        pageAccess = pages.map((page) => ({
          page: page.id,
          canView: true,
          canEdit: page.id !== "settings",
          canDelete: false,
          canCreate: page.id !== "settings" && page.id !== "users",
        }));
        permissions = {
          ...defaultPermissions,
          canExportData: true,
          canViewReports: true,
          canApproveRequests: true,
        };
        break;
      case "analyst":
        pageAccess = pages.map((page) => ({
          page: page.id,
          canView: page.id !== "settings" && page.id !== "users",
          canEdit: false,
          canDelete: false,
          canCreate: false,
        }));
        permissions = {
          ...defaultPermissions,
          canExportData: true,
          canViewReports: true,
        };
        break;
      case "user":
        pageAccess = pages.map((page) => ({
          page: page.id,
          canView: page.id === "dashboard" || page.id === "tracker" || page.id === "tickets",
          canEdit: page.id === "tickets",
          canDelete: false,
          canCreate: page.id === "tickets",
        }));
        break;
    }

    setFormData((prev) => ({ ...prev, role, pageAccess, permissions }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.department) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
    }
    if (step === 2 && !formData.role) {
      toast({
        title: "Role Required",
        description: "Please select a role for the user.",
        variant: "destructive",
      });
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    onUserAdded?.(formData);
    toast({
      title: "User Created",
      description: `${formData.name} has been added successfully.`,
    });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      email: "",
      department: "",
      role: "",
      pageAccess: defaultPageAccess,
      permissions: defaultPermissions,
    });
    onOpenChange(false);
  };

  const getActivePermissionsCount = () => {
    const pagePermissions = formData.pageAccess.reduce(
      (acc, p) => acc + (p.canView ? 1 : 0) + (p.canEdit ? 1 : 0) + (p.canDelete ? 1 : 0) + (p.canCreate ? 1 : 0),
      0
    );
    const otherPermissions = Object.values(formData.permissions).filter(Boolean).length;
    return pagePermissions + otherPermissions;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            Add New User
          </DialogTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-4">
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Role" },
              { num: 3, label: "Pages" },
              { num: 4, label: "Review" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step > s.num
                        ? "bg-primary text-primary-foreground"
                        : step === s.num
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground">{s.label}</span>
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 sm:w-16 h-0.5 mx-2 transition-colors ${
                      step > s.num ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => updateFormData("department", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Role Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Select Role</span>
                  </div>
                  <div className="grid gap-3">
                    {roles.map((role) => (
                      <div
                        key={role.value}
                        onClick={() => applyRolePresets(role.value)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.role === role.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{role.label}</p>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.role === role.value
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {formData.role === role.value && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Selecting a role will preset page access and permissions. You can customize them in the next step.
                  </p>
                </motion.div>
              )}

              {/* Step 3: Page Access & Permissions */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Page Access</span>
                  </div>

                  {/* Page Access Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-xs font-medium">
                      <div>Page</div>
                      <div className="text-center flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </div>
                      <div className="text-center flex items-center justify-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </div>
                      <div className="text-center flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </div>
                      <div className="text-center flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Create
                      </div>
                    </div>
                    {pages.map((page) => {
                      const access = formData.pageAccess.find((p) => p.page === page.id)!;
                      const Icon = page.icon;
                      return (
                        <div
                          key={page.id}
                          className="grid grid-cols-5 gap-2 p-3 border-t items-center"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {page.name}
                          </div>
                          <div className="flex justify-center">
                            <Checkbox
                              checked={access.canView}
                              onCheckedChange={(checked) =>
                                updatePageAccess(page.id, "canView", !!checked)
                              }
                            />
                          </div>
                          <div className="flex justify-center">
                            <Checkbox
                              checked={access.canEdit}
                              onCheckedChange={(checked) =>
                                updatePageAccess(page.id, "canEdit", !!checked)
                              }
                            />
                          </div>
                          <div className="flex justify-center">
                            <Checkbox
                              checked={access.canDelete}
                              onCheckedChange={(checked) =>
                                updatePageAccess(page.id, "canDelete", !!checked)
                              }
                            />
                          </div>
                          <div className="flex justify-center">
                            <Checkbox
                              checked={access.canCreate}
                              onCheckedChange={(checked) =>
                                updatePageAccess(page.id, "canCreate", !!checked)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="my-4" />

                  {/* Other Permissions */}
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Additional Permissions</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "canExportData", label: "Export Data" },
                      { key: "canImportData", label: "Import Data" },
                      { key: "canManageUsers", label: "Manage Users" },
                      { key: "canViewReports", label: "View Reports" },
                      { key: "canManageSettings", label: "Manage Settings" },
                      { key: "canApproveRequests", label: "Approve Requests" },
                      { key: "canBulkOperations", label: "Bulk Operations" },
                    ].map((perm) => (
                      <div
                        key={perm.key}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50"
                      >
                        <Checkbox
                          id={perm.key}
                          checked={formData.permissions[perm.key as keyof Permissions]}
                          onCheckedChange={(checked) =>
                            updatePermission(perm.key as keyof Permissions, !!checked)
                          }
                        />
                        <Label htmlFor={perm.key} className="text-sm cursor-pointer">
                          {perm.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      User Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <p className="font-medium">{formData.department}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Role:</span>
                        <Badge variant="secondary" className="mt-1">
                          {roles.find((r) => r.value === formData.role)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Page Access Summary
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.pageAccess
                        .filter((p) => p.canView || p.canEdit || p.canDelete || p.canCreate)
                        .map((p) => {
                          const page = pages.find((pg) => pg.id === p.page)!;
                          return (
                            <Badge key={p.page} variant="outline" className="gap-1">
                              {page.name}
                              <span className="text-xs text-muted-foreground">
                                ({[p.canView && "V", p.canEdit && "E", p.canDelete && "D", p.canCreate && "C"]
                                  .filter(Boolean)
                                  .join("")})
                              </span>
                            </Badge>
                          );
                        })}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Permissions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(formData.permissions)
                        .filter(([, value]) => value)
                        .map(([key]) => (
                          <Badge key={key} variant="secondary">
                            {key.replace("can", "").replace(/([A-Z])/g, " $1").trim()}
                          </Badge>
                        ))}
                      {Object.values(formData.permissions).every((v) => !v) && (
                        <span className="text-sm text-muted-foreground">No additional permissions</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      Total active permissions: <strong>{getActivePermissionsCount()}</strong>
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={step === 1 ? handleClose : handleBack}
            className="gap-2"
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Back
              </>
            )}
          </Button>
          <Button onClick={step === totalSteps ? handleSubmit : handleNext} className="gap-2">
            {step === totalSteps ? (
              <>
                <Check className="w-4 h-4" />
                Create User
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
