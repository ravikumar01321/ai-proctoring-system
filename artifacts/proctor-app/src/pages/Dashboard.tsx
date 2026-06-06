import { useEffect, useRef, useState } from "react";
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetViolationSummary, getGetViolationSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useSpring, useTransform, animate } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, RadialBarChart, RadialBar } from "recharts";
import { Shield, Users, BookOpen, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Zap, Eye, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useListExams, getListExamsQueryKey } from "@workspace/api-client-react";

const VIOLATION_COLORS: Record<string, string> = {
  tab_switch: "#f59e0b",
  face_missing: "#ef4444",
  multiple_faces: "#dc2626",
  eye_deviation: "#f97316",
  audio_detected: "#8b5cf6",
  fullscreen_exit: "#06b6d4",
  copy_paste: "#ec4899",
  phone_detected: "#84cc16",
};

const STATS_CONFIG = [
  { key: "totalExams", label: "Total Exams", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
  { key: "activeExams", label: "Active Exams", icon: Activity, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", glow: "shadow-green-500/10" },
  { key: "totalStudents", label: "Total Students", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "shadow-violet-500/10" },
  { key: "totalProctors", label: "Proctors", icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "shadow-cyan-500/10" },
  { key: "ongoingSessions", label: "Live Sessions", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  { key: "flaggedSessions", label: "Flagged", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", glow: "shadow-red-500/10" },
  { key: "completedToday", label: "Completed Today", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  { key: "averagePassRate", label: "Avg Pass Rate", icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", suffix: "%", glow: "shadow-indigo-500/10" },
];

function activityBadgeClass(type: string) {
  const map: Record<string, string> = {
    exam_started: "bg-blue-500/10 text-blue-400",
    exam_submitted: "bg-green-500/10 text-green-400",
    violation_detected: "bg-amber-500/10 text-amber-400",
    student_flagged: "bg-red-500/10 text-red-400",
    exam_created: "bg-violet-500/10 text-violet-400",
  };
  return map[type] ?? "bg-muted text-muted-foreground";
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value]);
  return <span>{display}{suffix}</span>;
}

function RadialProgress({ value, size = 80, stroke = 8, color = "#6366f1" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
      />
    </svg>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 15000 } });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey(), refetchInterval: 10000 } });
  const { data: violations, isLoading: violationsLoading } = useGetViolationSummary({ query: { queryKey: getGetViolationSummaryQueryKey() } });
  const { data: exams } = useListExams({}, { query: { queryKey: getListExamsQueryKey() } });

  const passRate = (stats as Record<string, number> | undefined)?.averagePassRate ?? 0;
  const activeExams = (exams ?? []).filter((e) => e.status === "active");

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase">// Live Overview</span>
            <motion.span
              className="relative flex h-1.5 w-1.5"
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </motion.span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time overview of all active proctoring sessions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg border border-border/50 hover:border-border bg-card"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </motion.button>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : STATS_CONFIG.map((cfg) => {
              const raw = (stats as Record<string, number> | undefined)?.[cfg.key] ?? 0;
              const Icon = cfg.icon;
              return (
                <motion.div key={cfg.key} variants={item} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                  <Card className={`border ${cfg.border} hover:shadow-lg ${cfg.glow} transition-all duration-300 relative overflow-hidden`} data-testid={`stat-${cfg.key}`}>
                    <motion.div
                      className={`absolute inset-0 ${cfg.bg} opacity-0`}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <CardContent className="p-5 relative z-10">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-2">{cfg.label}</p>
                          <motion.p
                            className="text-3xl font-bold text-foreground tabular-nums"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                          >
                            <AnimatedCounter value={raw} suffix={cfg.suffix} />
                          </motion.p>
                        </div>
                        <motion.div
                          className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}
                          whileHover={{ rotate: 12 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </motion.div>

      {/* Pass Rate + Active Exams hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pass Rate radial */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/60 h-full">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-3 h-full min-h-[160px]">
              <div className="relative">
                <RadialProgress value={passRate} size={100} stroke={10} color="#6366f1" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black tabular-nums">{Math.round(passRate)}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">Overall Pass Rate</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">across all exams</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active exams list */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
          <Card className="border-border/60 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 rounded-full bg-green-500" />
                  <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Live Exams</CardTitle>
                </div>
                <Link href="/exams">
                  <span className="text-[10px] text-primary hover:underline cursor-pointer">View all →</span>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeExams.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm px-5">
                  <Activity className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p>No active exams right now</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {activeExams.slice(0, 4).map((exam, i) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 + 0.5 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <motion.span
                        className="relative flex h-2 w-2 shrink-0"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exam.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{exam.duration} min · passing {exam.passingScore}%</p>
                      </div>
                      <Link href={`/exams/${exam.id}/monitor`}>
                        <motion.span whileHover={{ scale: 1.05 }} className="flex items-center gap-1 text-[10px] text-primary cursor-pointer hover:underline shrink-0">
                          <Eye className="w-3 h-3" /> Monitor
                        </motion.span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Violation chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-primary" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Violation Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {violationsLoading ? <Skeleton className="h-52" /> : violations && violations.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={violations} margin={{ top: 0, right: 0, left: -24, bottom: 0 }} barSize={22}>
                    <XAxis dataKey="type" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.replace(/_/g, " ").substring(0, 8)} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                      labelFormatter={(v) => String(v).replace(/_/g, " ")}
                      cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {violations.map((entry) => (
                        <Cell key={entry.type} fill={VIOLATION_COLORS[entry.type] ?? "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <CheckCircle className="w-8 h-8 text-green-500/50" />
                  </motion.div>
                  <p>No violations recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-primary" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Live Activity</CardTitle>
                <motion.span
                  className="ml-auto relative flex h-1.5 w-1.5"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </motion.span>
                <span className="text-[9px] font-mono text-muted-foreground">auto-refresh</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
                {activityLoading ? (
                  <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : activity && activity.length > 0 ? (
                  activity.map((itm, i) => (
                    <motion.div
                      key={itm.id}
                      initial={{ opacity: 0, x: 12, backgroundColor: "hsl(var(--primary) / 0.08)" }}
                      animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                      transition={{ delay: i * 0.05 + 0.3, backgroundColor: { delay: i * 0.05 + 1.2, duration: 1 } }}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <Badge variant="secondary" className={`text-[9px] px-1.5 shrink-0 mt-0.5 ${activityBadgeClass(itm.type)}`}>
                        {itm.type.replace(/_/g, " ")}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{itm.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{timeAgo(itm.timestamp)}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <Zap className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    No activity yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions strip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-primary/50" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/exams/new", label: "Create Exam", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20" },
            { href: "/admin/users", label: "Manage Users", icon: Users, color: "text-violet-400", bg: "bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/20" },
            { href: "/students", label: "Monitor", icon: Eye, color: "text-green-400", bg: "bg-green-500/5 hover:bg-green-500/10 border-green-500/20" },
            { href: "/admin/analytics", label: "Analytics", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20" },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <motion.div
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 + i * 0.07 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${action.bg}`}
                >
                  <Icon className={`w-4 h-4 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
