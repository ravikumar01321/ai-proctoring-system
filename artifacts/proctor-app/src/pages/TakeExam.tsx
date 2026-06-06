import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetEnrollment, getGetEnrollmentQueryKey,
  useListQuestions, getListQuestionsQueryKey,
  useListAnswers, getListAnswersQueryKey,
  useSubmitAnswer,
  useReportViolation,
  useStartExam,
  useSubmitExam,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function captureWebcamFrame(videoEl: HTMLVideoElement | null): string | undefined {
  if (!videoEl || videoEl.readyState < 2) return undefined;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6);
  } catch {
    return undefined;
  }
}

export default function TakeExam() {
  const params = useParams<{ enrollmentId: string }>();
  const enrollmentId = parseInt(params.enrollmentId, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);

  const { data: enrollment, isLoading: enrollmentLoading } = useGetEnrollment(enrollmentId, { query: { queryKey: getGetEnrollmentQueryKey(enrollmentId) } });
  const { data: questions } = useListQuestions(enrollment?.examId ?? 0, {
    query: { enabled: !!enrollment?.examId, queryKey: getListQuestionsQueryKey(enrollment?.examId ?? 0) },
  });
  const { data: savedAnswers } = useListAnswers(enrollmentId, { query: { queryKey: getListAnswersQueryKey(enrollmentId) } });

  const startExamMutation = useStartExam();
  const submitExamMutation = useSubmitExam();
  const submitAnswerMutation = useSubmitAnswer();
  const reportViolationMutation = useReportViolation();

  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (savedAnswers) {
      const map: Record<number, string> = {};
      savedAnswers.forEach((a) => { if (a.answer) map[a.questionId] = a.answer; });
      setLocalAnswers(map);
    }
  }, [savedAnswers]);

  const reportViolation = useCallback((type: string, severity: string, details: string) => {
    setViolationCount((c) => c + 1);
    const screenshotData = captureWebcamFrame(videoRef.current);
    reportViolationMutation.mutate({
      id: enrollmentId,
      data: {
        type: type as "tab_switch" | "fullscreen_exit" | "copy_paste" | "face_missing" | "multiple_faces" | "eye_deviation" | "audio_detected" | "phone_detected",
        severity: severity as "low" | "medium" | "high" | "critical",
        details,
        ...(screenshotData ? { screenshotData } : {}),
      },
    });
    toast({ title: "⚠ Violation detected", description: details, variant: "destructive" });
  }, [enrollmentId, reportViolationMutation, toast]);

  // Timer
  useEffect(() => {
    if (!enrollment?.exam?.duration || !examStarted) return;
    const startedAt = enrollment.startedAt ? new Date(enrollment.startedAt).getTime() : Date.now();
    const endAt = startedAt + enrollment.exam.duration * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) { clearInterval(interval); handleSubmit(); }
    }, 1000);
    setTimeLeft(Math.max(0, Math.floor((endAt - Date.now()) / 1000)));
    return () => clearInterval(interval);
  }, [enrollment, examStarted]);

  // Webcam
  useEffect(() => {
    if (!examStarted) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => setCamError(true));
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [examStarted]);

  // Violation detections
  useEffect(() => {
    if (!examStarted) return;
    const onVisibility = () => {
      if (document.hidden) reportViolation("tab_switch", "high", "Student switched to another tab or window");
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) reportViolation("fullscreen_exit", "high", "Student exited fullscreen mode");
    };
    const onCopy = () => reportViolation("copy_paste", "medium", "Student attempted to copy content");
    const onPaste = () => reportViolation("copy_paste", "medium", "Student attempted to paste content");
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [examStarted, reportViolation]);

  // Periodic AI scan: face + phone detection simulation via canvas analysis
  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || camError) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 60;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        // Detect darkness (face missing — very dark frame = no one in front)
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        if (avgBrightness < 15) {
          reportViolation("face_missing", "high", "No face detected in webcam feed — student may have stepped away");
        }
      } catch {
        // ignore canvas errors
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [examStarted, camError, reportViolation]);

  const handleStart = () => {
    startExamMutation.mutate({ id: enrollmentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEnrollmentQueryKey(enrollmentId) });
        setExamStarted(true);
        document.documentElement.requestFullscreen().catch(() => {});
      },
    });
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: answer }));
    submitAnswerMutation.mutate({ id: enrollmentId, data: { questionId, answer } });
  };

  const handleSubmit = () => {
    submitExamMutation.mutate({ id: enrollmentId }, {
      onSuccess: () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setLocation(`/results/${enrollmentId}`);
      },
    });
  };

  if (enrollmentLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (!enrollment) return <div className="p-8 text-muted-foreground">Enrollment not found</div>;
  if (enrollment.status === "submitted") { setLocation(`/results/${enrollmentId}`); return null; }

  // Pre-start screen
  if (!examStarted && enrollment.status !== "active") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8" data-testid="exam-prestart">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">{enrollment.exam?.title}</h1>
            <p className="text-muted-foreground text-sm">{enrollment.exam?.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { label: "Duration", value: `${enrollment.exam?.duration} minutes` },
              { label: "Passing Score", value: `${enrollment.exam?.passingScore}%` },
              { label: "Max Violations", value: enrollment.exam?.maxViolations },
              { label: "Questions", value: questions?.length ?? 0 },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-card border border-border">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400 text-left space-y-1">
            <p className="font-semibold">Before you begin:</p>
            <p>Webcam access is required for proctoring. Do not switch tabs, exit fullscreen, or copy/paste content. Screenshots are captured automatically when violations are detected.</p>
          </div>
          <Button className="w-full" size="lg" onClick={handleStart} disabled={startExamMutation.isPending} data-testid="button-start-exam">
            {startExamMutation.isPending ? "Starting..." : "Begin Exam"}
          </Button>
        </div>
      </div>
    );
  }

  const question = questions?.[currentQ];
  const options = question?.options ? (() => { try { return JSON.parse(question.options!); } catch { return []; } })() : [];
  const answered = Object.keys(localAnswers).length;
  const total = questions?.length ?? 0;
  const timerDanger = timeLeft < 300;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="exam-taking-page">
      {/* Top bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{enrollment.exam?.title}</span>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-[10px]">Live</Badge>
        </div>
        <div className="flex items-center gap-4">
          {violationCount > 0 && (
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {violationCount}
            </Badge>
          )}
          <span className={`font-mono font-bold text-lg ${timerDanger ? "text-destructive animate-pulse" : "text-foreground"}`} data-testid="timer">
            {formatTime(timeLeft)}
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-submit">Submit Exam</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit exam?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have answered {answered} of {total} questions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue exam</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={submitExamMutation.isPending}>
                  {submitExamMutation.isPending ? "Submitting..." : "Submit Now"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Webcam sidebar */}
        <div className="w-56 border-r border-border bg-card shrink-0 flex flex-col p-3 gap-3">
          <div className="rounded-lg overflow-hidden bg-black aspect-video relative">
            {camError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1">
                <Camera className="w-5 h-5" />
                <span>No camera</span>
              </div>
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            )}
            <div className="absolute top-1.5 right-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Progress</p>
            <Progress value={(answered / Math.max(total, 1)) * 100} className="h-1.5 mb-1" />
            <p>{answered}/{total} answered</p>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {questions?.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded transition-colors flex items-center gap-2 ${i === currentQ ? "bg-primary text-primary-foreground" : localAnswers[q.id] ? "bg-green-500/10 text-green-400" : "hover:bg-muted text-muted-foreground"}`}
                data-testid={`nav-question-${i + 1}`}
              >
                {localAnswers[q.id] && i !== currentQ ? <CheckCircle className="w-2.5 h-2.5 shrink-0" /> : <span className="w-2.5" />}
                Q{i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            {question ? (
              <div className="max-w-2xl" data-testid="question-panel">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-[10px]">Q {currentQ + 1} of {total}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{question.type.replace(/_/g, " ")}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{question.points} pts</Badge>
                </div>
                <p className="text-lg font-medium text-foreground mb-6 leading-relaxed">{question.content}</p>

                {/* MCQ / True-False options */}
                {options.length > 0 && (
                  <div className="space-y-2">
                    {options.map((opt: string) => {
                      const selected = localAnswers[question.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswerSelect(question.id, opt)}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/40 text-foreground"}`}
                          data-testid={`option-${opt}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short answer */}
                {question.type === "short_answer" && (
                  <textarea
                    value={localAnswers[question.id] ?? ""}
                    onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                    rows={4}
                    placeholder="Type your answer..."
                    className="w-full rounded-lg border border-border bg-card p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    data-testid="input-short-answer"
                  />
                )}
              </div>
            ) : (
              <Skeleton className="h-64 max-w-2xl" />
            )}
          </div>

          {/* Navigation */}
          <div className="border-t border-border bg-card p-4 flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={() => setCurrentQ((c) => Math.max(0, c - 1))} disabled={currentQ === 0} data-testid="button-prev">
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">{currentQ + 1} / {total}</span>
            <Button onClick={() => setCurrentQ((c) => Math.min(total - 1, c + 1))} disabled={currentQ === total - 1} data-testid="button-next">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
