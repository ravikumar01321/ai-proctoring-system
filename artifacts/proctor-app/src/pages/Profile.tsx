import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Shield, Calendar, CheckCircle, Eye, EyeOff } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string().min(1, "Required"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  proctor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  student: "bg-green-500/10 text-green-400 border-green-500/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Profile() {
  const { user, login, token } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"info" | "password">("info");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSaveProfile = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update profile");
      }
      const updated = await res.json();
      if (user && token) login(token, updated);
      toast({ title: "Profile updated", description: "Your information has been saved." });
    } catch (e: unknown) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to change password");
      }
      passwordForm.reset();
      toast({ title: "Password changed", description: "Your password has been updated securely." });
    } catch (e: unknown) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6" data-testid="profile-page">
      {/* Header */}
      <motion.div variants={item}>
        <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// Account</div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account information and security</p>
      </motion.div>

      {/* Identity card */}
      <motion.div variants={item}>
        <Card className="border-border/60 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </div>
          <CardContent className="px-6 pb-6 -mt-8">
            <div className="flex items-end gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xl font-black text-primary shadow-lg shrink-0"
              >
                {initials}
              </motion.div>
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold truncate">{user?.name}</h2>
                  <Badge variant="secondary" className={`text-[9px] border ${ROLE_COLORS[user?.role ?? "student"]}`}>
                    {user?.role}
                  </Badge>
                  <Badge variant="secondary" className={`text-[9px] border ${user?.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {user?.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
              {[
                { icon: User, label: "Full Name", value: user?.name },
                { icon: Mail, label: "Email", value: user?.email },
                { icon: Calendar, label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-muted/40 border border-border/50 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <f.icon className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{f.label}</p>
                  </div>
                  <p className="text-sm font-medium truncate">{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50">
        {(["info", "password"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${tab === t ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "info" ? "Account Info" : "Change Password"}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "info" ? (
          <motion.div key="info" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Account Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                    <FormField control={profileForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9 h-11 bg-muted/30" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="email" className="pl-9 h-11 bg-muted/30" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="pt-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground mb-4">
                        <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                        Your role (<span className="text-primary font-medium capitalize">{user?.role}</span>) can only be changed by an administrator.
                      </div>
                      <Button type="submit" disabled={saving} className="w-full h-11">
                        <AnimatePresence mode="wait">
                          {saving ? (
                            <motion.span key="saving" className="flex items-center gap-2">
                              <motion.span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                              Saving...
                            </motion.span>
                          ) : (
                            <motion.span key="idle" className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Save Changes
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-amber-500" />
                  <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Change Password</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    {[
                      { name: "currentPassword" as const, label: "Current Password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                      { name: "newPassword" as const, label: "New Password", show: showNew, toggle: () => setShowNew(!showNew) },
                      { name: "confirmPassword" as const, label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                    ].map((f) => (
                      <FormField key={f.name} control={passwordForm.control} name={f.name} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{f.label}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input type={f.show ? "text" : "password"} className="pl-9 pr-10 h-11 bg-muted/30" {...field} />
                              <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ))}
                    <div className="pt-2">
                      <Button type="submit" disabled={saving} className="w-full h-11">
                        <AnimatePresence mode="wait">
                          {saving ? (
                            <motion.span key="saving" className="flex items-center gap-2">
                              <motion.span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                              Updating...
                            </motion.span>
                          ) : (
                            <motion.span key="idle" className="flex items-center gap-2">
                              <Lock className="w-4 h-4" /> Update Password
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
