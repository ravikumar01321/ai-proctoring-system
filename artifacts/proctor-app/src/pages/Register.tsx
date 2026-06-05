import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "proctor"]),
});
type RegisterForm = z.infer<typeof registerSchema>;

const fields = [
  { name: "name" as const, label: "Full Name", type: "text", placeholder: "Jane Doe" },
  { name: "email" as const, label: "Email", type: "email", placeholder: "jane@institution.edu" },
  { name: "password" as const, label: "Password", type: "password", placeholder: "Min. 6 characters" },
];

function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
    </div>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        login(res.token, res.user);
        setLocation(res.user.role === "student" ? "/my-exams" : "/dashboard");
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
        toast({ title: "Registration failed", description: msg, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8 relative overflow-hidden" data-testid="register-page">
      <GridOverlay />
      <motion.div className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl -top-20 -right-20 pointer-events-none" animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 6, repeat: Infinity }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 mb-10">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <motion.div className="absolute -inset-1 rounded-xl border border-primary/20" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-[0.3em] text-primary uppercase">AI EXAM</div>
            <div className="text-xs font-bold tracking-widest text-foreground uppercase">PROCTORING SYSTEM</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-muted-foreground text-sm">Join the proctoring platform</p>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                <FormField control={form.control} name={f.name} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">{f.label}</FormLabel>
                    <FormControl>
                      <Input type={f.type} placeholder={f.placeholder} data-testid={`input-${f.name}`} className="h-11 bg-card border-border/80 focus:border-primary/60 transition-colors" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role" className="h-11 bg-card border-border/80">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="proctor">Proctor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.64 }}>
              <Button type="submit" className="w-full h-11 font-semibold tracking-wide relative overflow-hidden" disabled={registerMutation.isPending} data-testid="button-register">
                <motion.div className="absolute inset-0 bg-white/10" initial={{ x: "-100%" }} whileHover={{ x: "100%" }} transition={{ duration: 0.4 }} />
                <AnimatePresence mode="wait">
                  {registerMutation.isPending ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <motion.span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                      Creating account...
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Create account</motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>
        </Form>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <button onClick={() => setLocation("/login")} className="text-primary hover:underline font-medium">Sign in</button>
        </motion.p>
      </motion.div>
    </div>
  );
}
