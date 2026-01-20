import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PageAccessEntry = {
  page: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
};

export type UserPermissions = {
  canExportData: boolean;
  canImportData: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canApproveRequests: boolean;
  canBulkOperations: boolean;
};

export type UserProfile = {
  authUserId: string;
  name: string;
  email: string | null;
  role: Database["public"]["Enums"]["user_role"];
  avatar: string | null;
};

type UserAccessContextValue = {
  profile: UserProfile | null;
  pageAccess: Record<string, PageAccessEntry>;
  permissions: UserPermissions | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  canViewPage: (pageId: string) => boolean;
};

const UserAccessContext = createContext<UserAccessContextValue | undefined>(undefined);

const emptyPermissions: UserPermissions = {
  canExportData: false,
  canImportData: false,
  canManageUsers: false,
  canViewReports: false,
  canManageSettings: false,
  canApproveRequests: false,
  canBulkOperations: false,
};

const pageIds = ["dashboard", "tracker", "tickets", "reports", "users", "settings", "system-status"];

const buildDefaults = (role: Database["public"]["Enums"]["user_role"]) => {
  const baseAccess = pageIds.map((page) => ({
    page,
    canView: false,
    canEdit: false,
    canDelete: false,
    canCreate: false,
  }));

  const basePermissions = { ...emptyPermissions };

  switch (role) {
    case "admin":
      return {
        pageAccess: baseAccess.map((row) => ({
          ...row,
          canView: true,
          canEdit: true,
          canDelete: true,
          canCreate: true,
        })),
        permissions: {
          canExportData: true,
          canImportData: true,
          canManageUsers: true,
          canViewReports: true,
          canManageSettings: true,
          canApproveRequests: true,
          canBulkOperations: true,
        },
      };
    case "manager":
      return {
        pageAccess: baseAccess.map((row) => ({
          ...row,
          canView: row.page !== "system-status",
          canEdit: row.page !== "settings" && row.page !== "users" && row.page !== "system-status",
          canCreate: row.page !== "settings" && row.page !== "users" && row.page !== "system-status",
        })),
        permissions: {
          ...basePermissions,
          canExportData: true,
          canViewReports: true,
          canApproveRequests: true,
        },
      };
    case "staff":
      return {
        pageAccess: baseAccess.map((row) => ({
          ...row,
          canView: ["dashboard", "tracker", "tickets", "reports"].includes(row.page),
          canEdit: ["tracker", "tickets"].includes(row.page),
          canCreate: ["tracker", "tickets"].includes(row.page),
        })),
        permissions: {
          ...basePermissions,
        },
      };
    case "viewer":
      return {
        pageAccess: baseAccess.map((row) => ({
          ...row,
          canView: ["dashboard", "tracker", "tickets", "reports"].includes(row.page),
        })),
        permissions: {
          ...basePermissions,
          canViewReports: true,
        },
      };
    case "analyst":
      return {
        pageAccess: baseAccess.map((row) => ({
          ...row,
          canView: ["dashboard", "tracker", "tickets", "reports"].includes(row.page),
        })),
        permissions: {
          ...basePermissions,
          canExportData: true,
          canViewReports: true,
        },
      };
    case "user":
    default:
      return {
        pageAccess: baseAccess.map((row) => ({
          ...row,
          canView: ["dashboard", "tracker", "tickets"].includes(row.page),
          canEdit: row.page === "tickets",
          canCreate: row.page === "tickets",
        })),
        permissions: {
          ...basePermissions,
        },
      };
  }
};

