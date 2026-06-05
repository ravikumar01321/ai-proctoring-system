import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetExam, getGetExamQueryKey, useListExamEnrollments, getListExamEnrollmentsQueryKey, useListViolations, getListViolationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, User, Clock, RefreshCw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  enrolled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  submitted: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  flagged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  disqualified: "bg-red-500/10 text-red-400 border-red-500/20",
};

function timeSince(dt: string | null | undefined) {
  if (!dt) return null;
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function StudentCard({ enrollment }: { enrollment: { id: number; status: string; user?: { name?: string; email?: string } | null; violationCount?: number; startedAt?: string | null } }) {
  const { data: violations } = useListViolations(enrollment.id, { query: { queryKey: getListViolationsQueryKey(enrollment.id) } });
  const lastViolation = violations?.[violations.length - 1];

  return (
    <Card
      className={`border transition-all ${enrollment.status === "flagged" ? "border-amber-500/40 shadow-amber-500/5 shadow-md" : enrollment.status === "disqualified" ? "border-red-500/40" : "border-border"}`}
      data-testid={`card-student-${enrollment.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {enrollment.user?.name?.substring(0, 2).toUpperCase() ?? <User className="w-3.5 h-3.5" />}
            </div>
            <div>
              <p className="text-sm font-medium">{enrollment.user?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{enrollment.user?.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className={`text-[10px] border ${STATUS_COLORS[enrollment.status] ?? ""}`}>
            {enrollment.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {enrollment.startedAt ? timeSince(enrollment.startedAt) : "Not started"}
          </span>
          <span className={`flex items-center gap-1 font-medium ${(enrollment.violationCount ?? 0) > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
            <AlertTriangle className="w-3 h-3" />
            {enrollment.violationCount ?? 0} violations
          </span>
        </div>
        {lastViolation && (
          <div className="mt-2 px-2 py-1.5 rounded bg-muted/50 text-[10px] text-muted-foreground">
            Last: {lastViolation.type.replace(/_/g, " ")} · {lastViolation.severity}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExamMonitor() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: exam, isLoading: examLoading } = useGetExam(id, { query: { enabled: !!id, queryKey: getGetExamQueryKey(id) } });
  const { data: enrollments, isLoading: enrollmentsLoading } = useListExamEnrollments(id, { query: { enabled: !!id, queryKey: getListExamEnrollmentsQueryKey(id) } });

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListExamEnrollmentsQueryKey(id) });
    }, 5000);
    return () => clearInterval(interval);
  }, [id, queryClient]);

  const active = enrollments?.filter((e) => e.status === "active") ?? [];
  const flagged = enrollments?.filter((e) => e.status === "flagged") ?? [];
  const submitted = enrollments?.filter((e) => e.status === "submitted") ?? [];

  return (
    <div className="space-y-6" data-testid="exam-monitor-page">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/exams/${id}`)} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{examLoading ? "Loading..." : exam?.title}</h1>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">Live proctoring monitor — auto-refreshes every 5s</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: getListExamEnrollmentsQueryKey(id) })} data-testid="button-refresh">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", count: active.length, color: "text-green-400" },
          { label: "Flagged", count: flagged.length, color: "text-amber-400" },
          { label: "Submitted", count: submitted.length, color: "text-violet-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flagged section */}
      {flagged.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged Students
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {flagged.map((e) => <StudentCard key={e.id} enrollment={e} />)}
          </div>
        </div>
      )}

      {/* Active students */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Active Sessions ({active.length})
        </h2>
        {enrollmentsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : active.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">No active sessions</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.map((e) => <StudentCard key={e.id} enrollment={e} />)}
          </div>
        )}
      </div>

      {/* Submitted */}
      {submitted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Submitted ({submitted.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {submitted.map((e) => <StudentCard key={e.id} enrollment={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}
