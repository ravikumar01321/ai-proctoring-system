import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListUsers, getListUsersQueryKey, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, UserX, UserCheck, Trash2, Users, BarChart2, Shield, BookOpen, GraduationCap } from "lucide-react";

type Role = "all" | "student" | "proctor" | "admin";

const ROLE_TABS: { value: Role; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Users },
  { value: "student", label: "Students", icon: GraduationCap },
  { value: "proctor", label: "Proctors", icon: Shield },
  { value: "admin", label: "Admins", icon: BookOpen },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  proctor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  student: "bg-green-500/10 text-green-400 border-green-500/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const row = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.28 } } };

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListUsers(
    roleFilter !== "all" ? { role: roleFilter } : {},
    { query: { queryKey: getListUsersQueryKey(roleFilter !== "all" ? { role: roleFilter } : {}) } }
  );

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const filtered = (users ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: (users ?? []).length,
    student: (users ?? []).filter(u => u.role === "student").length,
    proctor: (users ?? []).filter(u => u.role === "proctor").length,
    admin: (users ?? []).filter(u => u.role === "admin").length,
  };

  const toggleActive = (id: number, name: string, active: boolean) => {
    updateUser.mutate({ id, data: { isActive: !active } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: active ? `${name} deactivated` : `${name} activated` });
      },
    });
  };

  const handleDelete = (id: number, name: string) => {
    deleteUser.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User deleted", description: `${name} has been removed.` });
      },
    });
  };

  const handlePromote = (id: number, name: string, currentRole: string) => {
    const newRole = currentRole === "student" ? "proctor" : "student";
    updateUser.mutate({ id, data: { role: newRole as "student" | "proctor" | "admin" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Role updated", description: `${name} is now a ${newRole}.` });
      },
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-users-page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// User Management</div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage all system users, roles, and permissions</p>
      </motion.div>

      {/* Stats strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3">
        {ROLE_TABS.map((t) => (
          <Card key={t.value} className={`border cursor-pointer transition-all hover:scale-[1.02] ${roleFilter === t.value ? "border-primary/40 bg-primary/5" : "border-border/60"}`} onClick={() => setRoleFilter(t.value)}>
            <CardContent className="p-3 text-center">
              <t.icon className={`w-4 h-4 mx-auto mb-1 ${roleFilter === t.value ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-lg font-bold">{counts[t.value]}</p>
              <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{t.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border/70 focus:border-primary/60" />
        </div>
        <div className="flex gap-1 p-1 bg-muted/40 rounded-lg border border-border/50">
          {ROLE_TABS.map((t) => (
            <button key={t.value} onClick={() => setRoleFilter(t.value)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${roleFilter === t.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      {!isLoading && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground font-mono">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""} {search ? "matching search" : "total"}
        </motion.p>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/60 py-3 px-5">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/50">
                <AnimatePresence>
                  {filtered.map((u) => (
                    <motion.div key={u.id} variants={row} layout exit={{ opacity: 0, x: -20 }} className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 hover:bg-muted/20 transition-colors" data-testid={`user-row-${u.id}`}>
                      {/* Name + avatar */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Email */}
                      <p className="text-xs text-muted-foreground font-mono truncate">{u.email}</p>

                      {/* Role */}
                      <div>
                        <Badge variant="secondary" className={`text-[9px] border ${ROLE_COLORS[u.role]}`}>{u.role}</Badge>
                      </div>

                      {/* Status */}
                      <div>
                        <Badge variant="secondary" className={`text-[9px] border ${u.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-primary" title="View stats" onClick={() => setLocation(`/admin/users/${u.id}`)}>
                          <BarChart2 className="w-3.5 h-3.5" />
                        </Button>
                        {u.role !== "admin" && (
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-blue-400" title={u.role === "student" ? "Promote to Proctor" : "Demote to Student"} onClick={() => handlePromote(u.id, u.name, u.role)}>
                            <Shield className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className={`w-7 h-7 ${u.isActive ? "text-muted-foreground hover:text-amber-400" : "text-muted-foreground hover:text-green-400"}`} title={u.isActive ? "Deactivate" : "Activate"} onClick={() => toggleActive(u.id, u.name, u.isActive ?? true)}>
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove this user and all their data. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(u.id, u.name)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
