import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetResult, getGetResultQueryKey, useGetEnrollment, getGetEnrollmentQueryKey, useListViolations, getListViolationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Trophy } from "lucide-react";

const VIOLATION_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

export default function Results() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = parseInt(params.enrollmentId, 10);
  const [, setLocation] = useLocation();

  const { data: result, isLoading: resultLoading } = useGetResult(enrollmentId, { query: { queryKey: getGetResultQueryKey(enrollmentId) } });
  const { data: enrollment } = useGetEnrollment(enrollmentId, { query: { queryKey: getGetEnrollmentQueryKey(enrollmentId) } });
  const { data: violations } = useListViolations(enrollmentId, { query: { queryKey: getListViolationsQueryKey(enrollmentId) } });

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
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto p-4 sm:p-8 space-y-5" data-testid="results-page">
      <motion.div variants={item}>
        <Button variant="ghost" onClick={() => setLocation("/my-exams")} className="flex items-center gap-2 text-sm mb-2 -ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4" /> Back to My Exams
        </Button>
      </motion.div>

      {/* Score hero */}
      <motion.div variants={item}>
        <Card className={`border-2 relative overflow-hidden ${passed ? "border-green-500/30" : "border-red-500/30"}`}>
          {/* Background glow */}
          <motion.div
            className={`absolute inset-0 blur-3xl pointer-events-none ${passed ? "bg-green-500/5" : "bg-red-500/5"}`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <CardContent className="p-8 text-center relative z-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${passed ? "bg-green-500/15 border border-green-500/30" : "bg-red-500/15 border border-red-500/30"}`}
            >
              {passed ? <Trophy className="w-9 h-9 text-green-400" /> : <XCircle className="w-9 h-9 text-red-400" />}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", delay: 0.35 }}
              className="text-6xl font-black mb-2"
            >
              {percentage}%
            </motion.div>
            <p className="text-muted-foreground text-sm mb-4">{enrollment?.exam?.title ?? "Exam"}</p>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="secondary" className={`text-sm px-5 py-1.5 border font-bold ${passed ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>
                {passed ? "PASSED" : "FAILED"}
              </Badge>
              {result.grade && (
                <Badge variant="secondary" className="text-sm px-4 py-1.5 border">Grade: {result.grade}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail grid */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Score", value: `${result.totalScore}/${result.maxScore}` },
          { label: "Percentage", value: `${percentage}%` },
          { label: "Violations", value: result.violationCount },
          { label: "Passing Score", value: `${enrollment?.exam?.passingScore ?? 60}%` },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Violations log */}
      {violations && violations.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-amber-500" />
                <CardTitle className="text-xs font-mono tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Violation Log
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {violations.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.5 }}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
                    data-testid={`violation-${v.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{v.type.replace(/_/g, " ")}</p>
                      {v.details && <p className="text-xs text-muted-foreground">{v.details}</p>}
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
      <motion.div variants={item} className={`p-4 rounded-xl border flex items-start gap-3 ${passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
        {passed
          ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
        <div>
          <p className={`font-semibold ${passed ? "text-green-400" : "text-red-400"}`}>{passed ? "Congratulations!" : "Exam not passed"}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {passed
              ? `You achieved ${percentage}%, meeting the required ${enrollment?.exam?.passingScore ?? 60}% passing score.`
              : `You achieved ${percentage}%, below the required ${enrollment?.exam?.passingScore ?? 60}% passing score.`}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
