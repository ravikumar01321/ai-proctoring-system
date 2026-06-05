import { useLocation } from "wouter";
import { useListMyEnrollments, getListMyEnrollmentsQueryKey, useListExams, getListExamsQueryKey, useEnrollInExam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, ArrowRight, Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  enrolled: "bg-blue-500/10 text-blue-400",
  active: "bg-green-500/10 text-green-400",
  submitted: "bg-violet-500/10 text-violet-400",
  flagged: "bg-amber-500/10 text-amber-400",
  disqualified: "bg-red-500/10 text-red-400",
};

const EXAM_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-400",
  active: "bg-green-500/10 text-green-400",
  completed: "bg-violet-500/10 text-violet-400",
  cancelled: "bg-red-500/10 text-red-400",
};

export default function MyExams() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading: enrollmentsLoading } = useListMyEnrollments({ query: { queryKey: getListMyEnrollmentsQueryKey() } });
  const { data: allExams, isLoading: examsLoading } = useListExams({}, { query: { queryKey: getListExamsQueryKey() } });
  const enrollMutation = useEnrollInExam();

  const myExamIds = new Set((enrollments ?? []).map((e) => e.examId));
  const availableExams = (allExams ?? []).filter((e) => !myExamIds.has(e.id) && (e.status === "active" || e.status === "scheduled"));

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

  const handleTakeExam = (enrollmentId: number, status: string) => {
    if (status === "submitted") {
      setLocation(`/results/${enrollmentId}`);
    } else {
      setLocation(`/exam/${enrollmentId}/take`);
    }
  };

  return (
    <div className="space-y-8" data-testid="my-exams-page">
      <div>
        <h1 className="text-2xl font-bold">My Exams</h1>
        <p className="text-muted-foreground text-sm mt-1">Your enrolled examinations and available sessions</p>
      </div>

      {/* My enrollments */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">My Enrollments</h2>
        {enrollmentsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (enrollments ?? []).length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>You haven&apos;t enrolled in any exams yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(enrollments ?? []).map((enrollment) => (
              <Card key={enrollment.id} data-testid={`card-enrollment-${enrollment.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-foreground truncate">{enrollment.exam?.title ?? "Exam"}</h3>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${STATUS_COLORS[enrollment.status]}`}>
                          {enrollment.status}
                        </Badge>
                      </div>
                      {enrollment.exam?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{enrollment.exam.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{enrollment.exam?.duration ?? 0} min</span>
                        {(enrollment.violationCount ?? 0) > 0 && (
                          <span className="text-amber-400">{enrollment.violationCount} violations</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={enrollment.status === "submitted" ? "outline" : "default"}
                      onClick={() => handleTakeExam(enrollment.id, enrollment.status)}
                      data-testid={`button-take-exam-${enrollment.id}`}
                      disabled={enrollment.status === "flagged" || enrollment.status === "disqualified"}
                    >
                      {enrollment.status === "submitted" ? "View Results" :
                       enrollment.status === "active" ? "Continue" :
                       enrollment.status === "flagged" ? "Flagged" :
                       enrollment.status === "disqualified" ? "Disqualified" : "Start Exam"}
                      {enrollment.status !== "flagged" && enrollment.status !== "disqualified" && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available exams */}
      {availableExams.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Available to Enroll</h2>
          <div className="space-y-3">
            {examsLoading ? <Skeleton className="h-24" /> : availableExams.map((exam) => (
              <Card key={exam.id} data-testid={`card-available-exam-${exam.id}`} className="border-dashed">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{exam.title}</h3>
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${EXAM_STATUS_COLORS[exam.status]}`}>{exam.status}</Badge>
                    </div>
                    {exam.description && <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{exam.description}</p>}
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{exam.duration} min</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleEnroll(exam.id)} disabled={enrollMutation.isPending} data-testid={`button-enroll-${exam.id}`}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Enroll
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
