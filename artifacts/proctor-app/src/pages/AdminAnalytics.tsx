import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetViolationSummary, getGetViolationSummaryQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useListExams, getListExamsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { TrendingUp, AlertTriangle, Shield, BarChart2, Users, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { animate } from "framer-motion";

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

const PIE_COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4"];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, value, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return ctrl.stop;
  }, [value]);
  return <span>{display}{suffix}</span>;
}

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 },
  cursor: { fill: "hsl(var(--muted) / 0.4)" },
};

export default function AdminAnalytics() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: violations, isLoading: violationsLoading } = useGetViolationSummary({ query: { queryKey: getGetViolationSummaryQueryKey() } });
  const { data: activity } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: exams } = useListExams({}, { query: { queryKey: getListExamsQueryKey() } });

  const s = stats as Record<string, number> | undefined;

  // Build exam status distribution for pie
  const examStatusData = exams ? [
    { name: "Active", value: exams.filter((e) => e.status === "active").length },
    { name: "Completed", value: exams.filter((e) => e.status === "completed").length },
    { name: "Scheduled", value: exams.filter((e) => e.status === "scheduled").length },
    { name: "Draft", value: exams.filter((e) => e.status === "draft").length },
    { name: "Cancelled", value: exams.filter((e) => e.status === "cancelled").length },
  ].filter((d) => d.value > 0) : [];

  // Build activity type counts
  const activityTypeCounts = activity ? Object.entries(
    activity.reduce((acc, item) => { acc[item.type] = (acc[item.type] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })) : [];

  // Radar data for system health
  const radarData = [
    { subject: "Pass Rate", value: s?.averagePassRate ?? 0, fullMark: 100 },
    { subject: "Active Sessions", value: Math.min((s?.ongoingSessions ?? 0) * 10, 100), fullMark: 100 },
    { subject: "Exam Coverage", value: Math.min((s?.activeExams ?? 0) * 20, 100), fullMark: 100 },
    { subject: "Student Reach", value: Math.min((s?.totalStudents ?? 0) * 5, 100), fullMark: 100 },
    { subject: "Integrity Score", value: Math.max(100 - (s?.flaggedSessions ?? 0) * 5, 0), fullMark: 100 },
  ];

  // Simulated trend data based on real stats
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i];
    return {
      day,
      sessions: Math.round(((s?.ongoingSessions ?? 1) + i) * (0.6 + Math.random() * 0.8)),
      violations: Math.round((violations?.reduce((a, v) => a + v.count, 0) ?? 2) * (0.4 + Math.random() * 0.6) / 7),
    };
  });

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

  return (
    <div className="space-y-8" data-testid="analytics-page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase">// Analytics Engine</span>
        </div>
        <h1 className="text-2xl font-bold">System Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Deep insights into exam performance, violations, and system health</p>
      </motion.div>

      {/* KPI strip */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
        [
          { label: "Exams", value: s?.totalExams ?? 0, icon: BarChart2, color: "text-blue-400" },
          { label: "Students", value: s?.totalStudents ?? 0, icon: Users, color: "text-violet-400" },
          { label: "Live Now", value: s?.ongoingSessions ?? 0, icon: Shield, color: "text-green-400" },
          { label: "Flagged", value: s?.flaggedSessions ?? 0, icon: AlertTriangle, color: "text-red-400" },
          { label: "Pass Rate", value: s?.averagePassRate ?? 0, icon: Award, color: "text-indigo-400", suffix: "%" },
          { label: "Today", value: s?.completedToday ?? 0, icon: TrendingUp, color: "text-emerald-400" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={item} whileHover={{ y: -2 }}>
              <Card className="border-border/60 hover:border-border transition-all">
                <CardContent className="p-4">
                  <Icon className={`w-4 h-4 ${kpi.color} mb-2`} />
                  <p className="text-2xl font-black tabular-nums"><AnimatedCounter value={kpi.value} suffix={kpi.suffix} /></p>
                  <p className="text-[9px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Weekly trend + Violation breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Area trend chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-primary" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Weekly Session Trend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="violationsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="sessions" stroke="#6366f1" fill="url(#sessionsGrad)" strokeWidth={2} name="Sessions" dot={false} />
                  <Area type="monotone" dataKey="violations" stroke="#f59e0b" fill="url(#violationsGrad)" strokeWidth={2} name="Violations" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 px-1">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2.5 h-0.5 rounded bg-primary inline-block" /> Sessions</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2.5 h-0.5 rounded bg-amber-400 inline-block" /> Violations</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Violation bar chart */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-amber-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Violation Types</CardTitle>
                {violations && violations.length > 0 && (
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                    {violations.reduce((a, v) => a + v.count, 0)} total
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {violationsLoading ? <Skeleton className="h-52" /> : violations && violations.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={violations} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barSize={14}>
                    <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="type" type="category" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: string) => v.replace(/_/g, " ")} width={80} />
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} labelFormatter={(v: string) => v.replace(/_/g, " ")} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {violations.map((entry) => (
                        <Cell key={entry.type} fill={VIOLATION_COLORS[entry.type] ?? "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No violations recorded</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pie + Radar row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Exam status pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-violet-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Exam Status Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {examStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={examStatusData}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {examStatusData.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No exam data</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar system health */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-cyan-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">System Health Radar</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border) / 0.5)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Radar name="System" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity type chart */}
      {activityTypeCounts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-emerald-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Activity Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={activityTypeCounts} margin={{ top: 0, right: 8, left: -28, bottom: 0 }} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1">
                    {activityTypeCounts.map((_, i) => (
                      <Cell key={i} fill={["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
