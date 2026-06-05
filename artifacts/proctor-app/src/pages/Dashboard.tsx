import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetViolationSummary, getGetViolationSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Shield; color: string }) {
  return (
    <Card data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function activityTypeColor(type: string) {
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

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  const { data: violations, isLoading: violationsLoading } = useGetViolationSummary({ query: { queryKey: getGetViolationSummaryQueryKey() } });

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time overview of all active proctoring sessions</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />) : <>
          <StatCard label="Total Exams" value={stats?.totalExams ?? 0} icon={BookOpen} color="bg-blue-500/10 text-blue-400" />
          <StatCard label="Active Exams" value={stats?.activeExams ?? 0} icon={Activity} color="bg-green-500/10 text-green-400" />
          <StatCard label="Total Students" value={stats?.totalStudents ?? 0} icon={Users} color="bg-violet-500/10 text-violet-400" />
          <StatCard label="Proctors" value={stats?.totalProctors ?? 0} icon={Shield} color="bg-cyan-500/10 text-cyan-400" />
          <StatCard label="Live Sessions" value={stats?.ongoingSessions ?? 0} icon={Clock} color="bg-amber-500/10 text-amber-400" />
          <StatCard label="Flagged" value={stats?.flaggedSessions ?? 0} icon={AlertTriangle} color="bg-red-500/10 text-red-400" />
          <StatCard label="Completed Today" value={stats?.completedToday ?? 0} icon={CheckCircle} color="bg-emerald-500/10 text-emerald-400" />
          <StatCard label="Avg Pass Rate" value={`${stats?.averagePassRate ?? 0}%`} icon={TrendingUp} color="bg-indigo-500/10 text-indigo-400" />
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violation chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Violation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {violationsLoading ? <Skeleton className="h-48" /> : violations && violations.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={violations} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="type" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v.replace(/_/g, " ")} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
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
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No violations recorded yet</div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {activityLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : activity && activity.length > 0 ? activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3" data-testid={`activity-${item.id}`}>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 shrink-0 mt-0.5 ${activityTypeColor(item.type)}`}>
                    {item.type.replace(/_/g, " ")}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-muted-foreground text-sm">No activity yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