export function UserAccessProvider({ children }: { children: ReactNode }) {
  const sb = supabase as SupabaseClient<Database, "public">;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pageAccess, setPageAccess] = useState<Record<string, PageAccessEntry>>({});
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUserId = authData.user?.id ?? null;

      if (!authUserId) {
        setProfile(null);
        setPageAccess({});
        setPermissions(null);
        return;
      }

      const authName =
        (authData.user?.user_metadata?.full_name as string | undefined) ??
        authData.user?.email?.split("@")[0] ??
        "User";

      const usersTable = sb.from("users");
      const userResp = (await (usersTable
        .select("name, role, avatar, email")
        .eq("auth_user_id", authUserId)
        .maybeSingle() as unknown as Promise<{
        data: { name: string; role: Database["public"]["Enums"]["user_role"]; avatar: string | null; email: string | null } | null;
        error: PostgrestError | null;
      }>));

      const userRow = userResp.data;
      const name = userRow?.name ?? authName;
      const role = userRow?.role ?? "user";
      const avatar = userRow?.avatar ?? null;
      const email = userRow?.email ?? authData.user?.email ?? null;

      setProfile({ authUserId, name, role, avatar, email });

      // Ensure avatar and last_login_at are updated for visibility in users table
      const usersUpdateTable = sb.from("users");
      const updateUsers = usersUpdateTable.update as unknown as ((
        values: TablesUpdate<"users">
      ) => {
        eq: (column: string, value: string) => Promise<{ error: PostgrestError | null }>;
      });

      if (!avatar) {
        const initials = name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase();
        await updateUsers({ avatar: initials, last_login_at: new Date().toISOString() }).eq("auth_user_id", authUserId);
      } else {
        await updateUsers({ last_login_at: new Date().toISOString() }).eq("auth_user_id", authUserId);
      }

      const accessTable = sb.from("user_page_access");
      const permissionsTable = sb.from("user_permissions");
      const settingsTable = sb.from("user_settings");

      const upsertAccess = accessTable.upsert as unknown as ((
        values: TablesInsert<"user_page_access">[],
        options: { onConflict: string }
      ) => Promise<{ error: PostgrestError | null }>);

      const upsertPermissions = permissionsTable.upsert as unknown as ((
        values: TablesInsert<"user_permissions">,
        options: { onConflict: string }
      ) => Promise<{ error: PostgrestError | null }>);

      const upsertSettings = settingsTable.upsert as unknown as ((
        values: TablesInsert<"user_settings">,
        options: { onConflict: string }
      ) => Promise<{ error: PostgrestError | null }>);

      const [accessResp, permsResp] = await Promise.all([
        (accessTable
          .select("page, can_view, can_edit, can_delete, can_create")
          .eq("user_id", authUserId) as unknown as Promise<{
          data: Array<{
            page: string;
            can_view: boolean | null;
            can_edit: boolean | null;
            can_delete: boolean | null;
            can_create: boolean | null;
          }> | null;
          error: PostgrestError | null;
        }>),
        (permissionsTable
          .select(
            "can_export_data, can_import_data, can_manage_users, can_view_reports, can_manage_settings, can_approve_requests, can_bulk_operations"
          )
          .eq("user_id", authUserId)
          .maybeSingle() as unknown as Promise<{
          data: {
            can_export_data: boolean | null;
            can_import_data: boolean | null;
            can_manage_users: boolean | null;
            can_view_reports: boolean | null;
            can_manage_settings: boolean | null;
            can_approve_requests: boolean | null;
            can_bulk_operations: boolean | null;
          } | null;
          error: PostgrestError | null;
        }>),
      ]);

      const defaults = buildDefaults(role);

      if (accessResp.error || !accessResp.data || accessResp.data.length === 0) {
        await upsertAccess(
          defaults.pageAccess.map((row) => ({
            user_id: authUserId,
            user_name: name,
            user_email: email,
            page: row.page,
            can_view: row.canView,
            can_edit: row.canEdit,
            can_delete: row.canDelete,
            can_create: row.canCreate,
          })),
          { onConflict: "user_id,page" }
        );
        setPageAccess(
          defaults.pageAccess.reduce<Record<string, PageAccessEntry>>((acc, row) => {
            acc[row.page] = row;
            return acc;
          }, {})
        );
      } else {
        const accessMap: Record<string, PageAccessEntry> = {};
        accessResp.data.forEach((row) => {
          accessMap[row.page] = {
            page: row.page,
            canView: Boolean(row.can_view),
            canEdit: Boolean(row.can_edit),
            canDelete: Boolean(row.can_delete),
            canCreate: Boolean(row.can_create),
          };
        });
        setPageAccess(accessMap);
      }

      if (permsResp.error || !permsResp.data) {
        await upsertPermissions(
          {
            user_id: authUserId,
            user_name: name,
            user_email: email,
            can_export_data: defaults.permissions.canExportData,
            can_import_data: defaults.permissions.canImportData,
            can_manage_users: defaults.permissions.canManageUsers,
            can_view_reports: defaults.permissions.canViewReports,
            can_manage_settings: defaults.permissions.canManageSettings,
            can_approve_requests: defaults.permissions.canApproveRequests,
            can_bulk_operations: defaults.permissions.canBulkOperations,
          },
          { onConflict: "user_id" }
        );
        setPermissions(defaults.permissions);
      } else {
        setPermissions({
          canExportData: Boolean(permsResp.data.can_export_data),
          canImportData: Boolean(permsResp.data.can_import_data),
          canManageUsers: Boolean(permsResp.data.can_manage_users),
          canViewReports: Boolean(permsResp.data.can_view_reports),
          canManageSettings: Boolean(permsResp.data.can_manage_settings),
          canApproveRequests: Boolean(permsResp.data.can_approve_requests),
          canBulkOperations: Boolean(permsResp.data.can_bulk_operations),
        });
      }

      await upsertSettings({ user_id: authUserId, user_name: name, user_email: email }, { onConflict: "user_id" });

      const loginTable = sb.from("user_login");
      const activityTable = sb.from("user_activity");
      const insertLogin = loginTable.insert as unknown as ((
        values: TablesInsert<"user_login">
      ) => Promise<{ error: PostgrestError | null }>);
      const insertActivity = activityTable.insert as unknown as ((
        values: TablesInsert<"user_activity">
      ) => Promise<{ error: PostgrestError | null }>);

      await insertLogin({ user_id: authUserId, user_name: name, user_email: email, success: true });
      await insertActivity({
        user_id: authUserId,
        user_name: name,
        user_email: email,
        action: "login",
        entity_type: "auth",
        entity_id: authUserId,
        metadata: {},
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, []);

  const isAdmin = profile?.role === "admin";

  const canViewPage = useMemo(() => {
    return (pageId: string) => {
      if (isAdmin) return true;
      const explicit = pageAccess[pageId];
      if (explicit) return Boolean(explicit.canView);
      const role = profile?.role ?? "user";
      const fallback = buildDefaults(role).pageAccess.find((row) => row.page === pageId);
      return Boolean(fallback?.canView);
    };
  }, [isAdmin, pageAccess, profile?.role]);

  return (
    <UserAccessContext.Provider
      value={{
        profile,
        pageAccess,
        permissions,
        isAdmin,
        loading,
        refresh: hydrate,
        canViewPage,
      }}
    >
      {children}
    </UserAccessContext.Provider>
  );
}

export function useUserAccess() {
  const ctx = useContext(UserAccessContext);
  if (!ctx) {
    throw new Error("useUserAccess must be used within UserAccessProvider");
  }
  return ctx;
}
