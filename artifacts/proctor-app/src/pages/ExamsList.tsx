import { useState } from "react";
import { useLocation } from "wouter";
import { useListExams, getListExamsQueryKey, useDeleteExam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Clock, Users, Trash2, Eye, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-400",
  active: "bg-green-500/10 text-green-400",
  completed: "bg-violet-500/10 text-violet-400",
  cancelled: "bg-red-500/10 text-red-400",
};

function formatDate(dt: string | null | undefined) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ExamsList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: exams, isLoading } = useListExams({}, { query: { queryKey: getListExamsQueryKey() } });
  const deleteMutation = useDeleteExam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filtered = (exams ?? []).filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number, title: string) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
        toast({ title: "Exam deleted", description: `"${title}" has been removed.` });
      },
    });
  };

  return (
    <div className="space-y-6" data-testid="exams-list-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and monitor all exams</p>
        </div>
        <Button onClick={() => setLocation("/exams/new")} data-testid="button-create-exam">
          <Plus className="w-4 h-4 mr-2" /> New Exam
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No exams found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exam) => (
            <Card key={exam.id} data-testid={`card-exam-${exam.id}`} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-foreground truncate">{exam.title}</h2>
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${STATUS_COLORS[exam.status]}`}>
                        {exam.status}
                      </Badge>
                    </div>
                    {exam.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{exam.duration} min</span>
                      <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />Pass {exam.passingScore}%</span>
                      {exam.startTime && <span>Starts {formatDate(exam.startTime)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/exams/${exam.id}`)} data-testid={`button-view-exam-${exam.id}`}>
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/exams/${exam.id}/monitor`)} data-testid={`button-monitor-exam-${exam.id}`}>
                      Monitor
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" data-testid={`button-delete-exam-${exam.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete exam?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete "{exam.title}" and all associated data.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(exam.id, exam.title)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
