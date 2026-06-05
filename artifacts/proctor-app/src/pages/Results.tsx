import { useParams, useLocation } from "wouter";
import { useGetResult, getGetResultQueryKey, useGetEnrollment, getGetEnrollmentQueryKey, useListViolations, getListViolationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Trophy } from "lucide-react";

const VIOLATION_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

export default function Results() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = parseInt(params.enrollmentId, 10);
  const [, setLocation] = useLocation();

  const { data: result, isLoading: resultLoading } = useGetResult(enrollmentId, { query: { queryKey: getGetResultQueryKey(enrollmentId) } });
  const { data: enrollment } = useGetEnrollment(enrollmentId, { query: { queryKey: getGetEnrollmentQueryKey(enrollmentId) } });
  const { data: violations } = useListViolations(enrollmentId, { query: { queryKey: getListViolationsQueryKey(enrollmentId) } });

  if (resultLoading) return <div className="p-8 max-w-2xl mx-auto space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!result) return <div className="p-8 text-muted-foreground text-center">Results not available yet</div>;

  const percentage = Math.round(result.percentage);
  const passed = result.passed;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6" data-testid="results-page">
      <Button variant="ghost" onClick={() => setLocation("/my-exams")} className="flex items-center gap-2" data-testid="button-back">
        <ArrowLeft className="w-4 h-4" /> Back to My Exams
      </Button>

      {/* Score hero */}
      <Card className={`border-2 ${passed ? "border-green-500/30" : "border-red-500/30"}`}>
        <CardContent className="p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {passed ? <Trophy className="w-10 h-10 text-green-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <h1 className="text-4xl font-bold mb-1">{percentage}%</h1>
          <p className="text-muted-foreground mb-3">{enrollment?.exam?.title ?? "Exam"}</p>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="secondary" className={`text-base px-4 py-1.5 ${passed ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {passed ? "PASSED" : "FAILED"}
            </Badge>
            {result.grade && (
              <Badge variant="secondary" className="text-base px-4 py-1.5 bg-muted text-foreground">
                Grade: {result.grade}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Score", value: `${result.totalScore}/${result.maxScore}` },
          { label: "Percentage", value: `${percentage}%` },
          { label: "Violations", value: result.violationCount },
          { label: "Passing Score", value: `${enrollment?.exam?.passingScore ?? 60}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Violations log */}
      {violations && violations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Violation Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3" data-testid={`violation-${v.id}`}>
                  <div>
                    <p className="text-sm font-medium">{v.type.replace(/_/g, " ")}</p>
                    {v.details && <p className="text-xs text-muted-foreground">{v.details}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] ${VIOLATION_COLORS[v.severity]}`}>{v.severity}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <div className={`p-4 rounded-lg border flex items-start gap-3 ${passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
        {passed ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
        <div>
          <p className={`font-medium ${passed ? "text-green-400" : "text-red-400"}`}>{passed ? "Congratulations!" : "Exam not passed"}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {passed
              ? `You achieved ${percentage}% which meets the required ${enrollment?.exam?.passingScore ?? 60}% passing score.`
              : `You achieved ${percentage}% which is below the required ${enrollment?.exam?.passingScore ?? 60}% passing score.`}
          </p>
        </div>
      </div>
    </div>
  );
}
