import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Bell, 
  Shield, 
  Save,
  User,
  Palette,
  Check,
  Layout,
  Type,
  Monitor,
  UserCog,
  PanelLeftClose,
  Pin,
  PanelTop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/ThemeProvider";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { setMyPassword } from "@/integrations/supabase/rpc";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useUserAccess } from "@/context/UserAccessContext";
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/integrations/supabase/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 }
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-6 w-24" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

const Settings = () => {
  const sb = supabase as SupabaseClient<Database, "public">;
  const navigate = useNavigate();
  const { loading: accessLoading, isAdmin: accessIsAdmin, canViewPage, profile } = useUserAccess();
  const [isLoading, setIsLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { 
    startCollapsed, 
    stickyHeader, 
    topNavMode, 
    setStartCollapsed, 
    setStickyHeader, 
    setTopNavMode 
  } = useLayoutSettings();
  const [userRole, setUserRole] = useState("user");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [sidebarStyle, setSidebarStyle] = useState("default");
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState({
    emailNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
  });
  const [pushNotifications, setPushNotifications] = useState({
    pendingReminders: true,
    criticalAlerts: true,
    statusChanges: true,
    commentsMentions: true,
  });
  const [securityPreferences, setSecurityPreferences] = useState({
    twoFactor: false,
    biometric: false,
    sessionTimeout: 30,
    rememberDevice: true,
    loginAlerts: true,
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const settingsLoadedRef = useRef<string | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const lastSavedRef = useRef<string | null>(null);
  const autoSaveErrorShownRef = useRef(false);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsPasswordSaving(true);

    const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
    if (authError) {
      toast.error("Failed to update Auth password", { description: authError.message });
      setIsPasswordSaving(false);
      return;
    }

    const { error: dbError } = await setMyPassword(newPassword);
    if (dbError) {
      toast.error("Failed to update database password hash", { description: dbError.message });
      setIsPasswordSaving(false);
      return;
    }

    toast.success("Password updated");
    setIsPasswordSaving(false);
    setIsChangePasswordOpen(false);
    setNewPassword("");
    setConfirmPassword("");
  };
  
  useDocumentTitle("Settings");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadAuthUser = async () => {
      const { data } = await supabase.auth.getUser();
      setAuthUserId(data.user?.id ?? null);
    };
    loadAuthUser();
  }, []);

  useEffect(() => {
    if (!profile) return;
    setUserRole(profile.role);
    setProfileName(profile.name);
    setProfileEmail(profile.email ?? "");
  }, [profile]);

  const getSettingsSnapshot = () =>
    JSON.stringify({
      theme,
      startCollapsed,
      stickyHeader,
      topNavMode,
      sidebarStyle,
      fontSize,
      compactMode,
      emailNotifications,
      pushNotifications,
      securityPreferences,
    });

  const ensureSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) return sessionData.session;
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error) return null;
    return refreshed.session ?? null;
  };

  useEffect(() => {
    const loadSettings = async () => {
      let targetUserId = profile?.authUserId ?? authUserId;
      if (!targetUserId) {
        const session = await ensureSession();
        if (!session) {
          toast.error("Failed to load settings", { description: "Session expired. Please sign in again." });
          setSettingsReady(true);
          return;
        }
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          toast.error("Failed to load settings", { description: error.message });
          setSettingsReady(true);
          return;
        }
        targetUserId = data.user?.id ?? null;
        setAuthUserId(targetUserId ?? null);
      }
      if (!targetUserId) return;
      if (settingsLoadedRef.current === targetUserId) return;
      settingsLoadedRef.current = targetUserId;
      const userSettingsTable = sb.from("user_settings");
      const { data, error } = (await (userSettingsTable
        .select("theme, start_collapsed, sticky_header, top_nav_mode, sidebar_style, font_size, compact_mode, email_notifications, push_notifications, security_preferences")
        .eq("user_id", targetUserId)
        .maybeSingle() as unknown as Promise<{
        data: {
          theme: string | null;
          start_collapsed: boolean | null;
          sticky_header: boolean | null;
          top_nav_mode: boolean | null;
          sidebar_style: string | null;
          font_size: string | null;
          compact_mode: boolean | null;
          email_notifications: Record<string, boolean> | null;
          push_notifications: Record<string, boolean> | null;
          security_preferences: Record<string, unknown> | null;
        } | null;
        error: PostgrestError | null;
      }>));

      if (error) {
        setSettingsReady(true);
        return;
      }

      if (data) {
        if (data.theme) {
          setTheme(data.theme as "light" | "dark" | "system");
        }
        if (data.start_collapsed !== null && data.start_collapsed !== undefined) {
          setStartCollapsed(data.start_collapsed);
        }
        if (data.sticky_header !== null && data.sticky_header !== undefined) {
          setStickyHeader(data.sticky_header);
        }
        if (data.top_nav_mode !== null && data.top_nav_mode !== undefined) {
          setTopNavMode(data.top_nav_mode);
        }
        setSidebarStyle(data.sidebar_style ?? "default");
        setFontSize(data.font_size ?? "medium");
        setCompactMode(Boolean(data.compact_mode));
        if (data.email_notifications) {
          setEmailNotifications((prev) => ({ ...prev, ...data.email_notifications }));
        }
        if (data.push_notifications) {
          setPushNotifications((prev) => ({ ...prev, ...data.push_notifications }));
        }
        if (data.security_preferences) {
          setSecurityPreferences((prev) => ({
            ...prev,
            ...data.security_preferences,
            sessionTimeout: Number(data.security_preferences.sessionTimeout ?? prev.sessionTimeout),
          }));
        }
      } else {
        const upsertSettings = userSettingsTable.upsert.bind(userSettingsTable) as unknown as ((
          values: TablesInsert<"user_settings">,
          options: { onConflict: string }
        ) => Promise<{ error: PostgrestError | null }>);

        const { error: upsertError } = await upsertSettings(
          {
            user_id: targetUserId,
            user_name: profileName,
            user_email: profileEmail,
            theme,
            start_collapsed: startCollapsed,
            sticky_header: stickyHeader,
            top_nav_mode: topNavMode,
            sidebar_style: sidebarStyle,
            font_size: fontSize,
            compact_mode: compactMode,
            email_notifications: emailNotifications,
            push_notifications: pushNotifications,
            security_preferences: securityPreferences,
          },
          { onConflict: "user_id" }
        );
        if (upsertError) {
          toast.error("Failed to initialize settings", { description: upsertError.message });
        }
      }

      setSettingsReady(true);
      setIsSavingSettings(false);
    };

    loadSettings();
  }, [
    profile,
    authUserId,
    profileName,
    profileEmail,
    setStartCollapsed,
    setStickyHeader,
    setTopNavMode,
    setTheme,
    theme,
    startCollapsed,
    stickyHeader,
    topNavMode,
    sidebarStyle,
    fontSize,
    compactMode,
    emailNotifications,
    pushNotifications,
    securityPreferences,
  ]);

  useEffect(() => {
    if (!settingsReady) return;
    if (lastSavedRef.current !== null) return;
    lastSavedRef.current = getSettingsSnapshot();
  }, [
    settingsReady,
    theme,
    startCollapsed,
    stickyHeader,
    topNavMode,
    sidebarStyle,
    fontSize,
    compactMode,
    emailNotifications,
    pushNotifications,
    securityPreferences,
  ]);

  const saveSettings = async (silent = false, snapshot?: string) => {
    let targetUserId = profile?.authUserId ?? authUserId;
    if (!targetUserId) {
      const session = await ensureSession();
      if (!session) {
        if (!silent) {
          toast.error("Failed to save settings", { description: "Session expired. Please sign in again." });
        }
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (!silent) {
          toast.error("Failed to save settings", { description: error.message });
        }
        return;
      }
      targetUserId = data.user?.id ?? null;
      setAuthUserId(targetUserId ?? null);
    }
    if (!targetUserId) return;
    if (!silent) {
      setIsSavingSettings(true);
    }
    const userSettingsTable = sb.from("user_settings");
    const upsertSettings = userSettingsTable.upsert.bind(userSettingsTable) as unknown as ((
      values: TablesInsert<"user_settings">,
      options: { onConflict: string }
    ) => Promise<{ error: PostgrestError | null }>);

    const payload = {
      user_id: targetUserId,
      user_name: profileName,
      user_email: profileEmail,
      theme,
      start_collapsed: startCollapsed,
      sticky_header: stickyHeader,
      top_nav_mode: topNavMode,
      sidebar_style: sidebarStyle,
      font_size: fontSize,
      compact_mode: compactMode,
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      security_preferences: securityPreferences,
    };

    const reportSaveError = (message: string, err?: { message?: string; details?: string; hint?: string }) => {
      const description = err?.details || err?.hint || err?.message || "Unknown error";
      if (!silent) {
        toast.error(message, { description });
      } else if (!autoSaveErrorShownRef.current) {
        toast.error("Auto-save failed", { description });
        autoSaveErrorShownRef.current = true;
      }
    };

    try {
      const { error } = await upsertSettings(
        {
          ...payload,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        reportSaveError("Failed to save settings", error);

        const { error: updateError } = await sb
          .from("user_settings")
          .update({
            theme: payload.theme,
            start_collapsed: payload.start_collapsed,
            sticky_header: payload.sticky_header,
            top_nav_mode: payload.top_nav_mode,
            sidebar_style: payload.sidebar_style,
            font_size: payload.font_size,
            compact_mode: payload.compact_mode,
            email_notifications: payload.email_notifications,
            push_notifications: payload.push_notifications,
            security_preferences: payload.security_preferences,
            user_name: payload.user_name,
            user_email: payload.user_email,
          })
          .eq("user_id", targetUserId);

        if (updateError) {
          reportSaveError("Failed to update settings", updateError);

          const { error: insertError } = await sb.from("user_settings").insert(payload);
          if (insertError) {
            reportSaveError("Failed to create settings", insertError);
            console.error("Failed to save settings", insertError);
            return;
          }
        }
      }

      if (!silent) {
        toast.success("Settings saved");
      }
      autoSaveErrorShownRef.current = false;
      if (snapshot) {
        lastSavedRef.current = snapshot;
      }
    } catch (err) {
      if (!silent) {
        toast.error("Failed to save settings");
      }
    } finally {
      if (!silent) {
        setIsSavingSettings(false);
      }
    }
  };

  useEffect(() => {
    const targetUserId = profile?.authUserId ?? authUserId;
    if (!targetUserId) return;
    if (!settingsReady) return;
    if (settingsLoadedRef.current !== targetUserId) return;
    if (lastSavedRef.current === null) return;
    if (!profileName && !profileEmail) return;

    const snapshot = getSettingsSnapshot();
    if (snapshot === lastSavedRef.current) return;

    const timeout = setTimeout(() => {
      saveSettings(true, snapshot);
    }, 600);

    return () => clearTimeout(timeout);
  }, [
    profile?.authUserId,
    authUserId,
    settingsReady,
    theme,
    startCollapsed,
    stickyHeader,
    topNavMode,
    sidebarStyle,
    fontSize,
    compactMode,
    emailNotifications,
    pushNotifications,
    securityPreferences,
  ]);

  useEffect(() => {
    if (accessLoading) return;
    if (accessIsAdmin) return;
    if (!canViewPage("settings")) {
      toast.error("Access denied", { description: "You do not have access to the Settings page." });
      navigate("/", { replace: true });
    }
  }, [accessLoading, accessIsAdmin, canViewPage, navigate]);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-3xl"
    >
      <Breadcrumbs />
      <motion.div variants={item}>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage application preferences</p>
      </motion.div>

      {/* Profile & Role */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="w-4 h-4" />
            Profile
          </div>
          <Badge variant={userRole === "admin" ? "default" : userRole === "manager" ? "secondary" : "outline"}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs">Full Name</Label>
            <Input id="fullName" value={profileName} readOnly className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" value={profileEmail} readOnly className="h-9" />
          </div>
        </div>
      </motion.div>

      {/* User Role */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserCog className="w-4 h-4" />
          User Role
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Current Role</Label>
          <Select value={userRole} onValueChange={setUserRole} disabled>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {userRole === "admin" && "Full access to all features and settings"}
            {userRole === "manager" && "Can manage permits and users, limited settings access"}
            {userRole === "user" && "Can create and edit own permits"}
            {userRole === "viewer" && "Read-only access to permits and reports"}
          </p>
        </div>
      </motion.div>

      {/* Tabs for Personalization, Notifications, Security */}
      <motion.div variants={item}>
        <Tabs defaultValue="personalization" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="personalization" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Personalization</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Personalization Tab */}
          <TabsContent value="personalization" className="space-y-4">
            {/* Appearance */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Palette className="w-4 h-4" />
                Appearance
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                    className={cn(
                      "relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                      theme === option.value 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                    )}
                  >
                    {theme === option.value && <Check className="w-3.5 h-3.5" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Behavior */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Layout className="w-4 h-4" />
                Layout Behavior
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Start Collapsed</p>
                      <p className="text-xs text-muted-foreground">Sidebar starts in collapsed state</p>
                    </div>
                  </div>
                  <Switch checked={startCollapsed} onCheckedChange={setStartCollapsed} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Sticky Header</p>
                      <p className="text-xs text-muted-foreground">Keep header fixed while scrolling</p>
                    </div>
                  </div>
                  <Switch checked={stickyHeader} onCheckedChange={setStickyHeader} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <PanelTop className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Top Nav Mode</p>
                      <p className="text-xs text-muted-foreground">Use horizontal navigation instead of sidebar</p>
                    </div>
                  </div>
                  <Switch checked={topNavMode} onCheckedChange={setTopNavMode} />
                </div>
              </div>
            </div>

            {/* Customization */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Monitor className="w-4 h-4" />
                Customization
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Sidebar Style</Label>
                  <Select value={sidebarStyle} onValueChange={setSidebarStyle}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" />
                    Font Size
                  </Label>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
                    </div>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bell className="w-4 h-4" />
                Email Notifications
              </div>
              <div className="space-y-3">
                {[
                  { label: "Email notifications", desc: "Receive email alerts for important updates", key: "emailNotifications" },
                  { label: "Weekly digest", desc: "Get a summary of activity every week", key: "weeklyDigest" },
                  { label: "Marketing emails", desc: "Receive news and promotional content", key: "marketingEmails" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch
                      checked={emailNotifications[n.key as keyof typeof emailNotifications]}
                      onCheckedChange={(checked) =>
                        setEmailNotifications((prev) => ({ ...prev, [n.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Bell className="w-4 h-4" />
                Push Notifications
              </div>
              <div className="space-y-3">
                {[
                  { label: "Pending reminders", desc: "Daily reminder for pending uploads", key: "pendingReminders" },
                  { label: "Critical alerts", desc: "Immediate alerts for urgent issues", key: "criticalAlerts" },
                  { label: "Status changes", desc: "Notify when permit status changes", key: "statusChanges" },
                  { label: "Comments & mentions", desc: "Get notified when someone mentions you", key: "commentsMentions" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch
                      checked={pushNotifications[n.key as keyof typeof pushNotifications]}
                      onCheckedChange={(checked) =>
                        setPushNotifications((prev) => ({ ...prev, [n.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="w-4 h-4" />
                Authentication
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Two-factor authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={securityPreferences.twoFactor}
                    onCheckedChange={(checked) =>
                      setSecurityPreferences((prev) => ({ ...prev, twoFactor: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Biometric login</p>
                    <p className="text-xs text-muted-foreground">Use fingerprint or face recognition</p>
                  </div>
                  <Switch
                    checked={securityPreferences.biometric}
                    onCheckedChange={(checked) =>
                      setSecurityPreferences((prev) => ({ ...prev, biometric: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="w-4 h-4" />
                Session Management
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Session timeout</p>
                    <p className="text-xs text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={securityPreferences.sessionTimeout}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isNaN(value)) return;
                        setSecurityPreferences((prev) => ({
                          ...prev,
                          sessionTimeout: Math.max(5, Math.min(240, value)),
                        }));
                      }}
                      className="w-16 h-8 text-center"
                      inputMode="numeric"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Remember device</p>
                    <p className="text-xs text-muted-foreground">Stay logged in on trusted devices</p>
                  </div>
                  <Switch
                    checked={securityPreferences.rememberDevice}
                    onCheckedChange={(checked) =>
                      setSecurityPreferences((prev) => ({ ...prev, rememberDevice: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Login alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified of new sign-ins</p>
                  </div>
                  <Switch
                    checked={securityPreferences.loginAlerts}
                    onCheckedChange={(checked) =>
                      setSecurityPreferences((prev) => ({ ...prev, loginAlerts: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="w-4 h-4" />
                Password & Recovery
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Set Recovery Email
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  View Active Sessions
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Save */}
      <motion.div variants={item} className="flex justify-end pt-2">
        <Button className="gap-2" onClick={() => saveSettings(false, getSettingsSnapshot())} disabled={isSavingSettings}>
          <Save className="w-4 h-4" />
          {isSavingSettings ? "Saving..." : "Save Changes"}
        </Button>
      </motion.div>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="settingsNewPassword">New Password</Label>
              <Input
                id="settingsNewPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settingsConfirmPassword">Confirm Password</Label>
              <Input
                id="settingsConfirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsChangePasswordOpen(false)}
                disabled={isPasswordSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isPasswordSaving}>
                {isPasswordSaving ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Settings;