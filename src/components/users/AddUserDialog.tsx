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
import { setUserPassword } from "@/integrations/supabase/rpc";
import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

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
  { value: "staff", label: "Staff", description: "Operational access" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
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
  const sb = supabase as SupabaseClient<Database, "public">;
  const { toast } = useToast();
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    department: "",
    role: "",
    pageAccess: defaultPageAccess,
    permissions: defaultPermissions,
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
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
      case "staff":
        pageAccess = pages.map((page) => ({
          page: page.id,
          canView: page.id === "dashboard" || page.id === "tracker" || page.id === "tickets",
          canEdit: page.id === "tracker" || page.id === "tickets",
          canDelete: false,
          canCreate: page.id === "tracker" || page.id === "tickets",
        }));
        permissions = {
          ...defaultPermissions,
          canExportData: false,
          canViewReports: false,
        };
        break;
      case "viewer":
        pageAccess = pages.map((page) => ({
          page: page.id,
          canView: page.id === "dashboard" || page.id === "tracker" || page.id === "reports" || page.id === "tickets",
          canEdit: false,
          canDelete: false,
          canCreate: false,
        }));
        permissions = {
          ...defaultPermissions,
          canViewReports: true,
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
    if (isSubmitting) return;
    setIsSubmitting(true);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
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
      if (!password || !confirmPassword) {
        toast({
          title: "Password required",
          description: "Set a password so the hash is stored in the users table.",
          variant: "destructive",
        });
        return;
      }
      if (password.length < 8) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 8 characters.",
          variant: "destructive",
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return;
      }

    const { data: currentUserData } = await supabase.auth.getUser();
    if (!currentUserData.user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    const usersTable = sb.from("users");

    const upsertUsers = usersTable.upsert as unknown as ((
      values: TablesInsert<"users">,
      options?: { onConflict?: string }
    ) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: PostgrestError | null }>;
      };
    });

    const updateUsers = usersTable.update as unknown as ((values: TablesUpdate<"users">) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: PostgrestError | null }>;
        };
      };
    });
    let currentProfile = null as null | { id: string; role: string | null };
    const { data: currentProfileData, error: currentProfileError } = await usersTable
      .select("id, role") 
      .eq("auth_user_id", currentUserData.user.id)
      .maybeSingle();

    if (currentProfileError) {
      toast({
        title: "Profile lookup failed",
        description: currentProfileError.message,
        variant: "destructive",
      });
      return;
    }

    if (!currentProfileData) {
      const displayName =
        (currentUserData.user.user_metadata?.full_name as string | undefined) ??
        currentUserData.user.email?.split("@")[0] ??
        "Admin";

      const { data: createdProfileRaw, error: createProfileError } = await upsertUsers({
        auth_user_id: currentUserData.user.id,
        name: displayName,
        email: currentUserData.user.email ?? "",
        role: "admin",
        status: "active",
      }).select("id, role").single();

      const createdProfile = createdProfileRaw as unknown as { id: string; role: string | null } | null;

      if (createProfileError || !createdProfile) {
        toast({
          title: "Profile setup failed",
          description: createProfileError?.message ?? "Unable to create profile.",
          variant: "destructive",
        });
        return;
      }

      currentProfile = createdProfile;
    } else {
      currentProfile = currentProfileData;
    }

    if (currentProfile.role !== "admin") {
      const { data: promotedProfileRaw, error: promoteError } = await updateUsers({ role: "admin" })
        .eq("auth_user_id", currentUserData.user.id)
        .select("id, role")
        .single();

      const promotedProfile = promotedProfileRaw as unknown as { id: string; role: string | null } | null;

      if (promoteError || !promotedProfile) {
        toast({
          title: "Admin access required",
          description: "Unable to promote your account to admin. Update your role in the users table.",
          variant: "destructive",
        });
        return;
      }

      currentProfile = promotedProfile;
    }

    const userCode = `USR-${Date.now()}`;
    const avatar = formData.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    let targetAuthUserId: string | null = null;
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session ?? null;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password,
      options: {
        data: { full_name: formData.name },
      },
    });

    if (signUpError) {
      const message = signUpError.message ?? "";
      const isRateLimited = /only request this after/i.test(message);
      const isAlreadyRegistered = /already registered|already exists/i.test(message);

      if (!isAlreadyRegistered) {
        toast({
          title: "Auth user creation failed",
          description: isRateLimited
            ? `${message} (Supabase rate limit: wait, then try again.)`
            : message,
          variant: "destructive",
        });
        return;
      }
    }

    targetAuthUserId = signUpData.user?.id ?? null;

    if (!targetAuthUserId) {
      const { data: existingUser, error: existingError } = (await (usersTable
        .select("id, auth_user_id")
        .eq("email", formData.email)
        .maybeSingle() as unknown as Promise<{
        data: { id: string; auth_user_id: string | null } | null;
        error: PostgrestError | null;
      }>));

      if (existingError || !existingUser || !existingUser.auth_user_id) {
        toast({
          title: "Auth user lookup failed",
          description: "Create the Auth user in Supabase or retry with a different email.",
          variant: "destructive",
        });
        return;
      }

      targetAuthUserId = existingUser.auth_user_id;
    }

    if (currentSession?.access_token && currentSession?.refresh_token) {
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      });
    }

    if (!targetAuthUserId) {
      toast({
        title: "User creation incomplete",
        description: "Missing Auth user id.",
        variant: "destructive",
      });
      return;
    }

    const { data: userRowRaw, error: profileError } = await upsertUsers(
      {
        auth_user_id: targetAuthUserId,
        name: formData.name,
        email: formData.email,
        role: (formData.role || "user") as TablesInsert<"users">["role"],
        department: formData.department,
        status: "active",
        user_code: userCode,
        avatar,
      },
      { onConflict: "email" }
    )
      .select("id, auth_user_id, user_code, name, email, role, department, status, avatar, last_login_at, created_at, updated_at")
      .single();

    const userRow = userRowRaw as unknown as { auth_user_id: string | null } | null;

    if (profileError || !userRow) {
      toast({
        title: "Profile update failed",
        description: profileError?.message ?? "Unable to update profile.",
        variant: "destructive",
      });
      return;
    }

    // Store password hash in public.users (DB-only) AFTER the profile row exists.
    if (password) {
      let lastError: PostgrestError | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        const { error: setHashError } = await setUserPassword(targetAuthUserId, password);

        if (!setHashError) {
          lastError = null;
          break;
        }

        lastError = setHashError;
        await sleep(250 * (attempt + 1));
      }

      if (lastError) {
        toast({
          title: "Password setup failed",
          description: lastError.message,
          variant: "destructive",
        });
        return;
      }
    }

    const targetUserId = userRow?.auth_user_id ?? targetAuthUserId;

    if (!targetUserId) {
      toast({
        title: "User record incomplete",
        description: "Missing user id for settings/permissions setup.",
        variant: "destructive",
      });
      return;
    }

    const userSettingsTable = sb.from("user_settings");
    const upsertSettings = userSettingsTable.upsert as unknown as ((
      values: TablesInsert<"user_settings">,
      options: { onConflict: string }
    ) => Promise<{ error: PostgrestError | null }>);

    const { error: settingsError } = await upsertSettings(
      { user_id: targetUserId, user_name: formData.name, user_email: formData.email },
      { onConflict: "user_id" }
    );

    if (settingsError) {
      toast({
        title: "Settings setup failed",
        description: settingsError.message,
        variant: "destructive",
      });
      return;
    }

    const userPermissionsTable = sb.from("user_permissions");
    const upsertPermissions = userPermissionsTable.upsert as unknown as ((
      values: TablesInsert<"user_permissions">,
      options: { onConflict: string }
    ) => Promise<{ error: PostgrestError | null }>);

    const { error: permissionsError } = await upsertPermissions(
      {
        user_id: targetUserId,
        user_name: formData.name,
        user_email: formData.email,
        can_export_data: formData.permissions.canExportData,
        can_import_data: formData.permissions.canImportData,
        can_manage_users: formData.permissions.canManageUsers,
        can_view_reports: formData.permissions.canViewReports,
        can_manage_settings: formData.permissions.canManageSettings,
        can_approve_requests: formData.permissions.canApproveRequests,
        can_bulk_operations: formData.permissions.canBulkOperations,
      },
      { onConflict: "user_id" }
    );

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
      user_name: formData.name,
      user_email: formData.email,
      page: access.page,
      can_view: access.canView,
      can_edit: access.canEdit,
      can_delete: access.canDelete,
      can_create: access.canCreate,
    }));

    const userPageAccessTable = sb.from("user_page_access");
    const upsertPageAccess = userPageAccessTable.upsert as unknown as ((
      values: TablesInsert<"user_page_access">[],
      options: { onConflict: string }
    ) => Promise<{ error: PostgrestError | null }>);

    const { error: pageAccessError } = await upsertPageAccess(
      pageAccessRows as unknown as TablesInsert<"user_page_access">[],
      { onConflict: "user_id,page" }
    );

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
    handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
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
    setPassword("");
    setConfirmPassword("");
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
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Add New User</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Create a new user account with permissions</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Basic Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs font-medium text-muted-foreground">
                  Department <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => updateFormData("department", value)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
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
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-warning/10 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-warning" />
              </div>
              <span className="text-sm font-medium text-foreground">Password</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-info/10 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-info" />
              </div>
              <span className="text-sm font-medium text-foreground">Role</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => applyRolePresets(role.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.role === role.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{role.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        formData.role === role.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
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
              Role presets automatically configure default page access and permissions.
            </p>
          </div>

          {/* Page Access */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-success" />
              </div>
              <span className="text-sm font-medium text-foreground">Page Access</span>
            </div>
            <div className="border border-border rounded-2xl overflow-hidden">
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
                      <div key={page.id} className="grid grid-cols-5 gap-2 p-3 border-t border-border items-center">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
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

          {/* Additional Permissions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <span className="text-sm font-medium text-foreground">Additional Permissions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/30 transition-colors cursor-pointer">
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

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span>Total active permissions: <strong className="text-foreground">{getActivePermissionsCount()}</strong></span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 sm:flex-none rounded-xl">
                Cancel
              </Button>
              <Button className="gap-2 flex-1 sm:flex-none rounded-xl" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
