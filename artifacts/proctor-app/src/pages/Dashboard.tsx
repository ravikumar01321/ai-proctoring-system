import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetViolationSummary, getGetViolationSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Shield, Users, BookOpen, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

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
  { key: "totalExams", label: "Total Exams", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { key: "activeExams", label: "Active Exams", icon: Activity, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  { key: "totalStudents", label: "Total Students", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { key: "totalProctors", label: "Proctors", icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { key: "ongoingSessions", label: "Live Sessions", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { key: "flaggedSessions", label: "Flagged", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { key: "completedToday", label: "Completed Today", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { key: "averagePassRate", label: "Avg Pass Rate", icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", suffix: "%" },
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

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: violations, isLoading: violationsLoading } = useGetViolationSummary({ query: { queryKey: getGetViolationSummaryQueryKey() } });

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase">// Live Overview</span>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Real-time overview of all active proctoring sessions</p>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : STATS_CONFIG.map((cfg) => {
              const raw = (stats as Record<string, number> | undefined)?.[cfg.key] ?? 0;
              const value = cfg.suffix ? `${raw}${cfg.suffix}` : raw;
              const Icon = cfg.icon;
              return (
                <motion.div key={cfg.key} variants={item}>
                  <Card className={`border ${cfg.border} hover:scale-[1.02] transition-transform duration-200`} data-testid={`stat-${cfg.key}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-2">{cfg.label}</p>
                          <motion.p
                            className="text-3xl font-bold text-foreground"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                          >
                            {value}
                          </motion.p>
                        </div>
                        <div className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </motion.div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Violation chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
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
                  <BarChart data={violations} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <XAxis dataKey="type" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.replace(/_/g, " ").substring(0, 8)} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                      labelFormatter={(v) => String(v).replace(/_/g, " ")}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {violations.map((entry) => (
                        <Cell key={entry.type} fill={VIOLATION_COLORS[entry.type] ?? "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <CheckCircle className="w-8 h-8 text-green-500/50" />
                  <p>No violations recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-primary" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Recent Activity</CardTitle>
                <span className="ml-auto relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto">
                {activityLoading ? (
                  <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : activity && activity.length > 0 ? (
                  activity.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.3 }}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
                      data-testid={`activity-${item.id}`}
                    >
                      <Badge variant="secondary" className={`text-[9px] px-1.5 shrink-0 mt-0.5 ${activityBadgeClass(item.type)}`}>
                        {item.type.replace(/_/g, " ")}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">{item.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{timeAgo(item.timestamp)}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground text-sm">No activity yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
