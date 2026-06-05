import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import ExamsList from "@/pages/ExamsList";
import NewExam from "@/pages/NewExam";
import ExamDetail from "@/pages/ExamDetail";
import ExamMonitor from "@/pages/ExamMonitor";
import Students from "@/pages/Students";
import AdminUsers from "@/pages/AdminUsers";
import MyExams from "@/pages/MyExams";
import TakeExam from "@/pages/TakeExam";
import Results from "@/pages/Results";
import Profile from "@/pages/Profile";
import StudentStats from "@/pages/StudentStats";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;
  if (user.role === "student") return <Redirect to="/my-exams" />;
  return <Redirect to="/dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/" component={RootRedirect} />

      {/* Profile — all authenticated roles */}
      <Route path="/profile">
        <ProtectedRoute allowedRoles={["admin", "proctor", "student"]}>
          <AppLayout><Profile /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin / Proctor routes */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={["admin", "proctor"]}>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AppLayout><AdminUsers /></AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/exams/new">
        <ProtectedRoute allowedRoles={["admin", "proctor"]}>
          <AppLayout><NewExam /></AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/exams/:id/monitor">
        {() => (
          <ProtectedRoute allowedRoles={["admin", "proctor"]}>
            <AppLayout><ExamMonitor /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/exams/:id">
        {() => (
          <ProtectedRoute allowedRoles={["admin", "proctor"]}>
            <AppLayout><ExamDetail /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/exams">
        <ProtectedRoute allowedRoles={["admin", "proctor"]}>
          <AppLayout><ExamsList /></AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/students">
        <ProtectedRoute allowedRoles={["admin", "proctor"]}>
          <AppLayout><Students /></AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Student routes */}
      <Route path="/my-exams">
        <ProtectedRoute allowedRoles={["student"]}>
          <AppLayout><MyExams /></AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/my-stats">
        <ProtectedRoute allowedRoles={["student"]}>
          <AppLayout><StudentStats /></AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/exam/:enrollmentId/take">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <TakeExam />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/results/:enrollmentId">
        {() => (
          <ProtectedRoute allowedRoles={["student"]}>
            <AppLayout><Results /></AppLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
