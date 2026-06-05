import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListExams, getListExamsQueryKey, useDeleteExam } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Clock, Trash2, Eye, BarChart2, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted/60 text-muted-foreground border-muted",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  completed: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatDate(dt: string | null | undefined) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardItem = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[9px] font-mono tracking-[0.25em] text-primary uppercase mb-1">// Examination Registry</div>
          <h1 className="text-2xl font-bold text-foreground">Exams</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage and monitor all proctored examinations</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={() => setLocation("/exams/new")} data-testid="button-create-exam">
            <Plus className="w-4 h-4 mr-2" /> New Exam
          </Button>
        </motion.div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-card border-border/70 focus:border-primary/60"
          data-testid="input-search"
        />
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center text-muted-foreground">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No exams found</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <AnimatePresence>
            {filtered.map((exam) => (
              <motion.div key={exam.id} variants={cardItem} layout exit={{ opacity: 0, y: -12 }}>
                <Card className="hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-border/60" data-testid={`card-exam-${exam.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h2 className="font-semibold text-foreground truncate">{exam.title}</h2>
                          <Badge variant="secondary" className={`text-[9px] shrink-0 border ${STATUS_STYLES[exam.status]}`}>
                            {exam.status}
                          </Badge>
                        </div>
                        {exam.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{exam.description}</p>
                        )}
                        <div className="flex items-center gap-5 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{exam.duration} min</span>
                          <span>Pass {exam.passingScore}%</span>
                          {exam.startTime && <span>Starts {formatDate(exam.startTime)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="sm" onClick={() => setLocation(`/exams/${exam.id}`)} data-testid={`button-view-exam-${exam.id}`} className="h-8 text-xs">
                            <Eye className="w-3 h-3 mr-1.5" /> View
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="sm" onClick={() => setLocation(`/exams/${exam.id}/monitor`)} data-testid={`button-monitor-exam-${exam.id}`} className="h-8 text-xs">
                            <Monitor className="w-3 h-3 mr-1.5" /> Monitor
                          </Button>
                        </motion.div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive h-8 w-8 p-0" data-testid={`button-delete-exam-${exam.id}`}>
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
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
