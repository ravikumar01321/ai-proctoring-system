import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useListMyEnrollments, getListMyEnrollmentsQueryKey, useListExams, getListExamsQueryKey, useEnrollInExam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, ArrowRight, Plus, Trophy, AlertTriangle } from "lucide-react";

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
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// Student Portal</div>
        <h1 className="text-2xl font-bold">My Exams</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your enrolled examinations and available sessions</p>
      </motion.div>

      {/* Enrollments */}
      <div>
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground">My Enrollments</h2>
        </motion.div>

        {enrollmentsLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (enrollments ?? []).length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>You haven&apos;t enrolled in any exams yet</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {(enrollments ?? []).map((enrollment) => (
              <motion.div key={enrollment.id} variants={item}>
                <Card className="hover:border-primary/30 transition-all border-border/60" data-testid={`card-enrollment-${enrollment.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold truncate">{enrollment.exam?.title ?? "Exam"}</h3>
                          <Badge variant="secondary" className={`text-[9px] shrink-0 border ${ENROLL_STYLES[enrollment.status]}`}>
                            {enrollment.status}
                          </Badge>
                        </div>
                        {enrollment.exam?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{enrollment.exam.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{enrollment.exam?.duration ?? 0} min</span>
                          {(enrollment.violationCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="w-3 h-3" />{enrollment.violationCount} violations
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          size="sm"
                          variant={enrollment.status === "submitted" ? "outline" : "default"}
                          onClick={() => handleAction(enrollment.id, enrollment.status)}
                          data-testid={`button-take-exam-${enrollment.id}`}
                          disabled={enrollment.status === "flagged" || enrollment.status === "disqualified"}
                          className="h-8 text-xs"
                        >
                          {enrollment.status === "submitted" ? <><Trophy className="w-3 h-3 mr-1.5" /> Results</> :
                           enrollment.status === "active" ? <>Continue <ArrowRight className="w-3 h-3 ml-1.5" /></> :
                           enrollment.status === "flagged" ? "Flagged" :
                           enrollment.status === "disqualified" ? "Disqualified" :
                           <>Start <ArrowRight className="w-3 h-3 ml-1.5" /></>}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Available exams */}
      {availableExams.length > 0 && (
        <div>
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-primary/50" />
            <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Available to Enroll</h2>
          </motion.div>
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {examsLoading ? <Skeleton className="h-24 rounded-xl" /> : availableExams.map((exam) => (
              <motion.div key={exam.id} variants={item}>
                <Card className="border-dashed border-border/60 hover:border-primary/30 transition-all" data-testid={`card-available-exam-${exam.id}`}>
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{exam.title}</h3>
                        <Badge variant="secondary" className={`text-[9px] shrink-0 border ${EXAM_STATUS_STYLES[exam.status]}`}>{exam.status}</Badge>
                      </div>
                      {exam.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{exam.description}</p>}
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5"><Clock className="w-3 h-3" />{exam.duration} min</span>
                    </div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button size="sm" variant="outline" onClick={() => handleEnroll(exam.id)} disabled={enrollMutation.isPending} data-testid={`button-enroll-${exam.id}`} className="h-8 text-xs">
                        <Plus className="w-3 h-3 mr-1.5" /> Enroll
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
