import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Scan, Lock, Cpu, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

const STATS = [
  { label: "Exams Monitored", value: "50K+" },
  { label: "AI Detections", value: "2.4M+" },
  { label: "Institutions", value: "300+" },
  { label: "Uptime", value: "99.97%" },
];

const FEATURES = [
  { icon: Scan, label: "Live Face Detection" },
  { icon: Cpu, label: "AI Violation Analysis" },
  { icon: Lock, label: "Zero-Trust Security" },
  { icon: ShieldCheck, label: "Audit-Ready Reports" },
];

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none"
      animate={{ top: ["8%", "92%", "8%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function PulsingOrb({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

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
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        setLocation(res.user.role === "student" ? "/my-exams" : "/dashboard");
      },
      onError: () => {
        toast({ title: "Access denied", description: "Invalid credentials. Please try again.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden" data-testid="login-page">
      <GridOverlay />
      <PulsingOrb className="w-96 h-96 bg-primary/30 -top-20 -left-20" />
      <PulsingOrb className="w-64 h-64 bg-primary/20 bottom-20 left-40" />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative border-r border-border/50 overflow-hidden">
        <ScanLine />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <motion.div
              className="absolute -inset-1 rounded-xl border border-primary/20"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-[0.3em] text-primary uppercase">AI EXAM</div>
            <div className="text-sm font-bold tracking-widest text-foreground uppercase leading-none">PROCTORING SYSTEM</div>
          </div>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="text-[11px] font-mono tracking-[0.25em] text-primary uppercase mb-4">// System initialized</div>
          <h2 className="text-4xl font-bold text-foreground leading-tight mb-4">
            Intelligence that<br />
            <span className="text-primary">never blinks.</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-sm">
            Military-grade AI monitoring for academic integrity. Every session. Every frame. Every keystroke.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-2.5 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-card border border-border/60 hover:border-primary/40 transition-colors group"
              >
                <f.icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{f.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="text-center"
              >
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[10px] text-muted-foreground font-mono"
        >
          AI EXAM PROCTORING SYSTEM &mdash; Enterprise v2.0 &mdash; All sessions encrypted end-to-end
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <PulsingOrb className="w-80 h-80 bg-primary/15 top-10 right-10" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-3 mb-1">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-[9px] font-mono tracking-[0.3em] text-primary uppercase">AI EXAM PROCTORING SYSTEM</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1">Sign in</h1>
            <p className="text-muted-foreground text-sm">Authenticate to access the proctoring dashboard</p>
          </div>

          {/* Credentials hint */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/15 text-xs space-y-1.5"
          >
            <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Demo Access
            </div>
            {[
              { role: "Admin", email: "admin@proctorx.com" },
              { role: "Proctor", email: "proctor@proctorx.com" },
              { role: "Student", email: "student@proctorx.com" },
            ].map((c) => (
              <div key={c.role} className="flex justify-between text-muted-foreground">
                <span className="font-medium text-foreground/70">{c.role}</span>
                <span className="font-mono text-primary/80">{c.email}</span>
              </div>
            ))}
            <div className="text-muted-foreground pt-0.5">Password: <span className="font-mono text-primary/80">password123</span></div>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@institution.edu" data-testid="input-email" className="h-11 bg-card border-border/80 focus:border-primary/60 transition-colors" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" data-testid="input-password" className="h-11 pr-10 bg-card border-border/80 focus:border-primary/60 transition-colors" {...field} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Button type="submit" className="w-full h-11 font-semibold tracking-wide relative overflow-hidden group" disabled={loginMutation.isPending} data-testid="button-login">
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.4 }}
                  />
                  <AnimatePresence mode="wait">
                    {loginMutation.isPending ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <motion.span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                        Authenticating...
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        Sign in
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>
          </Form>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <button onClick={() => setLocation("/register")} className="text-primary hover:underline font-medium">
              Register
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
