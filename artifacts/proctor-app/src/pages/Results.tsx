import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetResult, getGetResultQueryKey, useGetEnrollment, getGetEnrollmentQueryKey, useListViolations, getListViolationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Trophy, Camera } from "lucide-react";
import { animate } from "framer-motion";

const VIOLATION_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
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

function AnimatedScore({ to }: { to: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (v) => setVal(Math.round(v)) });
    return ctrl.stop;
  }, [to]);
  return <>{val}</>;
}

function CircularProgress({ percentage, passed }: { percentage: number; passed: boolean }) {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = passed ? "#22c55e" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-5xl font-black tabular-nums ${passed ? "text-green-400" : "text-red-400"}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
        >
          <AnimatedScore to={percentage} />
        </motion.span>
        <span className="text-sm text-muted-foreground font-mono">%</span>
      </div>
    </div>
  );
}

type ViolationItem = {
  id: number;
  type: string;
  severity: string;
  details?: string | null;
  screenshotData?: string | null;
  timestamp: string;
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

export default function Results() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = parseInt(params.enrollmentId, 10);
  const [, setLocation] = useLocation();
  const [lightbox, setLightbox] = useState<ViolationItem | null>(null);

  const { data: result, isLoading: resultLoading } = useGetResult(enrollmentId, { query: { queryKey: getGetResultQueryKey(enrollmentId) } });
  const { data: enrollment } = useGetEnrollment(enrollmentId, { query: { queryKey: getGetEnrollmentQueryKey(enrollmentId) } });
  const { data: violations } = useListViolations(enrollmentId, { query: { queryKey: getListViolationsQueryKey(enrollmentId) } });

  const typedViolations = (violations as ViolationItem[] | undefined) ?? [];
  const screenshotViolations = typedViolations.filter((v) => v.screenshotData);

  if (resultLoading) return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  );

  if (!result) return (
    <div className="p-8 text-muted-foreground text-center">
      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p>Results not available yet</p>
    </div>
  );

  const percentage = Math.round(result.percentage);
  const passed = result.passed;

  return (
    <>
      {/* Screenshot lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => { if (!o) setLightbox(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-amber-400" />
              Violation Capture — {lightbox ? TYPE_LABELS[lightbox.type] ?? lightbox.type : ""}
              <Badge variant="secondary" className={`ml-auto text-[10px] border ${VIOLATION_COLORS[lightbox?.severity ?? "low"]}`}>
                {lightbox?.severity}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {lightbox?.screenshotData && (
            <div className="space-y-3">
              <img src={lightbox.screenshotData} alt="Violation capture" className="w-full rounded-lg border border-border max-h-80 object-contain" />
              <div className="text-xs text-muted-foreground p-3 rounded bg-muted/50 space-y-1">
                {lightbox.details && <p><span className="text-foreground font-medium">Details:</span> {lightbox.details}</p>}
                <p><span className="text-foreground font-medium">Time:</span> {new Date(lightbox.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto p-4 sm:p-8 space-y-5" data-testid="results-page">
        <motion.div variants={item}>
          <Button variant="ghost" onClick={() => setLocation("/my-exams")} className="flex items-center gap-2 text-sm mb-2 -ml-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" /> Back to My Exams
          </Button>
        </motion.div>

        {/* Score hero */}
        <motion.div variants={item}>
          <Card className={`border-2 relative overflow-hidden ${passed ? "border-green-500/30" : "border-red-500/30"}`}>
            <motion.div
              className={`absolute inset-0 blur-3xl pointer-events-none ${passed ? "bg-green-500/5" : "bg-red-500/5"}`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            {/* Scan line */}
            <motion.div
              className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <CircularProgress percentage={percentage} passed={passed} />
                <div className="text-center sm:text-left flex-1">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-muted-foreground text-sm mb-3">{enrollment?.exam?.title ?? "Exam"}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                      <Badge variant="secondary" className={`text-base px-5 py-1.5 border font-black ${passed ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                        {passed ? "✓ PASSED" : "✗ FAILED"}
                      </Badge>
                      {result.grade && (
                        <Badge variant="secondary" className="text-base px-4 py-1.5 border font-bold">
                          Grade {result.grade}
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${passed ? "text-green-400/80" : "text-red-400/80"}`}>
                      {passed
                        ? `Achieved ${percentage}% — above the ${enrollment?.exam?.passingScore ?? 60}% passing threshold`
                        : `Achieved ${percentage}% — below the ${enrollment?.exam?.passingScore ?? 60}% required to pass`}
                    </p>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail grid */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Raw Score", value: `${result.totalScore}/${result.maxScore}` },
            { label: "Percentage", value: `${percentage}%` },
            { label: "Violations", value: result.violationCount ?? 0 },
            { label: "Passing Score", value: `${enrollment?.exam?.passingScore ?? 60}%` },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
              <Card className="border-border/60 hover:border-border transition-colors">
                <CardContent className="p-4 text-center">
                  <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-xl font-bold tabular-nums">{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Screenshot captures gallery */}
        <AnimatePresence>
          {screenshotViolations.length > 0 && (
            <motion.div variants={item}>
              <Card className="border-amber-500/20 bg-amber-500/3">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-amber-500" />
                    <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      Violation Captures ({screenshotViolations.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {screenshotViolations.map((v, i) => (
                      <motion.button
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 + 0.4 }}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        onClick={() => setLightbox(v)}
                        className="relative rounded-lg overflow-hidden border border-amber-500/20 hover:border-amber-400/60 transition-all aspect-video group"
                      >
                        <img src={v.screenshotData!} alt="capture" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                          <p className="text-[8px] text-white/80 font-mono leading-none truncate">{TYPE_LABELS[v.type] ?? v.type}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Click any capture to view full-size</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Violations log */}
        {typedViolations.length > 0 && (
          <motion.div variants={item}>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-amber-500" />
                  <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Violation Log ({typedViolations.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                  {typedViolations.map((v, i) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.5 }}
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                      data-testid={`violation-${v.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {v.screenshotData && (
                          <button
                            onClick={() => setLightbox(v)}
                            className="rounded overflow-hidden border border-amber-500/20 hover:border-amber-400 transition shrink-0"
                            style={{ width: 36, height: 27 }}
                          >
                            <img src={v.screenshotData} alt="" className="w-full h-full object-cover" />
                          </button>
                        )}
                        <div>
                          <p className="text-sm font-medium">{TYPE_LABELS[v.type] ?? v.type.replace(/_/g, " ")}</p>
                          {v.details && <p className="text-xs text-muted-foreground">{v.details}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-[9px] border ${VIOLATION_COLORS[v.severity]}`}>{v.severity}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Outcome */}
        <motion.div variants={item} className={`p-5 rounded-xl border flex items-start gap-3 ${passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.8 }}
          >
            {passed
              ? <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
              : <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
          </motion.div>
          <div>
            <p className={`font-bold ${passed ? "text-green-400" : "text-red-400"}`}>{passed ? "Congratulations!" : "Exam not passed"}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {passed
                ? `You achieved ${percentage}%, meeting the required ${enrollment?.exam?.passingScore ?? 60}% passing score.`
                : `You achieved ${percentage}%, below the required ${enrollment?.exam?.passingScore ?? 60}% passing score. Try again.`}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
