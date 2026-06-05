import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetExam, getGetExamQueryKey,
  useListQuestions, getListQuestionsQueryKey,
  useCreateQuestion, useDeleteQuestion,
  useListExamEnrollments, getListExamEnrollmentsQueryKey,
  useGetExamStats, getGetExamStatsQueryKey,
  useUpdateExam, getListExamsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Users, Activity, CheckCircle, AlertTriangle, Monitor } from "lucide-react";
import { useForm } from "react-hook-form";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-400",
  active: "bg-green-500/10 text-green-400",
  completed: "bg-violet-500/10 text-violet-400",
  cancelled: "bg-red-500/10 text-red-400",
};

const ENROLLMENT_COLORS: Record<string, string> = {
  enrolled: "bg-blue-500/10 text-blue-400",
  active: "bg-green-500/10 text-green-400",
  submitted: "bg-violet-500/10 text-violet-400",
  flagged: "bg-amber-500/10 text-amber-400",
  disqualified: "bg-red-500/10 text-red-400",
};

export default function ExamDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState<"questions" | "students" | "stats">("questions");

  const { data: exam, isLoading: examLoading } = useGetExam(id, { query: { enabled: !!id, queryKey: getGetExamQueryKey(id) } });
  const { data: questions, isLoading: questionsLoading } = useListQuestions(id, { query: { enabled: !!id, queryKey: getListQuestionsQueryKey(id) } });
  const { data: enrollments } = useListExamEnrollments(id, { query: { enabled: !!id, queryKey: getListExamEnrollmentsQueryKey(id) } });
  const { data: stats } = useGetExamStats(id, { query: { enabled: !!id, queryKey: getGetExamStatsQueryKey(id) } });
  const createQuestion = useCreateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const updateExam = useUpdateExam();

  const form = useForm({
    defaultValues: { type: "mcq" as "mcq" | "true_false" | "short_answer", content: "", options: "", correctAnswer: "", points: 5 },
  });

  const handleAddQuestion = (data: { type: "mcq" | "true_false" | "short_answer"; content: string; options: string; correctAnswer: string; points: number }) => {
    const optionsJson = data.type !== "short_answer" && data.options
      ? JSON.stringify(data.options.split("\n").map((o) => o.trim()).filter(Boolean))
      : undefined;
    createQuestion.mutate({
      id,
      data: { type: data.type, content: data.content, options: optionsJson, correctAnswer: data.correctAnswer, points: data.points },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey(id) });
        setShowAddQuestion(false);
        form.reset();
        toast({ title: "Question added" });
      },
    });
  };

  const handleDeleteQuestion = (qid: number) => {
    deleteQuestion.mutate({ id: qid }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey(id) });
        toast({ title: "Question deleted" });
      },
    });
  };

  const handleActivate = () => {
    updateExam.mutate({ id, data: { status: "active" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExamQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
        toast({ title: "Exam activated" });
      },
    });
  };

  if (examLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!exam) return <div className="text-muted-foreground">Exam not found</div>;

  return (
    <div className="space-y-6" data-testid="exam-detail-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/exams")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <Badge variant="secondary" className={STATUS_COLORS[exam.status]}>{exam.status}</Badge>
          </div>
          {exam.description && <p className="text-muted-foreground text-sm mt-1">{exam.description}</p>}
        </div>
        <div className="flex gap-2">
          {exam.status === "draft" && (
            <Button size="sm" onClick={handleActivate} data-testid="button-activate">Activate Exam</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setLocation(`/exams/${id}/monitor`)} data-testid="button-monitor">
            <Monitor className="w-3.5 h-3.5 mr-1.5" /> Monitor
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Duration", value: `${exam.duration} min`, icon: Activity },
          { label: "Enrolled", value: stats?.totalEnrolled ?? 0, icon: Users },
          { label: "Completed", value: stats?.totalCompleted ?? 0, icon: CheckCircle },
          { label: "Flagged", value: stats?.totalFlagged ?? 0, icon: AlertTriangle },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-semibold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {(["questions", "students", "stats"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Questions tab */}
      {activeTab === "questions" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{questions?.length ?? 0} questions</p>
            <Button size="sm" onClick={() => setShowAddQuestion(true)} data-testid="button-add-question">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Question
            </Button>
          </div>
          {questionsLoading ? <Skeleton className="h-40" /> : questions?.map((q, i) => (
            <Card key={q.id} data-testid={`card-question-${q.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{q.type.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{q.points} pts</span>
                    </div>
                    <p className="text-sm text-foreground">{q.content}</p>
                    {q.options && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {JSON.parse(q.options).map((opt: string) => (
                          <span key={opt} className={`text-xs px-2 py-0.5 rounded border ${opt === q.correctAnswer ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-border bg-muted/50 text-muted-foreground"}`}>
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => handleDeleteQuestion(q.id)} data-testid={`button-delete-question-${q.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!questionsLoading && questions?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No questions yet. Add the first one.</div>
          )}
        </div>
      )}

      {/* Students tab */}
      {activeTab === "students" && (
        <div className="space-y-2">
          {enrollments?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No students enrolled</div>
          ) : enrollments?.map((e) => (
            <Card key={e.id} data-testid={`card-enrollment-${e.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {e.user?.name?.substring(0, 2).toUpperCase() ?? "??"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{e.user?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{e.user?.email}</p>
                </div>
                <Badge variant="secondary" className={ENROLLMENT_COLORS[e.status]}>{e.status}</Badge>
                <div className="text-xs text-muted-foreground">{e.violationCount} violations</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats tab */}
      {activeTab === "stats" && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Pass Rate", value: `${stats.passRate}%` },
            { label: "Avg Score", value: `${stats.averageScore}%` },
            { label: "Total Violations", value: stats.violationCount },
            { label: "Enrolled", value: stats.totalEnrolled },
            { label: "Completed", value: stats.totalCompleted },
            { label: "Flagged", value: stats.totalFlagged },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Question Dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Question</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(handleAddQuestion)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as "mcq" | "true_false" | "short_answer")}>
                <SelectTrigger className="mt-1.5" data-testid="select-question-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True / False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Question</label>
              <Textarea className="mt-1.5" rows={3} placeholder="Enter the question..." data-testid="input-question-content" {...form.register("content")} />
            </div>
            {form.watch("type") !== "short_answer" && (
              <div>
                <label className="text-sm font-medium">Options <span className="text-muted-foreground">(one per line)</span></label>
                <Textarea className="mt-1.5" rows={4} placeholder={"Option A\nOption B\nOption C\nOption D"} data-testid="input-options" {...form.register("options")} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Correct Answer</label>
                <Input className="mt-1.5" placeholder="Exact match string" data-testid="input-correct-answer" {...form.register("correctAnswer")} />
              </div>
              <div>
                <label className="text-sm font-medium">Points</label>
                <Input type="number" min={1} className="mt-1.5" data-testid="input-points" {...form.register("points", { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddQuestion(false)}>Cancel</Button>
              <Button type="submit" disabled={createQuestion.isPending} data-testid="button-save-question">
                {createQuestion.isPending ? "Saving..." : "Add Question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
