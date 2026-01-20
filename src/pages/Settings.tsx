import { useState, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { 
    startCollapsed, 
    stickyHeader, 
    topNavMode, 
    setStartCollapsed, 
    setStickyHeader, 
    setTopNavMode 
  } = useLayoutSettings();
  const [userRole, setUserRole] = useState("admin");
  const [sidebarStyle, setSidebarStyle] = useState("default");
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

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
            <Input id="fullName" defaultValue="John Doe" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" defaultValue="john@hotel.com" className="h-9" />
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
          <Select value={userRole} onValueChange={setUserRole}>
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
                  { label: "Email notifications", desc: "Receive email alerts for important updates" },
                  { label: "Weekly digest", desc: "Get a summary of activity every week" },
                  { label: "Marketing emails", desc: "Receive news and promotional content" },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch defaultChecked={i === 0} />
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
                  { label: "Pending reminders", desc: "Daily reminder for pending uploads" },
                  { label: "Critical alerts", desc: "Immediate alerts for urgent issues" },
                  { label: "Status changes", desc: "Notify when permit status changes" },
                  { label: "Comments & mentions", desc: "Get notified when someone mentions you" },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch defaultChecked />
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
                  <Switch />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Biometric login</p>
                    <p className="text-xs text-muted-foreground">Use fingerprint or face recognition</p>
                  </div>
                  <Switch />
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
                    <Input defaultValue="30" className="w-16 h-8 text-center" />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Remember device</p>
                    <p className="text-xs text-muted-foreground">Stay logged in on trusted devices</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Login alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified of new sign-ins</p>
                  </div>
                  <Switch defaultChecked />
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
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Save Changes
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