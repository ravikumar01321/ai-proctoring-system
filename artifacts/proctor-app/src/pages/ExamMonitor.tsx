import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetExam, getGetExamQueryKey, useListExamEnrollments, getListExamEnrollmentsQueryKey, useListViolations, getListViolationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, AlertTriangle, User, Clock, RefreshCw, Camera, X } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  enrolled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  submitted: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  flagged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  disqualified: "bg-red-500/10 text-red-400 border-red-500/20",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

const TYPE_LABELS: Record<string, string> = {
  tab_switch: "Tab Switch",
  fullscreen_exit: "Fullscreen Exit",
  copy_paste: "Copy/Paste",
  face_missing: "Face Missing",
  multiple_faces: "Multiple Faces",
  eye_deviation: "Eye Deviation",
  audio_detected: "Audio Detected",
  phone_detected: "Phone Detected",
};

function timeSince(dt: string | null | undefined) {
  if (!dt) return null;
  const m = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

type ViolationItem = {
  id: number;
  enrollmentId: number;
  type: string;
  severity: string;
  details?: string | null;
  screenshotData?: string | null;
  timestamp: string;
};

function ScreenshotThumb({ src, onClick }: { src: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded overflow-hidden border border-amber-500/30 hover:border-amber-400/60 transition-all group shrink-0"
      style={{ width: 56, height: 42 }}
      title="Click to view screenshot"
    >
      <img src={src} alt="violation screenshot" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Camera className="w-3 h-3 text-white" />
      </div>
    </button>
  );
}

function StudentCard({
  enrollment,
  onViewScreenshot,
}: {
  enrollment: { id: number; status: string; user?: { name?: string; email?: string } | null; violationCount?: number; startedAt?: string | null };
  onViewScreenshot: (v: ViolationItem) => void;
}) {
  const { data: violations } = useListViolations(enrollment.id, {
    query: { queryKey: getListViolationsQueryKey(enrollment.id), refetchInterval: 5000 },
  });
  const lastViolation = violations?.[violations.length - 1] as ViolationItem | undefined;
  const screenshotViolations = (violations as ViolationItem[] | undefined)?.filter((v) => v.screenshotData) ?? [];

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
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
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
          <div className="mt-1 px-2 py-1.5 rounded bg-muted/50 text-[10px] text-muted-foreground flex items-center justify-between gap-2">
            <span>Last: {TYPE_LABELS[lastViolation.type] ?? lastViolation.type} · {lastViolation.severity}</span>
            <span className="text-[9px] opacity-60">{timeSince(lastViolation.timestamp)}</span>
          </div>
        )}

        {/* Screenshot thumbnails row */}
        {screenshotViolations.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Captures:</span>
            {screenshotViolations.slice(-4).map((v) => (
              <ScreenshotThumb
                key={v.id}
                src={v.screenshotData!}
                onClick={() => onViewScreenshot(v)}
              />
            ))}
            {screenshotViolations.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{screenshotViolations.length - 4} more</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ViolationFeedRow({ v, onView }: { v: ViolationItem; onView: () => void }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-widest shrink-0 ${SEVERITY_COLORS[v.severity] ?? ""}`}>
        {v.severity}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{TYPE_LABELS[v.type] ?? v.type}</p>
        {v.details && <p className="text-[10px] text-muted-foreground truncate">{v.details}</p>}
        <p className="text-[9px] text-muted-foreground/60">{timeSince(v.timestamp)}</p>
      </div>
      {v.screenshotData && (
        <button
          onClick={onView}
          className="shrink-0 rounded overflow-hidden border border-amber-500/30 hover:border-amber-400 transition-all"
          style={{ width: 48, height: 36 }}
          title="View capture"
        >
          <img src={v.screenshotData} alt="capture" className="w-full h-full object-cover" />
        </button>
      )}
    </div>
  );
}

function ViolationFeed({
  enrollmentId,
  studentName,
  onViewScreenshot,
}: {
  enrollmentId: number;
  studentName: string;
  onViewScreenshot: (v: ViolationItem) => void;
}) {
  const { data: violations } = useListViolations(enrollmentId, {
    query: { queryKey: getListViolationsQueryKey(enrollmentId), refetchInterval: 5000 },
  });
  const items = (violations as ViolationItem[] | undefined) ?? [];
  if (items.length === 0) return null;
  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{studentName} — Violation Log</p>
      <div className="max-h-40 overflow-y-auto space-y-0">
        {[...items].reverse().map((v) => (
          <ViolationFeedRow key={v.id} v={v} onView={() => onViewScreenshot(v)} />
        ))}
      </div>
    </div>
  );
}

export default function ExamMonitor() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [lightbox, setLightbox] = useState<ViolationItem | null>(null);
  const [expandedEnrollment, setExpandedEnrollment] = useState<number | null>(null);

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
      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => { if (!o) setLightbox(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-amber-400" />
              Violation Capture — {lightbox ? TYPE_LABELS[lightbox.type] ?? lightbox.type : ""}
              <Badge variant="secondary" className={`ml-auto text-[10px] ${SEVERITY_COLORS[lightbox?.severity ?? "low"]}`}>
                {lightbox?.severity}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {lightbox?.screenshotData && (
            <div className="space-y-3">
              <img
                src={lightbox.screenshotData}
                alt="Violation screenshot"
                className="w-full rounded-lg border border-border object-contain max-h-96"
              />
              <div className="text-xs text-muted-foreground space-y-1 p-3 rounded bg-muted/50">
                {lightbox.details && <p><span className="text-foreground font-medium">Details:</span> {lightbox.details}</p>}
                <p><span className="text-foreground font-medium">Time:</span> {new Date(lightbox.timestamp).toLocaleString()}</p>
                <p><span className="text-foreground font-medium">Enrollment ID:</span> {lightbox.enrollmentId}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <p className="text-muted-foreground text-sm">Live proctoring monitor — auto-refreshes every 5s · Screenshots captured on violations</p>
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
            {flagged.map((e) => (
              <div key={e.id}>
                <StudentCard enrollment={e} onViewScreenshot={setLightbox} />
                <button
                  onClick={() => setExpandedEnrollment(expandedEnrollment === e.id ? null : e.id)}
                  className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  {expandedEnrollment === e.id ? "▲ Hide violation log" : "▼ Show violation log"}
                </button>
                {expandedEnrollment === e.id && (
                  <ViolationFeed enrollmentId={e.id} studentName={e.user?.name ?? "Student"} onViewScreenshot={setLightbox} />
                )}
              </div>
            ))}
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
            {active.map((e) => (
              <div key={e.id}>
                <StudentCard enrollment={e} onViewScreenshot={setLightbox} />
                <button
                  onClick={() => setExpandedEnrollment(expandedEnrollment === e.id ? null : e.id)}
                  className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  {expandedEnrollment === e.id ? "▲ Hide violation log" : "▼ Show violation log"}
                </button>
                {expandedEnrollment === e.id && (
                  <ViolationFeed enrollmentId={e.id} studentName={e.user?.name ?? "Student"} onViewScreenshot={setLightbox} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submitted */}
      {submitted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Submitted ({submitted.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {submitted.map((e) => (
              <div key={e.id}>
                <StudentCard enrollment={e} onViewScreenshot={setLightbox} />
                {(e.violationCount ?? 0) > 0 && (
                  <>
                    <button
                      onClick={() => setExpandedEnrollment(expandedEnrollment === e.id ? null : e.id)}
                      className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                    >
                      {expandedEnrollment === e.id ? "▲ Hide violation log" : "▼ Show violation log"}
                    </button>
                    {expandedEnrollment === e.id && (
                      <ViolationFeed enrollmentId={e.id} studentName={e.user?.name ?? "Student"} onViewScreenshot={setLightbox} />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
