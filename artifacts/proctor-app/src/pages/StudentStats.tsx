import { useListMyEnrollments, getListMyEnrollmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, AlertTriangle, BookOpen, Target, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  enrolled: "#6366f1",
  active: "#22c55e",
  submitted: "#8b5cf6",
  flagged: "#f59e0b",
  disqualified: "#ef4444",
};

const STATUS_STYLES: Record<string, string> = {
  enrolled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  submitted: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  flagged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  disqualified: "bg-red-500/10 text-red-400 border-red-500/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function StatCard({ label, value, sub, icon: Icon, colorClass }: { label: string; value: string | number; sub?: string; icon: React.ElementType; colorClass: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-1.5">{label}</p>
            <motion.p
              className="text-3xl font-bold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {value}
            </motion.p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentStats() {
  const { data: enrollments, isLoading } = useListMyEnrollments({ query: { queryKey: getListMyEnrollmentsQueryKey() } });

  const all = enrollments ?? [];
  const submitted = all.filter(e => e.status === "submitted");
  const active = all.filter(e => e.status === "active");
  const flagged = all.filter(e => e.status === "flagged");
  const totalViolations = all.reduce((s, e) => s + (e.violationCount ?? 0), 0);
  const completionRate = all.length > 0 ? Math.round((submitted.length / all.length) * 100) : 0;

  const statusBreakdown = Object.entries(
    all.reduce<Record<string, number>>((acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([label, count]) => ({ label, count })).filter(s => s.count > 0);

  const violationByExam = all
    .filter(e => (e.violationCount ?? 0) > 0)
    .map(e => ({
      name: (e.exam?.title ?? `Exam #${e.examId}`).substring(0, 14),
      violations: e.violationCount ?? 0,
    }))
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 8);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6" data-testid="student-stats-page">
      {/* Header */}
      <motion.div variants={item}>
        <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// Academic Performance</div>
        <h1 className="text-2xl font-bold">My Performance</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Track your exam progress, completion rates, and proctoring history</p>
      </motion.div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Exams" value={all.length} icon={BookOpen} colorClass="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
          <StatCard label="Completed" value={submitted.length} sub={`${active.length} in progress`} icon={CheckCircle} colorClass="bg-green-500/10 text-green-400 border border-green-500/20" />
          <StatCard label="Completion" value={`${completionRate}%`} sub={`${all.length - submitted.length} remaining`} icon={Target} colorClass="bg-violet-500/10 text-violet-400 border border-violet-500/20" />
          <StatCard label="Violations" value={totalViolations} sub={totalViolations === 0 ? "Clean record!" : `Across ${all.length} exams`} icon={AlertTriangle} colorClass="bg-amber-500/10 text-amber-400 border border-amber-500/20" />
        </motion.div>
      )}

      {/* Completion ring */}
      {!isLoading && all.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-border/60 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            <CardContent className="p-6 flex items-center gap-6">
              <div className="relative shrink-0">
                <svg width="80" height="80" className="-rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                  <motion.circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - completionRate / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-primary">{completionRate}%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Overall Progress</p>
                <p className="text-2xl font-bold">{submitted.length}/{all.length} exams completed</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {flagged.length > 0 ? `${flagged.length} exam${flagged.length > 1 ? "s" : ""} flagged for review` :
                   completionRate >= 80 ? "Excellent completion rate!" :
                   completionRate >= 50 ? "Good progress, keep it up!" : "Keep working on your exams"}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {completionRate >= 60 ? (
                    <><TrendingUp className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">On track</span></>
                  ) : (
                    <><Clock className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-amber-400">Exams pending</span></>
                  )}
                </div>
              </div>
              {/* Mini summary */}
              <div className="hidden sm:grid grid-cols-2 gap-2 shrink-0">
                {statusBreakdown.map(s => (
                  <div key={s.label} className="text-center px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                    <p className="text-base font-bold">{s.count}</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground capitalize">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status breakdown chart */}
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-primary" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Exam Status Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-44" /> : statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={statusBreakdown} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.label} fill={STATUS_COLORS[entry.label] ?? "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <BookOpen className="w-8 h-8 opacity-20" />
                  <p>No enrollment data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Violations by exam */}
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-amber-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Violations by Exam</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-44" /> : violationByExam.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={violationByExam} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="violations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <CheckCircle className="w-8 h-8 text-green-500/40" />
                  <p>No violations recorded!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent exam history */}
      {!isLoading && all.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-green-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Exam History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {[...all].reverse().slice(0, 10).map((e, i) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.4 }}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        e.status === "submitted" ? "bg-violet-500/10" :
                        e.status === "active" ? "bg-green-500/10" :
                        e.status === "flagged" ? "bg-amber-500/10" : "bg-blue-500/10"
                      }`}>
                        {e.status === "submitted" ? <Trophy className="w-4 h-4 text-violet-400" /> :
                         e.status === "active" ? <Clock className="w-4 h-4 text-green-400" /> :
                         e.status === "flagged" ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                         <BookOpen className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.exam?.title ?? `Exam #${e.examId}`}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {e.submittedAt ? `Submitted ${new Date(e.submittedAt).toLocaleDateString()}` :
                           e.startedAt ? `Started ${new Date(e.startedAt).toLocaleDateString()}` :
                           `Enrolled ${new Date(e.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {(e.violationCount ?? 0) > 0 && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{e.violationCount}
                        </span>
                      )}
                      {e.exam?.duration && (
                        <span className="text-[10px] text-muted-foreground font-mono">{e.exam.duration}m</span>
                      )}
                      <Badge variant="secondary" className={`text-[9px] border ${STATUS_STYLES[e.status] ?? "bg-muted text-muted-foreground"}`}>
                        {e.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Clean record badge */}
      {!isLoading && totalViolations === 0 && all.length > 0 && (
        <motion.div variants={item} className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-green-400 text-sm">Perfect Integrity Record</p>
            <p className="text-xs text-muted-foreground">No violations detected across all your exam sessions. Excellent academic conduct!</p>
          </div>
        </motion.div>
      )}

      {!isLoading && all.length === 0 && (
        <motion.div variants={item} className="py-20 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No exams yet — enroll in an exam to start tracking your performance</p>
        </motion.div>
      )}
    </motion.div>
  );
}
