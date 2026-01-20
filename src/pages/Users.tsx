import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  Mail,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AddUserDialog } from "@/components/users/AddUserDialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { adminResetUserPassword, isAdmin as rpcIsAdmin, setMyPassword } from "@/integrations/supabase/rpc";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

interface UserData {
  id: string;
  dbId?: string;
  authUserId?: string | null;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff" | "viewer" | "analyst" | "user";
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
  avatar: string;
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
  { id: "dashboard", name: "Dashboard" },
  { id: "tracker", name: "Tracker" },
  { id: "tickets", name: "Tickets" },
  { id: "users", name: "Users" },
  { id: "reports", name: "Reports" },
  { id: "settings", name: "Settings" },
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

const getInitials = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const roleConfig = {
  admin: { label: "Admin", icon: ShieldCheck, className: "bg-danger/10 text-danger" },
  manager: { label: "Manager", icon: Shield, className: "bg-primary/10 text-primary" },
  analyst: { label: "Analyst", icon: Eye, className: "bg-warning/10 text-warning" },
  user: { label: "User", icon: Eye, className: "bg-muted text-muted-foreground" },
};

const defaultRoleConfig = { label: "User", icon: Eye, className: "bg-muted text-muted-foreground" };

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

const Users = () => {
  const sb = supabase as SupabaseClient<Database, "public">;
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<"view" | "edit">("view");
  const [activeUser, setActiveUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    role: "user" as UserData["role"],
    department: "",
    status: "active" as UserData["status"],
  });
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [pageAccess, setPageAccess] = useState<PageAccess[]>(defaultPageAccess);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  
  useDocumentTitle("Users");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const usersTable = sb.from("users");
    const { data, error } = await usersTable
      .select("id, auth_user_id, user_code, name, email, role, department, status, last_login_at, avatar, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load users", error);
      setIsLoading(false);
      return;
    }

    const mappedUsers: UserData[] = ((data ?? []) as Tables<"users">[]).map((user) => ({
      id: user.user_code ?? user.id,
      dbId: user.id,
      authUserId: user.auth_user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department ?? "",
      status: user.status,
      lastLogin: user.last_login_at ?? "",
      avatar: user.avatar ?? getInitials(user.name),
    }));

    setUsers(mappedUsers);
    setIsLoading(false);
  }, [sb]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let isMounted = true;
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setCurrentAuthUserId(data.user?.id ?? null);

      const { data: adminData, error: adminError } = await rpcIsAdmin();
      if (!isMounted) return;
      if (!adminError) setIsAdmin(Boolean(adminData));
    };
    loadCurrentUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserAdded = () => {
    fetchUsers();
  };

  const openUserDialog = (user: UserData, mode: "view" | "edit") => {
    const normalizedRole = (user.role === "staff" || user.role === "viewer") ? "user" : user.role;
    setActiveUser(user);
    setUserDialogMode(mode);
    setEditForm({
      role: normalizedRole,
      department: user.department,
      status: user.status,
    });
    setPageAccess(defaultPageAccess);
    setPermissions(defaultPermissions);
    setIsUserDialogOpen(true);

    if (mode === "edit" && isAdmin && user.authUserId) {
      // Load permissions/page access for the target user
      (async () => {
        const userId = user.authUserId;
        const permsTable = sb.from("user_permissions");
        const accessTable = sb.from("user_page_access");

        type PermissionsSelectRow = {
          can_export_data: boolean | null;
          can_import_data: boolean | null;
          can_manage_users: boolean | null;
          can_view_reports: boolean | null;
          can_manage_settings: boolean | null;
          can_approve_requests: boolean | null;
          can_bulk_operations: boolean | null;
        };

        type PageAccessSelectRow = {
          page: string;
          can_view: boolean | null;
          can_edit: boolean | null;
          can_delete: boolean | null;
          can_create: boolean | null;
        };

        const [permsResp, accessResp] = await Promise.all([
          permsTable
            .select(
              "can_export_data, can_import_data, can_manage_users, can_view_reports, can_manage_settings, can_approve_requests, can_bulk_operations"
            )
            .eq("user_id", userId)
            .maybeSingle() as unknown as Promise<{
            data: PermissionsSelectRow | null;
            error: PostgrestError | null;
          }>,
          accessTable
            .select("page, can_view, can_edit, can_delete, can_create")
            .eq("user_id", userId) as unknown as Promise<{
            data: PageAccessSelectRow[] | null;
            error: PostgrestError | null;
          }>,
        ]);

        const permsRow = permsResp.data;
        const accessRows = accessResp.data;

        if (permsRow) {
          setPermissions({
            canExportData: Boolean(permsRow.can_export_data),
            canImportData: Boolean(permsRow.can_import_data),
            canManageUsers: Boolean(permsRow.can_manage_users),
            canViewReports: Boolean(permsRow.can_view_reports),
            canManageSettings: Boolean(permsRow.can_manage_settings),
            canApproveRequests: Boolean(permsRow.can_approve_requests),
            canBulkOperations: Boolean(permsRow.can_bulk_operations),
          });
        }

        if (Array.isArray(accessRows) && accessRows.length > 0) {
          setPageAccess(
            defaultPageAccess.map((p) => {
              const row = accessRows.find((r) => r.page === p.page);
              return row
                ? {
                    page: p.page,
                    canView: Boolean(row.can_view),
                    canEdit: Boolean(row.can_edit),
                    canDelete: Boolean(row.can_delete),
                    canCreate: Boolean(row.can_create),
                  }
                : p;
            })
          );
        }
      })();
    }
  };

  const openDeleteDialog = (user: UserData) => {
    setActiveUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openResetPassword = (user: UserData) => {
    setActiveUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setIsResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!activeUser) return;
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!currentAuthUserId) {
      toast.error("Not authenticated.");
      return;
    }

    const targetAuthUserId = activeUser.authUserId;
    if (!targetAuthUserId) {
      toast.error("This user is missing an auth_user_id.");
      return;
    }

    const isSelf = currentAuthUserId === targetAuthUserId;

    if (isSelf) {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) {
        toast.error("Failed to update Auth password", { description: authError.message });
        return;
      }

      const { error: dbError } = await setMyPassword(newPassword);
      if (dbError) {
        toast.error("Failed to update database password hash", { description: dbError.message });
        return;
      }

      toast.success("Password updated");
      setIsResetDialogOpen(false);
      return;
    }

    if (!isAdmin) {
      toast.error("Admin access required to reset another user's password.");
      return;
    }

    const { error: resetError } = await adminResetUserPassword(targetAuthUserId, newPassword);

    if (resetError) {
      toast.error("Failed to reset password", { description: resetError.message });
      return;
    }

    toast.success("Password reset (database hash updated)");
    setIsResetDialogOpen(false);
  };

  const handleSaveUser = async () => {
    if (!activeUser) return;

    if (userDialogMode === "edit" && isAdmin && activeUser.authUserId) {
      setIsSavingPermissions(true);
    }

    const usersTable = sb.from("users");
    const targetColumn = activeUser.dbId ? "id" : "user_code";
    const targetValue = activeUser.dbId ?? activeUser.id;
    const updateUser = usersTable.update as unknown as ((
      values: TablesUpdate<"users">
    ) => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: PostgrestError | null }>;
    });

    const { error } = await updateUser({
      role: editForm.role,
      department: editForm.department,
      status: editForm.status,
    }).eq(targetColumn, targetValue);

    if (error) {
      toast.error("Failed to update user", { description: error.message });
      setIsSavingPermissions(false);
      return;
    }

    // Admin-only: also persist permissions + page access edits
    if (userDialogMode === "edit" && isAdmin && activeUser.authUserId) {
      const userId = activeUser.authUserId;
      const permsTable = sb.from("user_permissions");
      const accessTable = sb.from("user_page_access");

      const upsertPermissions = permsTable.upsert as unknown as ((
        values: TablesInsert<"user_permissions">,
        options: { onConflict: string }
      ) => Promise<{ error: PostgrestError | null }>);

      const { error: permsError } = await upsertPermissions(
        {
          user_id: userId,
          can_export_data: permissions.canExportData,
          can_import_data: permissions.canImportData,
          can_manage_users: permissions.canManageUsers,
          can_view_reports: permissions.canViewReports,
          can_manage_settings: permissions.canManageSettings,
          can_approve_requests: permissions.canApproveRequests,
          can_bulk_operations: permissions.canBulkOperations,
        },
        { onConflict: "user_id" }
      );

      if (permsError) {
        toast.error("Failed to update permissions", { description: permsError.message });
        setIsSavingPermissions(false);
        return;
      }

      const rows = pageAccess.map((a) => ({
        user_id: userId,
        page: a.page,
        can_view: a.canView,
        can_edit: a.canEdit,
        can_delete: a.canDelete,
        can_create: a.canCreate,
      }));

      const upsertPageAccess = accessTable.upsert as unknown as ((
        values: TablesInsert<"user_page_access">[],
        options: { onConflict: string }
      ) => Promise<{ error: PostgrestError | null }>);

      const { error: accessError } = await upsertPageAccess(rows, { onConflict: "user_id,page" });
      if (accessError) {
        toast.error("Failed to update page access", { description: accessError.message });
        setIsSavingPermissions(false);
        return;
      }
    }

    toast.success("User updated");
    setIsSavingPermissions(false);
    setIsUserDialogOpen(false);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!activeUser?.authUserId) {
      toast.error("Cannot delete: missing auth_user_id.");
      return;
    }
    if (!isAdmin) {
      toast.error("Admin access required.");
      return;
    }

    const userId = activeUser.authUserId;
    const accessTable = sb.from("user_page_access");
    const permsTable = sb.from("user_permissions");
    const settingsTable = sb.from("user_settings");
    const usersTable = sb.from("users");

    const { error: accessError } = (await (accessTable.delete().eq("user_id", userId) as unknown as Promise<{
      error: PostgrestError | null;
    }>));
    if (accessError) {
      toast.error("Failed to delete page access", { description: accessError.message });
      return;
    }

    const { error: permsError } = (await (permsTable.delete().eq("user_id", userId) as unknown as Promise<{
      error: PostgrestError | null;
    }>));
    if (permsError) {
      toast.error("Failed to delete permissions", { description: permsError.message });
      return;
    }

    const { error: settingsError } = (await (settingsTable.delete().eq("user_id", userId) as unknown as Promise<{
      error: PostgrestError | null;
    }>));
    if (settingsError) {
      toast.error("Failed to delete settings", { description: settingsError.message });
      return;
    }

    const { error: profileError } = (await (usersTable.delete().eq("auth_user_id", userId) as unknown as Promise<{
      error: PostgrestError | null;
    }>));
    if (profileError) {
      toast.error("Failed to delete user profile", { description: profileError.message });
      return;
    }

    toast.success("User deleted (profile + access removed)");
    setIsDeleteDialogOpen(false);
    setActiveUser(null);
    fetchUsers();
  };

  if (isLoading) return <UsersSkeleton />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <Breadcrumbs />
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground mt-1">Manage users and their permissions</p>
        </div>
        <Button className="gap-2" onClick={() => setIsAddUserOpen(true)}>
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </motion.div>

      {/* Add User Dialog */}
      <AddUserDialog 
        open={isAddUserOpen} 
        onOpenChange={setIsAddUserOpen}
        onUserAdded={handleUserAdded}
      />

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {userDialogMode === "view" ? "User Profile" : "Edit User"}
            </DialogTitle>
          </DialogHeader>
          {activeUser && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={activeUser.name} readOnly />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={activeUser.email} readOnly />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Role</Label>
                  {userDialogMode === "edit" ? (
                    <Select
                      value={editForm.role}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, role: value as UserData["role"] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={activeUser.role} readOnly />
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Department</Label>
                  {userDialogMode === "edit" ? (
                    <Input
                      value={editForm.department}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, department: e.target.value }))
                      }
                    />
                  ) : (
                    <Input value={activeUser.department} readOnly />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Status</Label>
                <Switch
                  checked={editForm.status === "active"}
                  onCheckedChange={(checked) =>
                    userDialogMode === "edit" &&
                    setEditForm((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
                  }
                />
              </div>
              {userDialogMode === "edit" && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser} disabled={isSavingPermissions}>
                    {isSavingPermissions ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}

              {userDialogMode === "edit" && isAdmin && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Permissions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(permissions).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 rounded-lg border p-3">
                          <Checkbox
                            checked={value}
                            onCheckedChange={(checked) =>
                              setPermissions((prev) => ({ ...prev, [key]: Boolean(checked) }))
                            }
                          />
                          <span className="text-sm">
                            {key.replace("can", "").replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Page Access</p>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <div className="min-w-[520px]">
                          <div className="grid grid-cols-5 gap-2 p-3 bg-muted/50 text-xs font-medium">
                            <div>Page</div>
                            <div className="text-center">View</div>
                            <div className="text-center">Edit</div>
                            <div className="text-center">Delete</div>
                            <div className="text-center">Create</div>
                          </div>
                          {pages.map((page) => {
                            const access = pageAccess.find((p) => p.page === page.id) ?? {
                              page: page.id,
                              canView: false,
                              canEdit: false,
                              canDelete: false,
                              canCreate: false,
                            };

                            const updateAccess = (
                              pageId: string,
                              field: keyof Omit<PageAccess, "page">,
                              next: boolean
                            ) => {
                              setPageAccess((prev) =>
                                prev.map((p) => (p.page === pageId ? { ...p, [field]: next } : p))
                              );
                            };

                            return (
                              <div key={page.id} className="grid grid-cols-5 gap-2 p-3 border-t items-center">
                                <div className="text-sm">{page.name}</div>
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={access.canView}
                                    onCheckedChange={(checked) => updateAccess(page.id, "canView", Boolean(checked))}
                                  />
                                </div>
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={access.canEdit}
                                    onCheckedChange={(checked) => updateAccess(page.id, "canEdit", Boolean(checked))}
                                  />
                                </div>
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={access.canDelete}
                                    onCheckedChange={(checked) => updateAccess(page.id, "canDelete", Boolean(checked))}
                                  />
                                </div>
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={access.canCreate}
                                    onCheckedChange={(checked) => updateAccess(page.id, "canCreate", Boolean(checked))}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only admins can edit permissions and page access.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will delete the user's profile, settings, permissions and page access records.
              It will not delete the Auth user (requires server/service role).
            </p>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">{activeUser?.name}</p>
              <p className="text-xs text-muted-foreground">{activeUser?.email}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword">Confirm Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Passwords are stored as a one-way hash in the users table (and your own Auth password is updated when you change your password).
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword}>Update Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="bg-card rounded-xl border border-border p-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", config.className)}>
                <config.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium text-muted-foreground">{config.label}s</p>
            </div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Desktop Table */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const config = roleConfig[user.role] ?? defaultRoleConfig;
                const RoleIcon = config.icon;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs font-medium">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge className={cn("gap-1 text-xs", config.className)}>
                        <RoleIcon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground text-sm">{user.department}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Switch checked={user.status === "active"} />
                        <span className={cn(
                          "text-xs font-medium",
                          user.status === "active" ? "text-success" : "text-muted-foreground"
                        )}>
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs text-muted-foreground">{user.lastLogin}</td>
                    <td>
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openUserDialog(user, "view")} className="flex items-center gap-2 cursor-pointer">
                              <Eye className="w-4 h-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openUserDialog(user, "edit")} className="flex items-center gap-2 cursor-pointer">
                              <Edit className="w-4 h-4" /> Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openResetPassword(user)} className="flex items-center gap-2 cursor-pointer">
                              <Key className="w-4 h-4" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.info("Send email is not wired yet")} className="flex items-center gap-2 cursor-pointer">
                              <Mail className="w-4 h-4" /> Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-danger focus:text-danger focus:bg-danger/10 cursor-pointer"
                              onSelect={() => openDeleteDialog(user)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Users;
