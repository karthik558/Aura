import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Building2,
  Shield,
  FileText,
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
import { supabase } from "@/integrations/supabase/client";

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
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    department: "",
    role: "",
    pageAccess: defaultPageAccess,
    permissions: defaultPermissions,
  });

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

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.department || !formData.role) {
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

    const userCode = `USR-${Date.now()}`;
    const avatar = formData.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    const usersTable = supabase.from("users") as any;
    const { data: userRow, error: profileError } = await usersTable
      .upsert({
        name: formData.name,
        email: formData.email,
        role: formData.role || "user",
        department: formData.department,
        status: "active",
        user_code: userCode,
        avatar,
      })
      .select()
      .single();

    if (profileError || !userRow) {
      toast({
        title: "Profile update failed",
        description: profileError?.message ?? "Unable to create profile.",
        variant: "destructive",
      });
      return;
    }

    const targetUserId = userRow?.auth_user_id ?? userRow?.id;

    if (!targetUserId) {
      toast({
        title: "User record incomplete",
        description: "Missing user id for settings/permissions setup.",
        variant: "destructive",
      });
      return;
    }

    const userSettingsTable = supabase.from("user_settings") as any;
    const { error: settingsError } = await userSettingsTable
      .upsert({
        user_id: targetUserId,
      });

    if (settingsError) {
      toast({
        title: "Settings setup failed",
        description: settingsError.message,
        variant: "destructive",
      });
      return;
    }

    const userPermissionsTable = supabase.from("user_permissions") as any;
    const { error: permissionsError } = await userPermissionsTable
      .upsert({
        user_id: targetUserId,
        ...formData.permissions,
      });

    if (permissionsError) {
      toast({
        title: "Permissions setup failed",
        description: permissionsError.message,
        variant: "destructive",
      });
      return;
    }

    const pageAccessRows = formData.pageAccess.map((access) => ({
      user_id: targetUserId,
      page: access.page,
      can_view: access.canView,
      can_edit: access.canEdit,
      can_delete: access.canDelete,
      can_create: access.canCreate,
    }));

    const userPageAccessTable = supabase.from("user_page_access") as any;
    const { error: pageAccessError } = await userPageAccessTable
      .upsert(pageAccessRows, { onConflict: "user_id,page" });

    if (pageAccessError) {
      toast({
        title: "Page access setup failed",
        description: pageAccessError.message,
        variant: "destructive",
      });
      return;
    }

    onUserAdded?.(formData);
    toast({
      title: "User Created",
      description: `${formData.name} has been added successfully.`,
    });
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      department: "",
      role: "",
      pageAccess: defaultPageAccess,
      permissions: defaultPermissions,
    });
  };

  const getActivePermissionsCount = () => {
    const pagePermissions = formData.pageAccess.reduce(
      (acc, p) => acc + (p.canView ? 1 : 0) + (p.canEdit ? 1 : 0) + (p.canDelete ? 1 : 0) + (p.canCreate ? 1 : 0),
      0
    );
    const otherPermissions = Object.values(formData.permissions).filter(Boolean).length;
    return pagePermissions + otherPermissions;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            Add New User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-xs text-muted-foreground">
                Create the Auth user in Supabase Auth first. This form creates the profile and permissions.
              </p>
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Role</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => applyRolePresets(role.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
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
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Role presets automatically select the default page access and permissions.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Page Access</span>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
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
                      <div key={page.id} className="grid grid-cols-5 gap-2 p-3 border-t items-center">
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
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Additional Permissions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border p-3">
                  <Checkbox
                    checked={value}
                    onCheckedChange={(checked) => updatePermission(key as keyof Permissions, !!checked)}
                  />
                  <span className="text-sm">
                    {key.replace("can", "").replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Total active permissions: <strong>{getActivePermissionsCount()}</strong>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button className="gap-2 flex-1 sm:flex-none" onClick={handleSubmit}>
                <Check className="w-4 h-4" />
                Create User
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
