import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  LogOut, LayoutDashboard, FileText, Users, BookOpen,
  Menu, X, ShieldCheck, Activity, BarChart2, User,
  GraduationCap, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
];

const NAV_PROCTOR: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exams", label: "Exams", icon: FileText },
  { href: "/students", label: "Students", icon: Users },
];

const NAV_STUDENT: NavItem[] = [
  { href: "/my-exams", label: "My Exams", icon: BookOpen },
  { href: "/my-stats", label: "Performance", icon: BarChart2 },
];

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

        {/* Settings / Profile */}
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
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {initials}
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
        {/* Mobile header */}
        <header className="h-14 border-b border-border/60 bg-card flex items-center justify-between px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-mono tracking-widest uppercase text-primary">AI EXAM PROCTORING SYSTEM</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
