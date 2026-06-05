import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateExam, getListExamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxViolations: z.coerce.number().min(1).default(3),
  passingScore: z.coerce.number().min(0).max(100).default(60),
});
type ExamForm = z.infer<typeof examSchema>;

export default function NewExam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createExam = useCreateExam();

  const form = useForm<ExamForm>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      maxViolations: 3,
      passingScore: 60,
    },
  });

  const onSubmit = (data: ExamForm) => {
    createExam.mutate({ data }, {
      onSuccess: (exam) => {
        queryClient.invalidateQueries({ queryKey: getListExamsQueryKey() });
        toast({ title: "Exam created", description: `"${exam.title}" is ready.` });
        setLocation(`/exams/${exam.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create exam.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6" data-testid="new-exam-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/exams")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Exam</h1>
          <p className="text-muted-foreground text-sm">Configure a proctored examination session</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Exam Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Title</FormLabel>
                  <FormControl><Input placeholder="e.g. Advanced Mathematics — Midterm" data-testid="input-title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl><Textarea placeholder="Topics covered, instructions for students..." rows={3} data-testid="input-description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl><Input type="number" min={1} data-testid="input-duration" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="passingScore" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl><Input type="number" min={0} max={100} data-testid="input-passing-score" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl><Input type="datetime-local" data-testid="input-start-time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time <span className="text-muted-foreground">(optional)</span></FormLabel>
                    <FormControl><Input type="datetime-local" data-testid="input-end-time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="maxViolations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Violations Before Flag</FormLabel>
                  <FormControl><Input type="number" min={1} max={20} data-testid="input-max-violations" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setLocation("/exams")}>Cancel</Button>
                <Button type="submit" disabled={createExam.isPending} data-testid="button-submit-exam">
                  {createExam.isPending ? "Creating..." : "Create Exam"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
