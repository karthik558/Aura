import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  PanelTop,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Mail,
  BellRing,
  Key,
  Fingerprint,
  Clock,
  Smartphone,
  LogIn,
  Lock,
  MailCheck,
  Eye
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

type SettingsSection = "profile" | "appearance" | "notifications" | "security";

const settingsSections = [
  { id: "profile" as const, label: "Profile", icon: User, description: "Manage your account details" },
  { id: "appearance" as const, label: "Appearance", icon: Palette, description: "Customize your experience" },
  { id: "notifications" as const, label: "Notifications", icon: Bell, description: "Configure alerts & updates" },
  { id: "security" as const, label: "Security", icon: Shield, description: "Protect your account" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

const slideIn = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

function SettingsSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[calc(100vh-12rem)]">
      {/* Sidebar Skeleton */}
      <div className="w-full lg:w-64 xl:w-72 shrink-0">
        <div className="lg:sticky lg:top-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="flex-1 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (sb.from("user_settings") as any)
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: insertError } = await (sb.from("user_settings") as any).insert(payload);
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

  // Settings Navigation Sidebar Item
  const NavItem = ({ section }: { section: typeof settingsSections[number] }) => {
    const isActive = activeSection === section.id;
    return (
      <button
        onClick={() => setActiveSection(section.id)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
          "hover:bg-accent/50 group",
          isActive 
            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
          isActive ? "bg-primary/10" : "bg-muted/50 group-hover:bg-accent"
        )}>
          <section.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm truncate", isActive && "text-primary")}>{section.label}</p>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">{section.description}</p>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform shrink-0",
          isActive ? "text-primary rotate-90" : "text-muted-foreground/50"
        )} />
      </button>
    );
  };

  // Profile Section
  const ProfileSection = () => (
    <motion.div
      key="profile"
      variants={slideIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Profile Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and role</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">{profileName || "Your Name"}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{profileEmail || "email@example.com"}</CardDescription>
              </div>
            </div>
            <Badge 
              variant={userRole === "admin" ? "default" : userRole === "manager" ? "secondary" : "outline"}
              className="w-fit"
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input id="fullName" value={profileName} readOnly className="h-11 bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input id="email" value={profileEmail} readOnly className="h-11 bg-muted/30" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Role & Permissions</CardTitle>
          </div>
          <CardDescription>Your current role determines your access level</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Role</Label>
            <Select value={userRole} onValueChange={setUserRole} disabled>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground">
              {userRole === "admin" && "🔓 Full access to all features, settings, and user management capabilities."}
              {userRole === "manager" && "📋 Can manage permits and users with limited settings access."}
              {userRole === "user" && "✏️ Can create and edit your own permits and view reports."}
              {userRole === "viewer" && "👁️ Read-only access to permits and reports."}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Appearance Section
  const AppearanceSection = () => (
    <motion.div
      key="appearance"
      variants={slideIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize how Aura looks and feels</p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Theme</CardTitle>
          </div>
          <CardDescription>Select your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "light", label: "Light", icon: Sun, desc: "Bright & clean" },
              { value: "dark", label: "Dark", icon: Moon, desc: "Easy on eyes" },
              { value: "system", label: "System", icon: Laptop, desc: "Auto switch" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border-2 transition-all duration-200",
                  theme === option.value 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-border hover:border-muted-foreground/30 hover:bg-accent/30"
                )}
              >
                {theme === option.value && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  theme === option.value ? "bg-primary/10" : "bg-muted"
                )}>
                  <option.icon className={cn("w-6 h-6", theme === option.value ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <p className={cn("font-medium", theme === option.value && "text-primary")}>{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layout Behavior */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Layout</CardTitle>
          </div>
          <CardDescription>Configure navigation and layout behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingToggle
            icon={PanelLeftClose}
            title="Collapsed Sidebar"
            description="Start with sidebar collapsed on desktop"
            checked={startCollapsed}
            onCheckedChange={setStartCollapsed}
          />
          <Separator className="my-2" />
          <SettingToggle
            icon={Pin}
            title="Sticky Header"
            description="Keep header fixed when scrolling"
            checked={stickyHeader}
            onCheckedChange={setStickyHeader}
          />
          <Separator className="my-2" />
          <SettingToggle
            icon={PanelTop}
            title="Top Navigation"
            description="Use horizontal nav instead of sidebar"
            checked={topNavMode}
            onCheckedChange={setTopNavMode}
          />
        </CardContent>
      </Card>

      {/* Customization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Display</CardTitle>
          </div>
          <CardDescription>Fine-tune your display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sidebar Style</Label>
              <Select value={sidebarStyle} onValueChange={setSidebarStyle}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                Font Size
              </Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <SettingToggle
            icon={Monitor}
            title="Compact Mode"
            description="Reduce spacing for denser content"
            checked={compactMode}
            onCheckedChange={setCompactMode}
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  // Setting Toggle Component
  const SettingToggle = ({ 
    icon: Icon, 
    title, 
    description, 
    checked, 
    onCheckedChange 
  }: { 
    icon: React.ElementType;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3 px-1 hover:bg-accent/30 rounded-lg transition-colors -mx-1">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="ml-3 shrink-0" />
    </div>
  );

  // Notifications Section
  const NotificationsSection = () => (
    <motion.div
      key="notifications"
      variants={slideIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose what updates you want to receive</p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Email Notifications</CardTitle>
          </div>
          <CardDescription>Manage your email preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: "Email notifications", desc: "Receive email alerts for important updates", key: "emailNotifications", icon: Mail },
            { label: "Weekly digest", desc: "Get a summary of activity every week", key: "weeklyDigest", icon: MailCheck },
            { label: "Marketing emails", desc: "Receive news and promotional content", key: "marketingEmails", icon: BellRing },
          ].map((n, idx) => (
            <div key={n.key}>
              {idx > 0 && <Separator className="my-2" />}
              <SettingToggle
                icon={n.icon}
                title={n.label}
                description={n.desc}
                checked={emailNotifications[n.key as keyof typeof emailNotifications]}
                onCheckedChange={(checked) =>
                  setEmailNotifications((prev) => ({ ...prev, [n.key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Push Notifications</CardTitle>
          </div>
          <CardDescription>Real-time alerts and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: "Pending reminders", desc: "Daily reminder for pending uploads", key: "pendingReminders", icon: Clock },
            { label: "Critical alerts", desc: "Immediate alerts for urgent issues", key: "criticalAlerts", icon: Bell },
            { label: "Status changes", desc: "Notify when permit status changes", key: "statusChanges", icon: BellRing },
            { label: "Comments & mentions", desc: "Get notified when someone mentions you", key: "commentsMentions", icon: User },
          ].map((n, idx) => (
            <div key={n.key}>
              {idx > 0 && <Separator className="my-2" />}
              <SettingToggle
                icon={n.icon}
                title={n.label}
                description={n.desc}
                checked={pushNotifications[n.key as keyof typeof pushNotifications]}
                onCheckedChange={(checked) =>
                  setPushNotifications((prev) => ({ ...prev, [n.key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Security Section
  const SecuritySection = () => (
    <motion.div
      key="security"
      variants={slideIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Security</h2>
        <p className="text-sm text-muted-foreground mt-1">Keep your account safe and secure</p>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Authentication</CardTitle>
          </div>
          <CardDescription>Extra layers of account protection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <SettingToggle
            icon={Shield}
            title="Two-factor authentication"
            description="Add an extra layer of security"
            checked={securityPreferences.twoFactor}
            onCheckedChange={(checked) =>
              setSecurityPreferences((prev) => ({ ...prev, twoFactor: checked }))
            }
          />
          <Separator className="my-2" />
          <SettingToggle
            icon={Fingerprint}
            title="Biometric login"
            description="Use fingerprint or face recognition"
            checked={securityPreferences.biometric}
            onCheckedChange={(checked) =>
              setSecurityPreferences((prev) => ({ ...prev, biometric: checked }))
            }
          />
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Session Management</CardTitle>
          </div>
          <CardDescription>Control your login sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-1 hover:bg-accent/30 rounded-lg transition-colors -mx-1 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Session timeout</p>
                <p className="text-xs text-muted-foreground">Auto logout after inactivity</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-3">
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
                className="w-20 h-9 text-center"
                inputMode="numeric"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>
          <Separator />
          <SettingToggle
            icon={Smartphone}
            title="Remember device"
            description="Stay logged in on trusted devices"
            checked={securityPreferences.rememberDevice}
            onCheckedChange={(checked) =>
              setSecurityPreferences((prev) => ({ ...prev, rememberDevice: checked }))
            }
          />
          <Separator />
          <SettingToggle
            icon={LogIn}
            title="Login alerts"
            description="Get notified of new sign-ins"
            checked={securityPreferences.loginAlerts}
            onCheckedChange={(checked) =>
              setSecurityPreferences((prev) => ({ ...prev, loginAlerts: checked }))
            }
          />
        </CardContent>
      </Card>

      {/* Password & Recovery */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Password & Recovery</CardTitle>
          </div>
          <CardDescription>Manage your password and recovery options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent/50"
              onClick={() => setIsChangePasswordOpen(true)}
            >
              <Key className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Change Password</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent/50"
            >
              <MailCheck className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Recovery Email</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <Eye className="w-5 h-5" />
              <span className="text-sm">Active Sessions</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      {/* Breadcrumbs */}
      <motion.div variants={item} className="mb-6">
        <Breadcrumbs />
      </motion.div>

      {/* Page Header */}
      <motion.div variants={item} className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your account and application preferences</p>
      </motion.div>

      {/* Mobile Navigation Tabs */}
      <motion.div variants={item} className="lg:hidden mb-6">
        <ScrollArea className="w-full pb-2">
          <div className="flex gap-2 min-w-max px-1">
            {settingsSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Main Layout */}
      <motion.div variants={item} className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block w-64 xl:w-72 shrink-0">
          <div className="sticky top-6 space-y-2">
            {settingsSections.map((section) => (
              <NavItem key={section.id} section={section} />
            ))}
            
            {/* Save Button - Desktop */}
            <div className="pt-4">
              <Button 
                className="w-full gap-2 h-12" 
                onClick={() => saveSettings(false, getSettingsSnapshot())} 
                disabled={isSavingSettings}
              >
                <Save className="w-4 h-4" />
                {isSavingSettings ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === "profile" && <ProfileSection />}
            {activeSection === "appearance" && <AppearanceSection />}
            {activeSection === "notifications" && <NotificationsSection />}
            {activeSection === "security" && <SecuritySection />}
          </AnimatePresence>

          {/* Mobile Save Button */}
          <motion.div variants={item} className="lg:hidden mt-8 pb-4">
            <Button 
              className="w-full gap-2 h-12" 
              onClick={() => saveSettings(false, getSettingsSnapshot())} 
              disabled={isSavingSettings}
            >
              <Save className="w-4 h-4" />
              {isSavingSettings ? "Saving..." : "Save Changes"}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[420px] mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="settingsNewPassword" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Password</Label>
              <Input
                id="settingsNewPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsConfirmPassword" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
              <Input
                id="settingsConfirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="h-11"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsChangePasswordOpen(false)}
                disabled={isPasswordSaving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleChangePassword} 
                disabled={isPasswordSaving}
                className="w-full sm:w-auto"
              >
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