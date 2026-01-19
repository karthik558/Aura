import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserCog,
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
  name: string;
  email: string;
  role: "admin" | "manager" | "staff" | "viewer";
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
  avatar: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const roleConfig = {
  admin: { label: "Admin", icon: ShieldCheck, className: "bg-danger/10 text-danger" },
  manager: { label: "Manager", icon: Shield, className: "bg-primary/10 text-primary" },
  staff: { label: "Staff", icon: UserCog, className: "bg-success/10 text-success" },
  viewer: { label: "Viewer", icon: Eye, className: "bg-muted text-muted-foreground" },
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  
  useDocumentTitle("Users");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load users", error);
      setIsLoading(false);
      return;
    }

    const mappedUsers: UserData[] = (data ?? []).map((user) => ({
      id: user.user_code ?? user.id,
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
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserAdded = () => {
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
      <motion.div variants={item} className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
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
                const RoleIcon = roleConfig[user.role].icon;
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
                      <Badge className={cn("gap-1 text-xs", roleConfig[user.role].className)}>
                        <RoleIcon className="w-3 h-3" />
                        {roleConfig[user.role].label}
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
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit User</DropdownMenuItem>
                            <DropdownMenuItem><Key className="w-4 h-4 mr-2" /> Reset Password</DropdownMenuItem>
                            <DropdownMenuItem><Mail className="w-4 h-4 mr-2" /> Send Email</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-danger focus:text-danger focus:bg-danger/10">
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user, index) => {
          const RoleIcon = roleConfig[user.role].icon;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-sm font-medium">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                    <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-danger"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={cn("gap-1 text-xs", roleConfig[user.role].className)}>
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig[user.role].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{user.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={user.status === "active"} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Users;
