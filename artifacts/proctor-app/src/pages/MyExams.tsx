import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListMyEnrollments, getListMyEnrollmentsQueryKey, useListExams, getListExamsQueryKey, useEnrollInExam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, ArrowRight, Plus, Trophy, AlertTriangle, Zap, CheckCircle, XCircle, Play } from "lucide-react";

const ENROLL_STYLES: Record<string, string> = {
  enrolled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  submitted: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  flagged: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  disqualified: "bg-red-500/10 text-red-400 border-red-500/20",
};

const EXAM_STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function MiniRing({ value, total, color = "#6366f1" }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={40} height={40} style={{ transform: "rotate(-90deg)" }} className="shrink-0">
      <circle cx={20} cy={20} r={r} stroke="hsl(var(--border))" strokeWidth={4} fill="none" />
      <motion.circle
        cx={20} cy={20} r={r}
        stroke={color} strokeWidth={4} fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

function CountdownTimer({ targetMs }: { targetMs: number }) {
  const [left, setLeft] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  if (left <= 0) return <span className="text-green-400 font-mono text-xs">Available now</span>;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className="font-mono text-xs text-amber-400 tabular-nums">
      {h > 0 ? `${h}h ` : ""}{m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
    </span>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function MyExams() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading: enrollmentsLoading } = useListMyEnrollments({ query: { queryKey: getListMyEnrollmentsQueryKey() } });
  const { data: allExams, isLoading: examsLoading } = useListExams({}, { query: { queryKey: getListExamsQueryKey() } });
  const enrollMutation = useEnrollInExam();

  const myExamIds = new Set((enrollments ?? []).map((e) => e.examId));
  const availableExams = (allExams ?? []).filter((e) => !myExamIds.has(e.id) && (e.status === "active" || e.status === "scheduled"));

  const activeEnrollment = (enrollments ?? []).find((e) => e.status === "active");
  const submitted = (enrollments ?? []).filter((e) => e.status === "submitted").length;
  const total = (enrollments ?? []).length;
  const flagged = (enrollments ?? []).filter((e) => e.status === "flagged" || e.status === "disqualified").length;

  const handleEnroll = (examId: number) => {
    enrollMutation.mutate({ id: examId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMyEnrollmentsQueryKey() });
        toast({ title: "Enrolled", description: "You have been enrolled in the exam." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not enroll in this exam.", variant: "destructive" });
      },
    });
  };

  const handleAction = (enrollmentId: number, status: string) => {
    if (status === "submitted") {
      setLocation(`/results/${enrollmentId}`);
    } else {
      setLocation(`/exam/${enrollmentId}/take`);
    }
  };

  return (
    <div className="space-y-8" data-testid="my-exams-page">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// Student Portal</div>
        <h1 className="text-2xl font-bold">My Exams</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your enrolled examinations and available sessions</p>
      </motion.div>

      {/* Stats strip */}
      {!enrollmentsLoading && total > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Enrolled", value: total, icon: BookOpen, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5" },
              { label: "Completed", value: submitted, icon: CheckCircle, color: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/5" },
              { label: "Flagged", value: flagged, icon: AlertTriangle, color: flagged > 0 ? "text-amber-400" : "text-muted-foreground", border: flagged > 0 ? "border-amber-500/20" : "border-border/50", bg: flagged > 0 ? "bg-amber-500/5" : "" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.06 }}>
                  <Card className={`border ${s.border} ${s.bg}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                      <div>
                        <p className="text-2xl font-black tabular-nums">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Active exam hero — sticky CTA */}
      <AnimatePresence>
        {activeEnrollment && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative z-10 flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0"
                  animate={{ boxShadow: ["0 0 0 0 hsl(var(--primary) / 0.3)", "0 0 0 8px hsl(var(--primary) / 0)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-6 h-6 text-primary" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-mono tracking-widest text-primary uppercase">// In Progress</span>
                    <motion.span
                      className="relative flex h-1.5 w-1.5"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </motion.span>
                  </div>
                  <p className="font-bold text-base truncate">{activeEnrollment.exam?.title ?? "Active Exam"}</p>
                  <p className="text-xs text-muted-foreground">{activeEnrollment.exam?.duration} min · Resume where you left off</p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => handleAction(activeEnrollment.id, activeEnrollment.status)}
                    className="gap-2 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" /> Resume Exam
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enrollments */}
      <div>
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground">My Enrollments</h2>
          {total > 0 && <span className="text-[9px] font-mono text-muted-foreground ml-auto">{total} total</span>}
        </motion.div>

        {enrollmentsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (enrollments ?? []).length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>You haven&apos;t enrolled in any exams yet</p>
            {availableExams.length > 0 && <p className="text-xs mt-1 text-primary">↓ {availableExams.length} exams available below</p>}
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {(enrollments ?? []).map((enrollment) => {
              const isActive = enrollment.status === "active";
              const isSubmitted = enrollment.status === "submitted";
              const isBad = enrollment.status === "flagged" || enrollment.status === "disqualified";
              return (
                <motion.div
                  key={enrollment.id}
                  variants={item}
                  whileHover={!isBad ? { x: 2 } : {}}
                >
                  <Card
                    className={`border transition-all ${isActive ? "border-primary/40 shadow-sm shadow-primary/10" : isBad ? "border-red-500/20" : "hover:border-primary/25 border-border/60"}`}
                    data-testid={`card-enrollment-${enrollment.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        {/* Progress ring */}
                        <div className="relative">
                          <MiniRing
                            value={isSubmitted ? 1 : isActive ? 1 : 0}
                            total={1}
                            color={isSubmitted ? "#22c55e" : isActive ? "#6366f1" : isBad ? "#ef4444" : "#64748b"}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isSubmitted ? <CheckCircle className="w-3 h-3 text-green-400" /> :
                             isActive ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><Zap className="w-3 h-3 text-primary" /></motion.div> :
                             isBad ? <XCircle className="w-3 h-3 text-red-400" /> :
                             <Clock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate text-sm">{enrollment.exam?.title ?? "Exam"}</h3>
                            <Badge variant="secondary" className={`text-[9px] shrink-0 border ${ENROLL_STYLES[enrollment.status]}`}>
                              {enrollment.status}
                            </Badge>
                          </div>
                          {enrollment.exam?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{enrollment.exam.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{enrollment.exam?.duration ?? 0} min</span>
                            <span>Pass: {enrollment.exam?.passingScore ?? 60}%</span>
                            {(enrollment.violationCount ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-3 h-3" />{enrollment.violationCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            size="sm"
                            variant={isSubmitted ? "outline" : "default"}
                            onClick={() => handleAction(enrollment.id, enrollment.status)}
                            data-testid={`button-take-exam-${enrollment.id}`}
                            disabled={isBad}
                            className={`h-9 text-xs gap-1.5 ${isActive ? "shadow-sm shadow-primary/20" : ""}`}
                          >
                            {isSubmitted ? <><Trophy className="w-3 h-3" /> Results</> :
                             isActive ? <><Play className="w-3 h-3 fill-current" /> Resume</> :
                             enrollment.status === "flagged" ? "Flagged" :
                             enrollment.status === "disqualified" ? "Disqualified" :
                             <>Start <ArrowRight className="w-3 h-3" /></>}
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Available exams */}
      {availableExams.length > 0 && (
        <div>
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-primary/50" />
            <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Available to Enroll</h2>
            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">{availableExams.length}</span>
          </motion.div>
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {examsLoading ? <Skeleton className="h-24 rounded-xl" /> : availableExams.map((exam) => (
              <motion.div key={exam.id} variants={item} whileHover={{ x: 2 }}>
                <Card className="border-dashed border-border/60 hover:border-primary/30 transition-all" data-testid={`card-available-exam-${exam.id}`}>
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{exam.title}</h3>
                          <Badge variant="secondary" className={`text-[9px] shrink-0 border ${EXAM_STATUS_STYLES[exam.status]}`}>{exam.status}</Badge>
                        </div>
                        {exam.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{exam.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration} min</span>
                          <span>Pass: {exam.passingScore}%</span>
                          <span>Max {exam.maxViolations} violations</span>
                        </div>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button size="sm" variant="outline" onClick={() => handleEnroll(exam.id)} disabled={enrollMutation.isPending} data-testid={`button-enroll-${exam.id}`} className="h-9 text-xs gap-1.5">
                        <Plus className="w-3 h-3" /> Enroll
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
