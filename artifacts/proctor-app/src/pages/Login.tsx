import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user);
          if (res.user.role === "student") {
            setLocation("/my-exams");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: () => {
          toast({ title: "Login failed", description: "Invalid credentials. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex" data-testid="login-page">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">OmniProctor</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light text-foreground leading-relaxed mb-6">
            "Integrity at every keystroke. Vigilance at every frame."
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Exams Monitored", value: "50K+" },
              { label: "AI Detections", value: "2.4M+" },
              { label: "Institutions", value: "300+" },
              { label: "Uptime", value: "99.97%" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-lg bg-background border border-border">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          AI-Powered Proctoring System &mdash; Enterprise Edition
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">OmniProctor</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sign in</h1>
          <p className="text-muted-foreground mb-8">Access your proctoring dashboard</p>

          <div className="mb-6 p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
            <div className="font-medium text-foreground mb-2">Demo credentials:</div>
            <div>Admin: <span className="text-primary">admin@proctorx.com</span> / <span className="text-primary">password123</span></div>
            <div>Proctor: <span className="text-primary">proctor@proctorx.com</span> / <span className="text-primary">password123</span></div>
            <div>Student: <span className="text-primary">student@proctorx.com</span> / <span className="text-primary">password123</span></div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@institution.edu"
                        data-testid="input-email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <button onClick={() => setLocation("/register")} className="text-primary hover:underline">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
