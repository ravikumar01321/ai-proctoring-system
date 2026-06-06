import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  LogOut, LayoutDashboard, FileText, Users, BookOpen,
  Menu, X, ShieldCheck, Activity, BarChart2, User,
  GraduationCap, Settings, Bell, AlertTriangle, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetRecentActivity, getGetRecentActivityQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ADMIN: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exams", label: "Exams", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/students", label: "Monitor", icon: GraduationCap },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
];

const NAV_PROCTOR: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exams", label: "Exams", icon: FileText },
  { href: "/students", label: "Students", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
];

const NAV_STUDENT: NavItem[] = [
  { href: "/my-exams", label: "My Exams", icon: BookOpen },
  { href: "/my-stats", label: "Performance", icon: BarChart2 },
];

const ACTIVITY_BADGE: Record<string, string> = {
  exam_started: "bg-blue-500/10 text-blue-400",
  exam_submitted: "bg-green-500/10 text-green-400",
  violation_detected: "bg-amber-500/10 text-amber-400",
  student_flagged: "bg-red-500/10 text-red-400",
  exam_created: "bg-violet-500/10 text-violet-400",
};

function timeAgo(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function NotificationBell({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: activity } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey(), refetchInterval: 10000 },
  });

  const items = activity?.slice(0, 8) ?? [];
  const unread = Math.max(0, items.length - seenCount);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) setSeenCount(items.length);
  };

  if (role === "student") return null;

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold">Activity Feed</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.span
                  className="relative flex h-1.5 w-1.5"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </motion.span>
                <span className="text-[9px] font-mono text-muted-foreground">live</span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
              {items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">No recent activity</div>
              ) : items.map((itm, i) => (
                <motion.div
                  key={itm.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors ${i < unread ? "bg-primary/3" : ""}`}
                >
                  <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 uppercase tracking-wider ${ACTIVITY_BADGE[itm.type] ?? "bg-muted text-muted-foreground"}`}>
                    {itm.type.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug line-clamp-2">{itm.message}</p>
                    <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{timeAgo(itm.timestamp)}</p>
                  </div>
                  {itm.type === "violation_detected" || itm.type === "student_flagged" ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  ) : null}
                </motion.div>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-border/60 bg-muted/20">
              <button
                onClick={() => { setOpen(false); queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() }); }}
                className="text-[10px] text-primary hover:underline"
              >
                Refresh feed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <item.icon className={`w-4 h-4 shrink-0 transition-all ${isActive ? "text-primary" : "group-hover:text-foreground"}`} />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-mono bg-primary/15 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">{item.badge}</span>
      )}
      {isActive && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </Link>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    user?.role === "admin" ? NAV_ADMIN :
    user?.role === "proctor" ? NAV_PROCTOR :
    NAV_STUDENT;

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  const isProfileActive = location === "/profile";

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <motion.div
              className="absolute -inset-0.5 rounded-lg border border-primary/25"
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[8px] font-mono tracking-[0.28em] text-primary uppercase leading-none mb-0.5">AI EXAM</div>
            <div className="text-[11px] font-bold tracking-widest text-foreground uppercase leading-none">PROCTORING SYSTEM</div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mt-3 px-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 + 0.1 }}
            >
              <NavLink item={item} isActive={isActive} onClick={() => setMobileOpen(false)} />
            </motion.div>
          );
        })}

        {/* Divider */}
        <div className="border-t border-border/40 my-3" />

        {/* Profile */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: navItems.length * 0.07 + 0.1 }}>
          <NavLink
            item={{ href: "/profile", label: "My Profile", icon: User }}
            isActive={isProfileActive}
            onClick={() => setMobileOpen(false)}
          />
        </motion.div>
      </nav>

      {/* Session activity strip */}
      <div className="px-3 mb-3">
        <div className="rounded-lg bg-muted/40 border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground">Session</span>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium capitalize">{user?.role}</span> access level
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[9px] font-mono text-green-400">Authenticated</span>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="px-3 pb-4 pt-2 border-t border-border/60">
        <button
          onClick={() => { setMobileOpen(false); setLocation("/profile"); }}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/40 transition-colors mb-1 text-left"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {initials}
            </div>
            <motion.div
              className="absolute -inset-0.5 rounded-full border border-primary/20"
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
          </div>
          <Settings className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8 px-2"
          onClick={logout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="w-60 border-r border-border/60 bg-card hidden md:flex flex-col shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border/60 z-50 md:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar — desktop */}
        <header className="h-12 border-b border-border/60 bg-card/80 backdrop-blur-sm hidden md:flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground">
              {location === "/" ? "Home" : location.replace("/", "").replace(/-/g, " ").replace(/\//g, " › ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell role={user?.role ?? "student"} />
            <div className="w-px h-4 bg-border/60" />
            <div className="text-xs text-muted-foreground font-mono">{user?.email}</div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="h-14 border-b border-border/60 bg-card flex items-center justify-between px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-mono tracking-widest uppercase text-primary">AI EXAM PROCTORING SYSTEM</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell role={user?.role ?? "student"} />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
